import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

export function registerWorkspaceTools(server: McpServer): void {
  server.tool(
    "get_current_user",
    "Get the authenticated Loraloop user profile, subscription tier, and credit balance",
    {},
    async () => {
      const data = await api("/api/auth/me");
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "list_workspaces",
    "List all Loraloop workspaces accessible by the current user",
    {},
    async () => {
      const data = await api("/api/workspaces");
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "list_projects",
    "List all projects within a workspace — each project represents a brand or client",
    {
      workspaceId: z.string().describe("Workspace ID"),
    },
    async ({ workspaceId }) => {
      const data = await api(`/api/workspaces/${workspaceId}/projects`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_project",
    "Get details of a specific project including brand settings and connected platforms",
    {
      projectId: z.string().describe("Project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_billing",
    "Get billing information, subscription tier, and AI credit usage for the workspace",
    {
      workspaceId: z.string().describe("Workspace ID"),
    },
    async ({ workspaceId }) => {
      const data = await api(`/api/workspaces/${workspaceId}/billing`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_notifications",
    "Get recent Loraloop notifications — agent completions, publishing errors, engagement alerts",
    {
      unreadOnly: z.boolean().default(false),
      limit: z.number().int().min(1).max(50).default(10),
    },
    async ({ unreadOnly, limit }) => {
      const data = await api("/api/notifications", "GET", undefined, {
        ...(unreadOnly && { unread: true }),
        limit,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
