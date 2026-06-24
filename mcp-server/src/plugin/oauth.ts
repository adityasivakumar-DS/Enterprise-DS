/**
 * Loraloop OAuth Provider — src/plugin/oauth.ts
 *
 * Implements the MCP SDK's OAuthServerProvider.
 * Flow: Claude.ai → /oauth/authorize → Loraloop login page → auth code → JWT token
 *
 * In production, replace in-memory Maps with Redis or a database.
 */
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import type { OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import { getBaseUrl } from "../client.js";

// ── Static pre-registered Client ID for Claude.ai ─────────────────────────
// Users paste this into Claude.ai → Connector Settings → OAuth Client ID
// if dynamic registration fails.
export const CLAUDE_CLIENT_ID = "loraloop-claude";

// ── In-memory stores (replace with Redis in production) ───────────────────

const registeredClients = new Map<string, OAuthClientInformationFull>();

// Pre-register the static Claude.ai client at startup.
// Accepts any redirect_uri from claude.ai so dynamic lookup isn't needed.
registeredClients.set(CLAUDE_CLIENT_ID, {
  client_id: CLAUDE_CLIENT_ID,
  client_id_issued_at: Math.floor(Date.now() / 1000),
  client_name: "Claude.ai",
  redirect_uris: [
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.ai/oauth/callback",
  ],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  token_endpoint_auth_method: "none",
});

const pendingAuthorizations = new Map<string, {
  client: OAuthClientInformationFull;
  params: AuthorizationParams;
}>();

const authCodes = new Map<string, {
  userJwt: string;
  codeChallenge: string;
  expiresAt: number;
}>();

const issuedTokens = new Map<string, {
  userJwt: string;
  clientId: string;
  expiresAt: number;
}>();

// ── Clients store ─────────────────────────────────────────────────────────
const clientsStore: OAuthRegisteredClientsStore = {
  getClient(clientId: string) {
    return registeredClients.get(clientId);
  },
  // Dynamic registration: accept any client Claude.ai sends, preserve its redirect_uris
  registerClient(client: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">) {
    const full: OAuthClientInformationFull = {
      ...client,
      client_id: randomUUID(),
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };
    registeredClients.set(full.client_id, full);
    console.log(`[OAuth] Registered dynamic client: ${full.client_id} redirect_uris=${JSON.stringify(full.redirect_uris)}`);
    return full;
  },
};

// ── Branded login page HTML ───────────────────────────────────────────────
export function loginPageHtml(pendingId: string, error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Connect Loraloop to Claude</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      background: #0f0f0f; color: #f0f0f0;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
    }
    .card {
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px;
      padding: 40px; width: 100%; max-width: 420px;
    }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px;
    }
    .logo-text { font-size: 20px; font-weight: 700; color: #fff; }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; color: #fff; }
    p  { font-size: 14px; color: #888; margin-bottom: 28px; line-height: 1.5; }
    label { display: block; font-size: 13px; font-weight: 500; color: #ccc; margin-bottom: 6px; }
    input {
      width: 100%; background: #111; border: 1px solid #333; border-radius: 8px;
      padding: 12px 14px; color: #f0f0f0; font-size: 14px; margin-bottom: 16px;
      outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: #6366f1; }
    button {
      width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 8px; padding: 13px;
      font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 4px;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    .error {
      background: #3f1111; border: 1px solid #7f2020; border-radius: 8px;
      padding: 12px 14px; color: #f87171; font-size: 13px; margin-bottom: 18px;
    }
    .footer { margin-top: 24px; font-size: 12px; color: #555; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon"></div>
      <span class="logo-text">Loraloop</span>
    </div>
    <h1>Connect to Claude</h1>
    <p>Sign in to your Loraloop account to give Claude access to your brands, agents, and social media.</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/oauth/login-submit">
      <input type="hidden" name="pending" value="${pendingId}" />
      <label for="email">Email</label>
      <input type="email" id="email" name="email" placeholder="you@company.com" required autocomplete="email" />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Your Loraloop password" required autocomplete="current-password" />
      <button type="submit">Sign in &amp; Connect</button>
    </form>
    <div class="footer">Your credentials are sent directly to Loraloop and never stored by Claude.</div>
  </div>
</body>
</html>`;
}

// ── Loraloop API login ─────────────────────────────────────────────────────
export async function loginWithLoraloop(email: string, password: string): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Invalid credentials: ${err}`);
  }
  const data = (await res.json()) as { accessToken?: string; access_token?: string };
  const token = data.accessToken ?? data.access_token;
  if (!token) throw new Error("No access token in Loraloop login response");
  return token;
}

// ── OAuthServerProvider ───────────────────────────────────────────────────
export const loraLoopOAuthProvider: OAuthServerProvider = {
  get clientsStore() { return clientsStore; },

  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const pendingId = randomUUID();
    pendingAuthorizations.set(pendingId, { client, params });
    setTimeout(() => pendingAuthorizations.delete(pendingId), 10 * 60 * 1000);
    res.redirect(`/oauth/login?pending=${pendingId}`);
  },

  async challengeForAuthorizationCode(_client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const entry = authCodes.get(authorizationCode);
    if (!entry) throw new Error("Unknown or expired authorization code");
    if (Date.now() > entry.expiresAt) { authCodes.delete(authorizationCode); throw new Error("Authorization code expired"); }
    return entry.codeChallenge;
  },

  async exchangeAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<OAuthTokens> {
    const entry = authCodes.get(authorizationCode);
    if (!entry) throw new Error("Unknown or expired authorization code");
    authCodes.delete(authorizationCode);
    const accessToken = `llmcp_${randomUUID().replace(/-/g, "")}`;
    const expiresIn = 3600;
    issuedTokens.set(accessToken, { userJwt: entry.userJwt, clientId: client.client_id, expiresAt: Date.now() + expiresIn * 1000 });
    setTimeout(() => issuedTokens.delete(accessToken), (expiresIn + 3600) * 1000);
    return { access_token: accessToken, token_type: "bearer", expires_in: expiresIn };
  },

  async exchangeRefreshToken(): Promise<OAuthTokens> {
    throw new Error("Refresh tokens not supported — please re-connect");
  },

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const entry = issuedTokens.get(token);
    if (!entry) throw new Error("Invalid or unknown access token");
    if (Date.now() > entry.expiresAt) { issuedTokens.delete(token); throw new Error("Access token expired — please re-connect"); }
    const res = await fetch(`${getBaseUrl()}/api/auth/me`, { headers: { Authorization: `Bearer ${entry.userJwt}` } });
    if (!res.ok) throw new Error("Loraloop session expired — please re-connect");
    return { token, clientId: entry.clientId, scopes: [], extra: { userJwt: entry.userJwt } };
  },
};

// ── Auth code issuer ───────────────────────────────────────────────────────
export function issuePendingAuthCode(pendingId: string): {
  pending: { client: OAuthClientInformationFull; params: AuthorizationParams } | undefined;
  issueCode: (userJwt: string) => string;
} {
  const pending = pendingAuthorizations.get(pendingId);
  return {
    pending,
    issueCode: (userJwt: string) => {
      if (!pending) throw new Error("Pending authorization not found");
      pendingAuthorizations.delete(pendingId);
      const authCode = randomUUID();
      authCodes.set(authCode, { userJwt, codeChallenge: pending.params.codeChallenge, expiresAt: Date.now() + 5 * 60 * 1000 });
      return authCode;
    },
  };
}

export function getUserJwtFromToken(accessToken: string): string | undefined {
  return issuedTokens.get(accessToken)?.userJwt;
}
