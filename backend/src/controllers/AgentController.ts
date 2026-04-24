import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { AgentOrchestrator } from '../agent/AgentOrchestrator';
import type { AgentUserMessage } from '../agent/AgentOrchestrator';
import { getAgentThreadRepository } from '../db/AgentThreadRepository';
import { getAuditLog } from '../services/AuditLogService';

const chatSchema = z.object({
  threadId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  message: z.string().min(1).max(8000),
  pageContext: z.record(z.unknown()).optional(),
});

const orchestrator = new AgentOrchestrator();

function writeSse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export class AgentController {
  /**
   * POST /api/agent/chat
   * Body: { threadId?, sessionId?, message, pageContext? }
   *
   * Responds with text/event-stream. Events:
   *   thread        — { threadId }
   *   text_delta    — { text }
   *   tool_use_*    — { id, name, input|content }
   *   complete      — { stopReason }
   *   error         — { message }
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    const parse = chatSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({
        success: false,
        error: 'invalid payload',
        details: parse.error.flatten(),
      });
      return;
    }
    const { threadId: incomingThreadId, sessionId, message, pageContext } = parse.data;
    const user = req.user;
    const threadId = incomingThreadId ?? uuidv4();

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();
    writeSse(res, 'thread', { threadId });

    const threads = getAgentThreadRepository();
    let thread = sessionId ? await threads.get(sessionId, threadId) : null;
    if (!thread) {
      thread = {
        sessionId: sessionId ?? 'standalone',
        threadId,
        ownerId: user?.sub ?? 'anonymous',
        orgId: user?.orgId,
        title: message.slice(0, 60),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    thread.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    });

    const turnHistory: AgentUserMessage[] = thread.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    try {
      let assistantText = '';
      await orchestrator.run({
        messages: turnHistory,
        context: {
          sessionId,
          userId: user?.sub,
          orgId: user?.orgId,
          pageContext,
        },
        onEvent: async (ev) => {
          if (ev.type === 'text_delta') {
            const t = (ev.data as { text: string }).text;
            assistantText += t;
            writeSse(res, 'text_delta', { text: t });
          } else if (ev.type === 'tool_use_start') {
            writeSse(res, 'tool_use_start', ev.data);
          } else if (ev.type === 'tool_use_result' || ev.type === 'tool_use_error') {
            writeSse(res, ev.type, ev.data);
          } else if (ev.type === 'message_complete') {
            writeSse(res, 'complete', ev.data);
          } else if (ev.type === 'error') {
            writeSse(res, 'error', ev.data);
          }
        },
      });

      if (assistantText) {
        thread.messages.push({
          role: 'assistant',
          content: assistantText,
          createdAt: new Date().toISOString(),
        });
      }
      await threads.save(thread);
      await getAuditLog().record({
        action: 'agent:chat',
        resource: `thread:${threadId}`,
        actor: {
          userId: user?.sub ?? 'anonymous',
          orgId: user?.orgId,
          role: user?.role,
          ip: req.ip,
        },
        status: 'success',
        metadata: { sessionId, messageLength: message.length },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'agent_error';
      writeSse(res, 'error', { message });
      await getAuditLog().record({
        action: 'agent:chat',
        resource: `thread:${threadId}`,
        actor: {
          userId: user?.sub ?? 'anonymous',
          orgId: user?.orgId,
          role: user?.role,
          ip: req.ip,
        },
        status: 'failure',
        metadata: { error: message },
      });
    } finally {
      res.end();
    }
  };

  /** GET /api/agent/threads/:sessionId/:threadId */
  getThread = async (req: Request, res: Response): Promise<void> => {
    const { sessionId, threadId } = req.params;
    if (!sessionId || !threadId) {
      res.status(400).json({ success: false, error: 'sessionId and threadId required' });
      return;
    }
    const thread = await getAgentThreadRepository().get(sessionId, threadId);
    if (!thread) {
      res.status(404).json({ success: false, error: 'thread not found' });
      return;
    }
    res.json({ success: true, thread });
  };
}
