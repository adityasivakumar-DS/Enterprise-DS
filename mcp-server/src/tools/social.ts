import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

// Twitter/X intentionally excluded
const SocialPlatform = z.enum(["instagram", "facebook", "linkedin", "tiktok", "youtube", "pinterest"]);
type SocialPlatform = z.infer<typeof SocialPlatform>;

export function registerSocialTools(server: McpServer): void {

  // ── Step 1: Push Claude-written content into Loraloop ───────────────────
  server.tool(
    "push_to_loraloop",
    "Push content written here in Claude into Loraloop's content library as a draft ready to publish. Use this whenever you write a caption, post, or blog in Claude and want to send it to Loraloop.",
    {
      projectId: z.string().describe("Loraloop project ID"),
      text: z.string().describe("The full content text written in Claude to push to Loraloop"),
      platform: SocialPlatform.describe("Target social media platform"),
      type: z
        .enum(["social_post", "caption", "blog_post", "video_script", "ad_copy"])
        .default("social_post"),
      title: z.string().optional().describe("Optional title or label for this content item"),
      hashtags: z.array(z.string()).optional().describe("Hashtags to attach (without # prefix)"),
      notes: z.string().optional().describe("Internal notes for the content team"),
    },
    async ({ projectId, text, platform, type, title, hashtags, notes }) => {
      const data = await api(`/api/projects/${projectId}/content`, "POST", {
        text,
        platform,
        type,
        title: title ?? `Claude-written ${platform} ${type}`,
        hashtags,
        notes,
        source: "claude_mcp",
      });
      return {
        content: [
          {
            type: "text",
            text: `Content pushed to Loraloop successfully.\n\n${fmt(data)}\n\nNext: use publish_now or schedule_to_social to send it live.`,
          },
        ],
      };
    }
  );

  // ── Step 2a: Publish immediately ────────────────────────────────────────
  server.tool(
    "publish_now",
    "Immediately publish a Loraloop content item to a social media platform (Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest). The content must already exist in Loraloop — use push_to_loraloop first if you just wrote it in Claude.",
    {
      projectId: z.string().describe("Loraloop project ID"),
      contentId: z.string().describe("Content item ID from Loraloop (returned by push_to_loraloop or list_content)"),
      platform: SocialPlatform,
      platformAccountId: z
        .string()
        .optional()
        .describe("Specific account/page ID to post from (use get_platform_accounts to list available ones)"),
      autoApprove: z
        .boolean()
        .default(true)
        .describe("Automatically approve the content before publishing (default true)"),
    },
    async ({ projectId, contentId, platform, platformAccountId, autoApprove }) => {
      if (autoApprove) {
        await api(`/api/projects/${projectId}/content/${contentId}/approve`, "PATCH", {
          feedback: "Approved via Claude MCP",
        });
      }

      const data = await api(`/api/projects/${projectId}/posts/publish`, "POST", {
        contentId,
        platform,
        platformAccountId,
        publishAt: "now",
      });

      return {
        content: [
          {
            type: "text",
            text: `Published to ${platform}!\n\n${fmt(data)}`,
          },
        ],
      };
    }
  );

  // ── Step 2b: Schedule to specific time ──────────────────────────────────
  server.tool(
    "schedule_to_social",
    "Schedule a Loraloop content item to be published at a specific date and time on a social platform",
    {
      projectId: z.string().describe("Loraloop project ID"),
      contentId: z.string().describe("Content item ID from Loraloop"),
      platform: SocialPlatform,
      scheduledAt: z.string().describe("When to publish — ISO 8601 datetime (e.g. 2025-06-15T14:00:00Z)"),
      platformAccountId: z.string().optional(),
      autoApprove: z.boolean().default(true),
    },
    async ({ projectId, contentId, platform, scheduledAt, platformAccountId, autoApprove }) => {
      if (autoApprove) {
        await api(`/api/projects/${projectId}/content/${contentId}/approve`, "PATCH", {
          feedback: "Approved via Claude MCP",
        });
      }

      const data = await api(`/api/projects/${projectId}/scheduled-posts`, "POST", {
        contentId,
        platform,
        scheduledAt,
        platformAccountId,
      });

      return {
        content: [
          {
            type: "text",
            text: `Scheduled to ${platform} for ${scheduledAt}.\n\n${fmt(data)}`,
          },
        ],
      };
    }
  );

  // ── Power tool: write → push → publish in one shot ──────────────────────
  server.tool(
    "write_and_publish",
    "Complete one-shot flow: takes content written in Claude, pushes it to Loraloop, and publishes or schedules it to one or more social platforms (Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest). This is the fastest way to go from Claude-written post to live on social media.",
    {
      projectId: z.string().describe("Loraloop project ID"),
      text: z.string().describe("The full post text to publish"),
      platforms: z
        .array(SocialPlatform)
        .min(1)
        .describe("One or more platforms to publish to (e.g. ['instagram', 'facebook'])"),
      publishMode: z
        .enum(["now", "schedule"])
        .default("now")
        .describe("Publish immediately or schedule for a future time"),
      scheduledAt: z
        .string()
        .optional()
        .describe("Required if publishMode is 'schedule' — ISO 8601 datetime (e.g. 2025-06-15T14:00:00Z)"),
      type: z
        .enum(["social_post", "caption", "video_script", "ad_copy"])
        .default("social_post"),
      hashtags: z.array(z.string()).optional().describe("Hashtags without the # symbol"),
      title: z.string().optional(),
    },
    async ({ projectId, text, platforms, publishMode, scheduledAt, type, hashtags, title }) => {
      if (publishMode === "schedule" && !scheduledAt) {
        throw new Error("scheduledAt is required when publishMode is 'schedule'");
      }

      // Step 1: Create content in Loraloop
      const content = await api(`/api/projects/${projectId}/content`, "POST", {
        text,
        type,
        hashtags,
        title: title ?? `Claude post — ${new Date().toISOString().split("T")[0]}`,
        source: "claude_mcp",
        platforms,
      }) as { id: string };

      const contentId = content.id;

      // Step 2: Auto-approve
      await api(`/api/projects/${projectId}/content/${contentId}/approve`, "PATCH", {
        feedback: "Approved via Claude MCP",
      });

      // Step 3: Publish or schedule to each platform
      const results = await Promise.allSettled(
        platforms.map((platform) => {
          if (publishMode === "now") {
            return api(`/api/projects/${projectId}/posts/publish`, "POST", {
              contentId,
              platform,
              publishAt: "now",
            });
          } else {
            return api(`/api/projects/${projectId}/scheduled-posts`, "POST", {
              contentId,
              platform,
              scheduledAt,
            });
          }
        })
      );

      const summary = platforms.map((platform, i) => {
        const result = results[i];
        return result.status === "fulfilled"
          ? `✓ ${platform}: ${publishMode === "now" ? "published" : `scheduled for ${scheduledAt}`}`
          : `✗ ${platform}: ${result.reason?.message ?? "failed"}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Content ID: ${contentId}\n\n${summary.join("\n")}\n\nFull response:\n${fmt(results)}`,
          },
        ],
      };
    }
  );

  // ── Get platform accounts ────────────────────────────────────────────────
  server.tool(
    "get_platform_accounts",
    "Get all connected accounts for a platform — Instagram profiles, Facebook Pages, LinkedIn pages, etc. Use the returned account IDs when publishing.",
    {
      projectId: z.string().describe("Loraloop project ID"),
      platform: SocialPlatform,
    },
    async ({ projectId, platform }) => {
      const data = await api(
        `/api/projects/${projectId}/platform-connections/${platform}/accounts`
      );
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  // ── Get publish status ───────────────────────────────────────────────────
  server.tool(
    "get_publish_status",
    "Check the live publish status of a post — whether it was accepted by the platform, pending, or failed",
    {
      projectId: z.string().describe("Loraloop project ID"),
      publishedPostId: z.string().describe("Published or scheduled post ID"),
    },
    async ({ projectId, publishedPostId }) => {
      const data = await api(`/api/projects/${projectId}/posts/${publishedPostId}/status`);
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  // ── Bulk publish same content to all platforms ───────────────────────────
  server.tool(
    "publish_to_all_platforms",
    "Publish a Loraloop content item to all connected social platforms at once (Instagram, Facebook, LinkedIn, TikTok — wherever the project has active connections). Skips Twitter/X.",
    {
      projectId: z.string().describe("Loraloop project ID"),
      contentId: z.string().describe("Approved content item ID"),
      publishMode: z.enum(["now", "schedule"]).default("now"),
      scheduledAt: z.string().optional().describe("ISO 8601 datetime — required if publishMode is 'schedule'"),
    },
    async ({ projectId, contentId, publishMode, scheduledAt }) => {
      // Fetch connected platforms (excluding twitter)
      const connections = await api(`/api/projects/${projectId}/platform-connections`) as {
        platform: string;
        accountId: string;
        status: string;
      }[];

      const activePlatforms = (Array.isArray(connections) ? connections : []).filter(
        (c) => c.status === "active" && c.platform !== "twitter"
      );

      if (activePlatforms.length === 0) {
        return {
          content: [{ type: "text", text: "No active platform connections found for this project. Connect platforms in the Loraloop dashboard first." }],
        };
      }

      const results = await Promise.allSettled(
        activePlatforms.map((conn) => {
          if (publishMode === "now") {
            return api(`/api/projects/${projectId}/posts/publish`, "POST", {
              contentId,
              platform: conn.platform,
              platformAccountId: conn.accountId,
              publishAt: "now",
            });
          } else {
            return api(`/api/projects/${projectId}/scheduled-posts`, "POST", {
              contentId,
              platform: conn.platform,
              platformAccountId: conn.accountId,
              scheduledAt,
            });
          }
        })
      );

      const summary = activePlatforms.map((conn, i) => {
        const result = results[i];
        return result.status === "fulfilled"
          ? `✓ ${conn.platform}: ${publishMode === "now" ? "published" : `scheduled for ${scheduledAt}`}`
          : `✗ ${conn.platform}: ${(result as PromiseRejectedResult).reason?.message ?? "failed"}`;
      });

      return {
        content: [{ type: "text", text: summary.join("\n") }],
      };
    }
  );
}
