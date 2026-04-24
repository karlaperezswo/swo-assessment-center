import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AGENT_TOOLS, findTool } from '../agent/tools';
import type { AgentToolContext } from '../agent/tools/types';
import { PROMPTS } from './prompts';
import { RESOURCES } from './resources';

export interface McpServerContext {
  userId: string;
  orgId?: string;
  scopes: string[];
}

/**
 * Build a per-connection MCP server instance.
 *
 * The MCP server exposes tools, resources, and prompts. Tools are the same
 * four already used by the in-app copilot — we reuse the registry in
 * ../agent/tools/ so there's a single source of truth. Adding a new tool to
 * the in-app agent automatically makes it available over MCP.
 *
 * One server per incoming connection so we can scope the AgentToolContext
 * (user, org, scopes) without sharing state between callers.
 */
export function buildMcpServer(ctx: McpServerContext): McpServer {
  const server = new McpServer(
    {
      name: 'swo-assessment-center',
      version: '2.0.0-alpha',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  registerTools(server, ctx);
  registerResources(server);
  registerPrompts(server);

  return server;
}

function zodShapeFor(tool: { input_schema: { properties: Record<string, unknown>; required?: string[] } }) {
  // Best-effort: the registry tools already carry JSON Schema. For the MCP
  // SDK's Zod-compat layer we only need a simple z.object() so Claude/MCP
  // shows the param hints. Exact runtime validation happens inside each
  // tool's run() via the JSON schema Claude already enforces upstream.
  const shape: Record<string, z.ZodTypeAny> = {};
  const required = new Set(tool.input_schema.required ?? []);
  for (const [key, schema] of Object.entries(tool.input_schema.properties ?? {})) {
    const s = schema as { type?: string; enum?: unknown[] };
    let z_: z.ZodTypeAny = z.any();
    if (s.type === 'string') z_ = s.enum ? z.enum(s.enum as [string, ...string[]]) : z.string();
    else if (s.type === 'number') z_ = z.number();
    else if (s.type === 'boolean') z_ = z.boolean();
    else if (s.type === 'array') z_ = z.array(z.any());
    else if (s.type === 'object') z_ = z.record(z.any());
    if (!required.has(key)) z_ = z_.optional();
    shape[key] = z_;
  }
  return shape;
}

function registerTools(server: McpServer, ctx: McpServerContext): void {
  for (const tool of AGENT_TOOLS) {
    // `registerTool` is cast to a looser signature to dodge a known deep-
    // instantiation issue between the SDK's zod-compat types and our
    // dynamic, per-tool shape generation. Runtime behaviour is unchanged.
    const register = server.registerTool.bind(server) as (
      name: string,
      meta: { title: string; description: string; inputSchema: unknown },
      handler: (args: Record<string, unknown>) => Promise<unknown>
    ) => void;

    register(
      tool.name,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: zodShapeFor(tool),
      },
      async (args: Record<string, unknown>) => {
        const impl = findTool(tool.name)!;
        const toolCtx: AgentToolContext = {
          userId: ctx.userId,
          orgId: ctx.orgId,
        };
        try {
          const result = await impl.run(args ?? {}, toolCtx);
          return {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: 'text',
                text: err instanceof Error ? err.message : 'tool error',
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
}

function registerResources(server: McpServer): void {
  for (const r of RESOURCES) {
    server.registerResource(
      r.name,
      r.uri,
      {
        title: r.name,
        description: r.description,
        mimeType: r.mimeType,
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: r.mimeType,
            text: r.text,
          },
        ],
      })
    );
  }
}

function registerPrompts(server: McpServer): void {
  for (const p of PROMPTS) {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const a of p.arguments ?? []) {
      shape[a.name] = a.required ? z.string() : z.string().optional();
    }
    const registerPrompt = server.registerPrompt.bind(server) as (
      name: string,
      meta: { title: string; description: string; argsSchema: unknown },
      handler: (args: Record<string, string>) => Promise<unknown>
    ) => void;

    registerPrompt(
      p.name,
      {
        title: p.name,
        description: p.description,
        argsSchema: shape,
      },
      async (args: Record<string, string>) => ({
        messages: [...p.messages(args)],
      })
    );
  }
}
