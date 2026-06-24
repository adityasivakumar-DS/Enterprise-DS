#!/usr/bin/env node
/**
 * Stdio transport entry point — for Claude Code (CLI) and Claude Desktop.
 *
 * Claude Code:
 *   claude mcp add --transport stdio loraloop -- node build/mcp/index.js
 *
 * Claude Desktop (~/.../claude_desktop_config.json):
 *   { "mcpServers": { "loraloop": { "command": "node", "args": ["build/mcp/index.js"] } } }
 */
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildMcpServer } from "./server.js";
import { getBaseUrl } from "../client.js";

async function main() {
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Loraloop MCP (stdio) — connected to ${getBaseUrl()}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
