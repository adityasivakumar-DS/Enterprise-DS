import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

export function registerBrandTools(server: McpServer): void {
  server.tool(
    "get_brand_dna",
    "Get the Brand DNA profile for a project — tone, voice, visual identity, competitors, and messaging pillars",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}/brand-dna`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "search_brand_knowledge",
    "Semantic search across the brand knowledge base (RAG-indexed chunks of brand docs, website content, and uploads)",
    {
      projectId: z.string().describe("Loraloop project ID"),
      query: z.string().describe("Natural language search query"),
      limit: z.number().int().min(1).max(20).default(5).describe("Number of results"),
    },
    async ({ projectId, query, limit }) => {
      const data = await api(`/api/projects/${projectId}/brand-knowledge/search`, "POST", {
        query,
        limit,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "list_brand_documents",
    "List all uploaded brand knowledge documents (PDFs, Word docs, URLs) for a project",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}/brand-knowledge/documents`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_brand_drift_report",
    "Get the latest brand drift report showing messaging consistency across social channels",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}/brand-drift`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_customer_voice_insights",
    "Get customer voice insights — pain points, desires, objections, and emotional language from audience analysis",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}/customer-voice`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_marketing_strategy",
    "Get the active marketing strategy — campaigns, content pillars, goals, and execution plan",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}/marketing-strategy`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
