import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

// Twitter/X intentionally excluded
const Platform = z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube", "pinterest"]);

export function registerContentTools(server: McpServer): void {
  server.tool(
    "list_content",
    "List all content items in the Loraloop content library (drafts, approved, archived)",
    {
      projectId: z.string().describe("Loraloop project ID"),
      status: z
        .enum(["draft", "pending_approval", "approved", "rejected", "archived", "all"])
        .default("all"),
      type: z
        .enum(["post", "blog", "email", "video_script", "ad_copy", "all"])
        .default("all"),
      limit: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).default(1),
    },
    async ({ projectId, status, type, limit, page }) => {
      const data = await api(`/api/projects/${projectId}/content`, "GET", undefined, {
        ...(status !== "all" && { status }),
        ...(type !== "all" && { type }),
        limit,
        page,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_content_item",
    "Get a specific content item with all its details, generated copy, and approval status",
    {
      projectId: z.string().describe("Loraloop project ID"),
      contentId: z.string().describe("Content item ID"),
    },
    async ({ projectId, contentId }) => {
      const data = await api(`/api/projects/${projectId}/content/${contentId}`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "generate_content",
    "Ask Clara (content agent) to generate a new piece of content — social post, blog, email, or ad copy",
    {
      projectId: z.string().describe("Loraloop project ID"),
      type: z.enum(["social_post", "blog_post", "email", "ad_copy", "video_script", "caption"]),
      platform: Platform.optional().describe("Target platform (for social content)"),
      brief: z.string().describe("Content brief — topic, goal, tone, key messages, call to action"),
      tone: z
        .enum(["professional", "casual", "humorous", "inspirational", "educational", "promotional"])
        .optional(),
      wordCount: z.number().int().min(10).max(3000).optional().describe("Approximate word count"),
    },
    async ({ projectId, type, platform, brief, tone, wordCount }) => {
      const data = await api(`/api/projects/${projectId}/content/generate`, "POST", {
        type,
        platform,
        brief,
        tone,
        wordCount,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "approve_content",
    "Approve a content item so it can be scheduled or published",
    {
      projectId: z.string().describe("Loraloop project ID"),
      contentId: z.string().describe("Content item ID to approve"),
      feedback: z.string().optional().describe("Optional approval feedback or notes"),
    },
    async ({ projectId, contentId, feedback }) => {
      const data = await api(`/api/projects/${projectId}/content/${contentId}/approve`, "PATCH", {
        feedback,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_ai_generations",
    "Get history of all AI-generated content with quality scores, brand fit, and goal alignment ratings",
    {
      projectId: z.string().describe("Loraloop project ID"),
      limit: z.number().int().min(1).max(50).default(10),
      approvalStatus: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
    },
    async ({ projectId, limit, approvalStatus }) => {
      const data = await api(`/api/projects/${projectId}/ai-generations`, "GET", undefined, {
        limit,
        ...(approvalStatus !== "all" && { status: approvalStatus }),
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_creative_assets",
    "List creative assets (AI-generated images, video concepts) with approval pipeline status",
    {
      projectId: z.string().describe("Loraloop project ID"),
      status: z.enum(["pending", "approved", "rejected", "all"]).default("all"),
    },
    async ({ projectId, status }) => {
      const data = await api(`/api/projects/${projectId}/creative-assets`, "GET", undefined, {
        ...(status !== "all" && { status }),
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
