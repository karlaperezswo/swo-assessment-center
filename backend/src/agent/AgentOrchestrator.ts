import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { AGENT_SYSTEM_PROMPT } from './systemPrompt';
import { AGENT_TOOLS, executeTool, toolsForBedrock } from './tools';
import type { AgentToolContext, ToolCall } from './tools';

export interface AgentUserMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentStreamEvent {
  type:
    | 'text_delta'
    | 'tool_use_start'
    | 'tool_use_result'
    | 'tool_use_error'
    | 'message_complete'
    | 'error';
  data: Record<string, unknown>;
}

export interface RunOptions {
  messages: AgentUserMessage[];
  context: AgentToolContext;
  modelId?: string;
  maxTokens?: number;
  maxToolIterations?: number;
  onEvent: (event: AgentStreamEvent) => void | Promise<void>;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; input: unknown }
    | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }
  >;
}

const DEFAULT_MODEL = process.env.BEDROCK_MODEL_ID ??
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
const DEFAULT_MAX_TOKENS = Number(process.env.BEDROCK_MAX_TOKENS ?? 2048);

/**
 * Transversal-copilot orchestrator.
 *
 * Runs a tool-use loop on top of Bedrock Claude: streams text to the caller
 * (for the UI), collects tool_use blocks, executes them locally against the
 * registered tool handlers, and feeds results back to Claude until the model
 * returns `stop_reason = end_turn`.
 *
 * Emits events via `onEvent` instead of returning a stream so the caller
 * (our SSE endpoint) can format them however it likes.
 */
export class AgentOrchestrator {
  private readonly client: BedrockRuntimeClient;

  constructor(client?: BedrockRuntimeClient) {
    this.client = client ??
      new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
  }

  async run(opts: RunOptions): Promise<ClaudeMessage[]> {
    const history: ClaudeMessage[] = opts.messages.map((m) => ({
      role: m.role,
      content: [{ type: 'text', text: m.content }],
    }));

    const maxIter = opts.maxToolIterations ?? 6;
    for (let iter = 0; iter < maxIter; iter++) {
      const { assistantMessage, stopReason } = await this.streamTurn(
        history,
        opts
      );
      history.push(assistantMessage);

      const toolUses = assistantMessage.content.filter(
        (b): b is { type: 'tool_use'; id: string; name: string; input: unknown } =>
          b.type === 'tool_use'
      );

      if (stopReason !== 'tool_use' || toolUses.length === 0) {
        await opts.onEvent({
          type: 'message_complete',
          data: { stopReason },
        });
        return history;
      }

      const toolResults = await Promise.all(
        toolUses.map(async (u) => {
          await opts.onEvent({
            type: 'tool_use_start',
            data: { id: u.id, name: u.name, input: u.input },
          });
          const call: ToolCall = {
            id: u.id,
            name: u.name,
            input: (u.input ?? {}) as Record<string, unknown>,
          };
          const result = await executeTool(call, opts.context);
          await opts.onEvent({
            type: result.isError ? 'tool_use_error' : 'tool_use_result',
            data: { id: u.id, name: u.name, content: result.content },
          });
          return {
            type: 'tool_result' as const,
            tool_use_id: result.toolUseId,
            content: result.content,
            is_error: result.isError,
          };
        })
      );

      history.push({ role: 'user', content: toolResults });
    }

    await opts.onEvent({
      type: 'error',
      data: { message: `tool loop exceeded ${maxIter} iterations` },
    });
    return history;
  }

  private async streamTurn(
    history: ClaudeMessage[],
    opts: RunOptions
  ): Promise<{ assistantMessage: ClaudeMessage; stopReason: string }> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: AGENT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      tools: toolsForBedrock(),
      messages: history,
    };

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: opts.modelId ?? DEFAULT_MODEL,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json',
    });

    let response;
    try {
      response = await this.client.send(command);
    } catch (err) {
      // Streaming not available (e.g. model access not granted for streaming).
      // Fall back to non-streaming so the agent still works, just without
      // per-token UX.
      return this.nonStreamingTurn(history, opts);
    }

    const blocks: ClaudeMessage['content'] = [];
    let stopReason = 'end_turn';
    const currentText: { text: string; index: number } = { text: '', index: -1 };
    const toolState = new Map<number, { id: string; name: string; inputJson: string }>();

    if (!response.body) {
      return { assistantMessage: { role: 'assistant', content: [] }, stopReason };
    }

    for await (const chunk of response.body) {
      if (!chunk.chunk?.bytes) continue;
      const raw = new TextDecoder().decode(chunk.chunk.bytes);
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(raw);
      } catch {
        continue;
      }

      const type = event.type as string | undefined;
      if (type === 'content_block_start') {
        const block = event.content_block as { type: string; id?: string; name?: string };
        const index = event.index as number;
        if (block.type === 'text') {
          currentText.index = index;
          currentText.text = '';
        } else if (block.type === 'tool_use') {
          toolState.set(index, {
            id: String(block.id),
            name: String(block.name),
            inputJson: '',
          });
        }
      } else if (type === 'content_block_delta') {
        const delta = event.delta as { type: string; text?: string; partial_json?: string };
        const index = event.index as number;
        if (delta.type === 'text_delta' && delta.text) {
          currentText.text += delta.text;
          await opts.onEvent({
            type: 'text_delta',
            data: { text: delta.text },
          });
        } else if (delta.type === 'input_json_delta' && delta.partial_json !== undefined) {
          const st = toolState.get(index);
          if (st) st.inputJson += delta.partial_json;
        }
      } else if (type === 'content_block_stop') {
        const index = event.index as number;
        if (index === currentText.index && currentText.text) {
          blocks.push({ type: 'text', text: currentText.text });
          currentText.index = -1;
          currentText.text = '';
        } else {
          const tu = toolState.get(index);
          if (tu) {
            let parsed: unknown = {};
            try {
              parsed = tu.inputJson ? JSON.parse(tu.inputJson) : {};
            } catch {
              parsed = {};
            }
            blocks.push({
              type: 'tool_use',
              id: tu.id,
              name: tu.name,
              input: parsed,
            });
            toolState.delete(index);
          }
        }
      } else if (type === 'message_delta') {
        const delta = event.delta as { stop_reason?: string };
        if (delta?.stop_reason) stopReason = delta.stop_reason;
      }
    }

    return {
      assistantMessage: { role: 'assistant', content: blocks },
      stopReason,
    };
  }

  private async nonStreamingTurn(
    history: ClaudeMessage[],
    opts: RunOptions
  ): Promise<{ assistantMessage: ClaudeMessage; stopReason: string }> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: [{ type: 'text', text: AGENT_SYSTEM_PROMPT }],
      tools: toolsForBedrock(),
      messages: history,
    };
    const command = new InvokeModelCommand({
      modelId: opts.modelId ?? DEFAULT_MODEL,
      body: JSON.stringify(payload),
      contentType: 'application/json',
      accept: 'application/json',
    });
    const res = await this.client.send(command);
    const body = new TextDecoder().decode(res.body);
    const parsed = JSON.parse(body) as {
      content: ClaudeMessage['content'];
      stop_reason?: string;
    };
    // Emit the full text as a single chunk so the UI shows something.
    for (const block of parsed.content ?? []) {
      if (block.type === 'text' && block.text) {
        await opts.onEvent({ type: 'text_delta', data: { text: block.text } });
      }
    }
    return {
      assistantMessage: { role: 'assistant', content: parsed.content ?? [] },
      stopReason: parsed.stop_reason ?? 'end_turn',
    };
  }
}

export const AGENT_TOOL_NAMES = AGENT_TOOLS.map((t) => t.name);
