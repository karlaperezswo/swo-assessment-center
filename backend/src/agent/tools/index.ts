import { estimateCostTool } from './estimateCost';
import { getSessionSummaryTool } from './getSessionSummary';
import { listOpportunitiesTool } from './listOpportunities';
import { searchAwsDocsTool } from './searchAwsDocs';
import type { AgentTool, AgentToolContext, ToolCall, ToolResult } from './types';

export const AGENT_TOOLS: AgentTool[] = [
  getSessionSummaryTool,
  listOpportunitiesTool,
  searchAwsDocsTool,
  estimateCostTool,
];

const BY_NAME = new Map(AGENT_TOOLS.map((t) => [t.name, t]));

export function findTool(name: string): AgentTool | undefined {
  return BY_NAME.get(name);
}

/**
 * Claude `tools` array shape — excludes the run() function so we don't
 * accidentally serialise executable code.
 */
export function toolsForBedrock() {
  return AGENT_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));
}

export async function executeTool(
  call: ToolCall,
  ctx: AgentToolContext
): Promise<ToolResult> {
  const tool = findTool(call.name);
  if (!tool) {
    return {
      toolUseId: call.id,
      content: JSON.stringify({ error: `unknown tool: ${call.name}` }),
      isError: true,
    };
  }
  try {
    const result = await tool.run(call.input, ctx);
    return {
      toolUseId: call.id,
      content: JSON.stringify(result),
    };
  } catch (err) {
    return {
      toolUseId: call.id,
      content: JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      isError: true,
    };
  }
}

export type { AgentTool, AgentToolContext, ToolCall, ToolResult };
