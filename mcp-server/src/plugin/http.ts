#!/usr/bin/env node
/**
 * HTTP + OAuth plugin — src/plugin/http.ts
 *
 * Enables connection via Claude.ai → Customize → Connectors:
 *   Name: Loraloop
 *   URL:  https://mcp.loraloop.com/api/mcp
 *   (Optional) OAuth Client ID: loraloop-claude
 *
 * Start: HTTP_PORT=3001 MCP_BASE_URL=https://mcp.loraloop.com node build/plugin/http.js
 */
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { buildMcpServer } from "../mcp/server.js";
import { getBaseUrl, withToken } from "../client.js";
import {
  loraLoopOAuthProvider,
  loginPageHtml,
  loginWithLoraloop,
  issuePendingAuthCode,
  getUserJwtFromToken,
  CLAUDE_CLIENT_ID,
} from "./oauth.js";

const HTTP_PORT = parseInt(process.env.HTTP_PORT ?? "3001");
const MCP_BASE_URL = (process.env.MCP_BASE_URL ?? `http://localhost:${HTTP_PORT}`).replace(/\/$/, "");

const app = express();

// ── CORS — allow Claude.ai and claude.ai subdomains ───────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "";
  const allowed =
    origin.endsWith(".claude.ai") ||
    origin === "https://claude.ai" ||
    origin === "https://anthropic.com";

  res.setHeader("Access-Control-Allow-Origin", allowed ? origin : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, mcp-session-id, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── 1. OAuth authorization server (/.well-known/*, /oauth/*) ──────────────
app.use(
  mcpAuthRouter({
    provider: loraLoopOAuthProvider,
    issuerUrl: new URL(MCP_BASE_URL),
    resourceName: "Loraloop MCP",
    scopesSupported: ["loraloop:read", "loraloop:write"],
    serviceDocumentationUrl: new URL("https://github.com/Tamilarasan20/Loraloop-Main-App/tree/main/mcp-server"),
  })
);

// ── 2. Login page (GET) ───────────────────────────────────────────────────
app.get("/oauth/login", (req: Request, res: Response) => {
  const pendingId = String(req.query.pending ?? "");
  if (!pendingId) { res.status(400).send("Missing pending authorization"); return; }
  res.type("html").send(loginPageHtml(pendingId));
});

// ── 3. Login form submit (POST) ───────────────────────────────────────────
app.post("/oauth/login-submit", async (req: Request, res: Response) => {
  const { email, password, pending: pendingId } = req.body as {
    email?: string; password?: string; pending?: string;
  };

  if (!email || !password || !pendingId) {
    res.status(400).send("Missing required fields");
    return;
  }

  const { pending, issueCode } = issuePendingAuthCode(pendingId);
  if (!pending) {
    res.type("html").send(loginPageHtml(pendingId, "Session expired. Please try connecting again."));
    return;
  }

  try {
    const userJwt = await loginWithLoraloop(email, password);
    const authCode = issueCode(userJwt);
    const redirectUrl = new URL(pending.params.redirectUri);
    redirectUrl.searchParams.set("code", authCode);
    if (pending.params.state) redirectUrl.searchParams.set("state", pending.params.state);
    res.redirect(redirectUrl.toString());
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed";
    res.type("html").send(loginPageHtml(pendingId, msg));
  }
});

// ── 4. MCP endpoint (/api/mcp) ────────────────────────────────────────────
const activeSessions = new Map<string, StreamableHTTPServerTransport>();

const bearerAuth = requireBearerAuth({
  verifier: loraLoopOAuthProvider,
  resourceMetadataUrl: `${MCP_BASE_URL}/.well-known/oauth-protected-resource`,
});

// GET — SSE keep-alive for existing sessions (no auth required on GET probe)
app.get("/api/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && activeSessions.has(sessionId)) {
    const transport = activeSessions.get(sessionId)!;
    const token = (req as Request & { auth?: { token: string } }).auth?.token ?? "";
    const userJwt = getUserJwtFromToken(token) ?? token;
    await withToken(userJwt, () => transport.handleRequest(req, res));
  } else {
    res.status(404).json({ error: "No active session. Send a POST to /api/mcp to initialize." });
  }
});

// POST — initialize or continue session (requires Bearer auth)
app.post("/api/mcp", bearerAuth, async (req: Request, res: Response) => {
  const mcpToken = (req as Request & { auth?: { token: string } }).auth?.token ?? "";
  const userJwt = getUserJwtFromToken(mcpToken) ?? mcpToken;
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && activeSessions.has(sessionId)) {
    const transport = activeSessions.get(sessionId)!;
    await withToken(userJwt, () => transport.handleRequest(req, res, req.body));
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      activeSessions.set(id, transport);
      transport.onclose = () => activeSessions.delete(id);
    },
  });

  const server = buildMcpServer();
  await server.connect(transport);
  await withToken(userJwt, () => transport.handleRequest(req, res, req.body));
});

// DELETE — close session
app.delete("/api/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && activeSessions.has(sessionId)) {
    await activeSessions.get(sessionId)!.close();
    activeSessions.delete(sessionId);
  }
  res.status(204).end();
});

// ── 5. Health ─────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    loraloop: getBaseUrl(),
    sessions: activeSessions.size,
    mcp: `${MCP_BASE_URL}/api/mcp`,
    staticClientId: CLAUDE_CLIENT_ID,
  });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(HTTP_PORT, () => {
  console.log(`\nLoraloop MCP Plugin (HTTP + OAuth) — Express v4`);
  console.log(`  Connector URL  : ${MCP_BASE_URL}/api/mcp`);
  console.log(`  Static ClientID: ${CLAUDE_CLIENT_ID}  ← paste this in Claude.ai if prompted`);
  console.log(`  OAuth issuer   : ${MCP_BASE_URL}`);
  console.log(`  Health check   : ${MCP_BASE_URL}/health`);
  console.log(`  Loraloop API   : ${getBaseUrl()}\n`);
});
