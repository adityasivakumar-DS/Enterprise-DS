import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

// Twitter/X intentionally excluded
const Platform = z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube", "pinterest"]);

export function registerPublishingTools(server: McpServer): void {
  server.tool(
    "list_scheduled_posts",
    "List all upcoming scheduled posts across platforms with publish times and content previews",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: Platform.optional().describe("Filter by platform"),
      days: z.number().int().min(1).max(90).default(7).describe("Look ahead days"),
    },
    async ({ projectId, platform, days }) => {
      const data = await api(`/api/projects/${projectId}/scheduled-posts`, "GET", undefined, {
        ...(platform && { platform }),
        days,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "schedule_post",
    "Schedule a content item for publishing on a specific platform and time",
    {
      projectId: z.string().describe("Loraloop project ID"),
      contentId: z.string().describe("Approved content item ID to schedule"),
      platform: Platform,
      scheduledAt: z
        .string()
        .describe("ISO 8601 datetime to publish (e.g. 2025-06-01T14:00:00Z)"),
      platformAccountId: z.string().optional().describe("Specific Instagram/Facebook account ID"),
    },
    async ({ projectId, contentId, platform, scheduledAt, platformAccountId }) => {
      const data = await api(`/api/projects/${projectId}/scheduled-posts`, "POST", {
        contentId,
        platform,
        scheduledAt,
        platformAccountId,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_published_posts",
    "Get recently published posts with performance metrics (reach, impressions, engagement rate)",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: Platform.optional(),
      days: z.number().int().min(1).max(90).default(30),
      limit: z.number().int().min(1).max(100).default(20),
    },
    async ({ projectId, platform, days, limit }) => {
      const data = await api(`/api/projects/${projectId}/published-posts`, "GET", undefined, {
        ...(platform && { platform }),
        days,
        limit,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_content_calendar",
    "Get the marketing content calendar — a timeline of planned and scheduled content across all platforms",
    {
      projectId: z.string().describe("Loraloop project ID"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date (YYYY-MM-DD)"),
    },
    async ({ projectId, startDate, endDate }) => {
      const data = await api(`/api/projects/${projectId}/content-calendar`, "GET", undefined, {
        startDate,
        endDate,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "list_platform_connections",
    "List all connected social media platform accounts (Instagram, Facebook, etc.) and their OAuth token status",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      const data = await api(`/api/projects/${projectId}/platform-connections`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "cancel_scheduled_post",
    "Cancel a scheduled post before it goes live",
    {
      projectId: z.string().describe("Loraloop project ID"),
      scheduledPostId: z.string().describe("Scheduled post ID to cancel"),
    },
    async ({ projectId, scheduledPostId }) => {
      const data = await api(
        `/api/projects/${projectId}/scheduled-posts/${scheduledPostId}/cancel`,
        "PATCH"
      );
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
