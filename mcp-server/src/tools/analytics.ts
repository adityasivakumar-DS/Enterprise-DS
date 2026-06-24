import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

// Twitter/X intentionally excluded
const Platform = z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube", "all"]);

export function registerAnalyticsTools(server: McpServer): void {
  server.tool(
    "get_performance_overview",
    "Get overall performance metrics — reach, impressions, engagement rate, follower growth across all platforms",
    {
      projectId: z.string().describe("Loraloop project ID"),
      days: z.number().int().min(1).max(365).default(30),
      platform: Platform.default("all"),
    },
    async ({ projectId, days, platform }) => {
      const data = await api(`/api/projects/${projectId}/analytics/overview`, "GET", undefined, {
        days,
        ...(platform !== "all" && { platform }),
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_best_posting_times",
    "Get AI-recommended optimal posting times based on audience activity patterns for each platform",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: z
        .enum(["instagram", "facebook", "twitter", "linkedin", "tiktok"])
        .describe("Platform to get posting time recommendations for"),
    },
    async ({ projectId, platform }) => {
      const data = await api(
        `/api/projects/${projectId}/analytics/scheduling-insights`,
        "GET",
        undefined,
        { platform }
      );
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_engagement_inbox",
    "Get recent engagement items — comments, DMs, mentions across platforms with sentiment analysis",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: Platform.default("all"),
      sentiment: z
        .enum(["positive", "neutral", "negative", "all"])
        .default("all"),
      status: z.enum(["unread", "read", "responded", "all"]).default("unread"),
      limit: z.number().int().min(1).max(100).default(20),
    },
    async ({ projectId, platform, sentiment, status, limit }) => {
      const data = await api(`/api/projects/${projectId}/engagement`, "GET", undefined, {
        ...(platform !== "all" && { platform }),
        ...(sentiment !== "all" && { sentiment }),
        ...(status !== "all" && { status }),
        limit,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_audience_insights",
    "Get audience demographic insights — age, gender, location, peak activity hours",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: z.enum(["instagram", "facebook", "twitter", "linkedin"]),
    },
    async ({ projectId, platform }) => {
      const data = await api(
        `/api/projects/${projectId}/analytics/audience`,
        "GET",
        undefined,
        { platform }
      );
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_top_performing_content",
    "Get the top performing posts ranked by engagement, reach, or saves",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: Platform.default("all"),
      metric: z.enum(["engagement_rate", "reach", "impressions", "saves", "clicks"]).default("engagement_rate"),
      days: z.number().int().min(1).max(365).default(30),
      limit: z.number().int().min(1).max(20).default(5),
    },
    async ({ projectId, platform, metric, days, limit }) => {
      const data = await api(`/api/projects/${projectId}/analytics/top-content`, "GET", undefined, {
        ...(platform !== "all" && { platform }),
        metric,
        days,
        limit,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_ad_performance",
    "Get paid advertising performance — ROAS, CPC, conversions, and spend breakdown from Facebook Ads",
    {
      projectId: z.string().describe("Loraloop project ID"),
      days: z.number().int().min(1).max(90).default(30),
    },
    async ({ projectId, days }) => {
      const data = await api(`/api/projects/${projectId}/analytics/ads`, "GET", undefined, {
        days,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "generate_performance_report",
    "Ask Nick (analytics agent) to generate a comprehensive performance report with insights and recommendations",
    {
      projectId: z.string().describe("Loraloop project ID"),
      period: z.enum(["weekly", "monthly", "quarterly"]).default("monthly"),
      includeRecommendations: z.boolean().default(true),
    },
    async ({ projectId, period, includeRecommendations }) => {
      const data = await api(`/api/projects/${projectId}/agents/nick/run`, "POST", {
        task: `Generate a ${period} performance report`,
        context: includeRecommendations
          ? "Include actionable recommendations for improving each metric"
          : undefined,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
