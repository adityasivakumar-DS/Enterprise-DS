import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, fmt } from "../client.js";

const AgentName = z.enum(["lora", "sam", "clara", "steve", "sarah", "elliot", "elena", "nick"]);
type AgentName = z.infer<typeof AgentName>;

const AGENT_DESCRIPTIONS: Record<AgentName, string> = {
  lora: "Marketing lead — creates execution plans and coordinates other agents",
  sam: "Strategist — monitors trends, competitors, and market signals",
  clara: "Content writer — blogs, emails, captions, and social posts",
  steve: "Creative producer — generates images, video scripts, and visual assets",
  sarah: "Social media manager — scheduling, engagement, and community management",
  elliot: "Email marketer — nurture sequences, newsletters, and campaign management",
  elena: "Ads manager — paid social campaigns, targeting, and ROAS optimization",
  nick: "Analyst — performance tracking, reporting, and data-driven recommendations",
};

export function registerAgentTools(server: McpServer): void {
  server.tool(
    "list_agents",
    "List all Loraloop AI agents with their descriptions and current status",
    {
      projectId: z.string().describe("Loraloop project ID"),
    },
    async ({ projectId }) => {
      try {
        const data = await api(`/api/projects/${projectId}/agents`);
        return { content: [{ type: "text", text: fmt(data) }] };
      } catch {
        const agents = Object.entries(AGENT_DESCRIPTIONS).map(([name, description]) => ({
          name,
          description,
          status: "unknown",
        }));
        return { content: [{ type: "text", text: fmt({ agents }) }] };
      }
    }
  );

  server.tool(
    "trigger_agent",
    "Trigger a Loraloop AI agent to run a specific task (e.g. ask Clara to write a post, ask Nick to generate a report)",
    {
      projectId: z.string().describe("Loraloop project ID"),
      agent: AgentName.describe(
        "Agent name: lora (strategist), sam (trends), clara (content), steve (creative), sarah (social), elliot (email), elena (ads), nick (analytics)"
      ),
      task: z.string().describe("Natural language description of the task to execute"),
      context: z.string().optional().describe("Additional context or instructions for the agent"),
    },
    async ({ projectId, agent, task, context }) => {
      const data = await api(`/api/projects/${projectId}/agents/${agent}/run`, "POST", {
        task,
        context,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_agent_output",
    "Get the latest outputs and generated content from a specific agent",
    {
      projectId: z.string().describe("Loraloop project ID"),
      agent: AgentName.describe("Agent name"),
      limit: z.number().int().min(1).max(50).default(10).describe("Number of recent outputs"),
    },
    async ({ projectId, agent, limit }) => {
      const data = await api(`/api/projects/${projectId}/agents/${agent}/outputs`, "GET", undefined, {
        limit,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_agent_memory",
    "Get an agent's semantic memory — past decisions, learned preferences, and campaign context",
    {
      projectId: z.string().describe("Loraloop project ID"),
      agent: AgentName.describe("Agent name"),
      memoryType: z
        .enum(["short", "long", "campaign"])
        .default("long")
        .describe("Memory horizon: short (recent), long (persistent), campaign (goal-scoped)"),
    },
    async ({ projectId, agent, memoryType }) => {
      const data = await api(`/api/projects/${projectId}/agents/${agent}/memory`, "GET", undefined, {
        type: memoryType,
      });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "list_agent_tasks",
    "List marketing tasks assigned to agents — see task queue, dependencies, and completion status",
    {
      projectId: z.string().describe("Loraloop project ID"),
      status: z
        .enum(["pending", "in_progress", "completed", "failed", "all"])
        .default("all")
        .describe("Filter by task status"),
    },
    async ({ projectId, status }) => {
      const data = await api(
        `/api/projects/${projectId}/marketing-tasks`,
        "GET",
        undefined,
        status !== "all" ? { status } : undefined
      );
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );

  server.tool(
    "get_ai_usage",
    "Get AI credit usage and LLM cost breakdown across agents and providers",
    {
      projectId: z.string().describe("Loraloop project ID"),
      days: z.number().int().min(1).max(90).default(30).describe("Number of days to look back"),
    },
    async ({ projectId, days }) => {
      const data = await api(`/api/projects/${projectId}/ai-usage`, "GET", undefined, { days });
      return { content: [{ type: "text", text: fmt(data) }] };
    }
  );
}
