import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";
import { registerBrandTools } from "../tools/brand.js";
import { registerAgentTools } from "../tools/agents.js";
import { registerContentTools } from "../tools/content.js";
import { registerPublishingTools } from "../tools/publishing.js";
import { registerAnalyticsTools } from "../tools/analytics.js";
import { registerChatTools } from "../tools/chat.js";
import { registerWorkspaceTools } from "../tools/workspace.js";
import { registerSocialTools } from "../tools/social.js";

export function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: "loraloop",
    version: "1.1.0",
  });

  // ─── Tools ────────────────────────────────────────────────────────────────
  registerWorkspaceTools(server);
  registerBrandTools(server);
  registerAgentTools(server);
  registerContentTools(server);
  registerPublishingTools(server);
  registerAnalyticsTools(server);
  registerChatTools(server);
  registerSocialTools(server);

  // ─── Resources ────────────────────────────────────────────────────────────
  server.resource(
    "loraloop://brand-dna/{projectId}",
    "Live Brand DNA profile for a Loraloop project",
    async (uri) => {
      const match = uri.href.match(/loraloop:\/\/brand-dna\/(.+)/);
      if (!match) throw new Error("Invalid URI");
      const data = await api(`/api/projects/${match[1]}/brand-dna`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: fmt(data) }] };
    }
  );

  server.resource(
    "loraloop://marketing-strategy/{projectId}",
    "Active marketing strategy and campaign plan for a Loraloop project",
    async (uri) => {
      const match = uri.href.match(/loraloop:\/\/marketing-strategy\/(.+)/);
      if (!match) throw new Error("Invalid URI");
      const data = await api(`/api/projects/${match[1]}/marketing-strategy`);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: fmt(data) }] };
    }
  );

  server.resource(
    "loraloop://agent-outputs/{projectId}/{agentName}",
    "Latest outputs from a Loraloop AI agent",
    async (uri) => {
      const match = uri.href.match(/loraloop:\/\/agent-outputs\/([^/]+)\/(.+)/);
      if (!match) throw new Error("Invalid URI — format: loraloop://agent-outputs/{projectId}/{agentName}");
      const [, projectId, agentName] = match;
      const data = await api(`/api/projects/${projectId}/agents/${agentName}/outputs`, "GET", undefined, { limit: 10 });
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: fmt(data) }] };
    }
  );

  // ─── Prompts ──────────────────────────────────────────────────────────────
  server.prompt(
    "loraloop_write_and_post",
    "Write a social media post here in Claude and publish it directly to Loraloop → social media in one flow",
    {
      projectId: z.string().describe("Your Loraloop project ID"),
      topic: z.string().describe("What the post is about"),
      platforms: z.string().describe("Comma-separated: instagram, facebook, linkedin, tiktok, youtube, pinterest"),
      publishMode: z.enum(["now", "schedule"]).default("now"),
      scheduledAt: z.string().optional().describe("ISO 8601 datetime if scheduling"),
      tone: z.string().optional().describe("Desired tone (casual, professional, inspirational, etc.)"),
    },
    ({ projectId, topic, platforms, publishMode, scheduledAt, tone }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Write and publish a social media post using the Loraloop MCP server.

1. Call get_brand_dna for project ${projectId} — use the brand voice and tone
2. Write a compelling ${tone ? tone + " " : ""}post about: ${topic}
   - Tailor the copy for: ${platforms}
   - Include relevant hashtags
3. Call write_and_publish with:
   - projectId: ${projectId}
   - text: <the post you wrote>
   - platforms: [${platforms.split(",").map((p) => `"${p.trim()}"`).join(", ")}]
   - publishMode: "${publishMode}"
   ${scheduledAt ? `- scheduledAt: "${scheduledAt}"` : ""}
4. Report what was published and the Loraloop content ID.`,
        },
      }],
    })
  );

  server.prompt(
    "loraloop_content_brief",
    "Generate content using Loraloop's Clara agent aligned to your Brand DNA",
    {
      projectId: z.string().describe("Your Loraloop project ID"),
      contentType: z.enum(["social_post", "blog_post", "email_campaign", "ad_copy"]),
      goal: z.string().describe("What you want to achieve with this content"),
      platform: z.string().optional().describe("Target platform"),
    },
    ({ projectId, contentType, goal, platform }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Using the Loraloop MCP server:
1. get_brand_dna for project ${projectId}
2. generate_content — type: ${contentType}${platform ? `, platform: ${platform}` : ""}
   Goal: ${goal}
   Ensure content matches brand voice from Brand DNA.
3. Show full output and suggest best publish time using get_best_posting_times.`,
        },
      }],
    })
  );

  server.prompt(
    "loraloop_weekly_review",
    "Run a weekly performance review using Loraloop analytics",
    { projectId: z.string().describe("Your Loraloop project ID") },
    ({ projectId }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Loraloop weekly review for project ${projectId}:
1. get_performance_overview (last 7 days)
2. get_top_performing_content (last 7 days)
3. get_engagement_inbox (unread)
4. list_scheduled_posts (next 7 days)
5. generate_performance_report (weekly, with recommendations)

Format as: key metrics, top content, pending engagement, next week schedule, recommendations.`,
        },
      }],
    })
  );

  server.prompt(
    "loraloop_campaign_launch",
    "Plan and launch a full marketing campaign using all Loraloop agents",
    {
      projectId: z.string().describe("Your Loraloop project ID"),
      campaignGoal: z.string().describe("Campaign objective"),
      timeline: z.string().describe("Campaign timeline (e.g. 4 weeks)"),
      budget: z.string().optional().describe("Budget if running paid ads"),
    },
    ({ projectId, campaignGoal, timeline, budget }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Launch a marketing campaign for project ${projectId}:
Goal: ${campaignGoal} | Timeline: ${timeline}${budget ? ` | Budget: ${budget}` : " | Organic"}

1. get_brand_dna
2. get_marketing_strategy
3. ask_lora_strategy — create ${timeline} campaign plan
4. trigger_agent (clara) — generate core content
5. get_best_posting_times — optimal schedule per platform
6. get_content_calendar — full schedule view

Deliver: strategy overview, weekly content plan, platform schedule, KPIs.`,
        },
      }],
    })
  );

  return server;
}
