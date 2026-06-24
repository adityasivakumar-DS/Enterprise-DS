import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

export function registerChatTools(server: McpServer): void {
  server.tool(
    "chat_with_loraloop",
    "Send a message to Loraloop's AI assistant (Helena) — ask about your brand, strategy, content ideas, or platform performance. Helena has full context of your brand DNA and agent outputs.",
    {
      projectId: z.string().describe("Loraloop project ID"),
      message: z.string().describe("Your message or question for the Loraloop AI assistant"),
      conversationId: z
        .string()
        .optional()
        .describe("Existing conversation ID to continue a thread (omit to start a new conversation)"),
    },
    async ({ projectId, message, conversationId }) => {
      const data = await api(`/api/projects/${projectId}/chat`, "POST", {
        message,
        conversationId,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_chat_history",
    "Get conversation history with the Loraloop AI assistant",
    {
      projectId: z.string().describe("Loraloop project ID"),
      conversationId: z.string().optional().describe("Specific conversation ID (omit for all recent)"),
      limit: z.number().int().min(1).max(100).default(20),
    },
    async ({ projectId, conversationId, limit }) => {
      const path = conversationId
        ? `/api/projects/${projectId}/chat/${conversationId}/messages`
        : `/api/projects/${projectId}/chat/history`;
      const data = await api(path, "GET", undefined, { limit });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "ask_lora_strategy",
    "Ask Lora (the master marketing strategist agent) to create or refine a marketing strategy, campaign plan, or content calendar",
    {
      projectId: z.string().describe("Loraloop project ID"),
      question: z.string().describe("Strategic question or request (e.g. 'Create a 30-day Instagram content plan for our product launch')"),
    },
    async ({ projectId, question }) => {
      const data = await api(`/api/projects/${projectId}/agents/lora/run`, "POST", {
        task: question,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
