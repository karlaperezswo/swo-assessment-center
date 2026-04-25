/**
 * Contract for an agent tool. The orchestrator discovers tools via the
 * registry (see ./index.ts) and exposes them to Claude in the
 * `tools` array of InvokeModel. Each tool:
 *  - has a stable `name` Claude will call.
 *  - ships its JSON Schema for arguments (Claude validates against it).
 *  - exposes `run` which is the actual TS implementation.
 */
import type { CloudProvider } from '../../../../shared/types/cloud.types';

export interface AgentToolContext {
  sessionId?: string;
  userId?: string;
  orgId?: string;
  /** Cloud providers in scope for this session. Defaults to ['aws'] when absent. */
  activeProviders?: readonly CloudProvider[];
  /** Whatever the UI flagged as "what the user is looking at". */
  pageContext?: Record<string, unknown>;
}

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  run(input: TInput, ctx: AgentToolContext): Promise<TOutput>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolUseId: string;
  content: string;
  isError?: boolean;
}
