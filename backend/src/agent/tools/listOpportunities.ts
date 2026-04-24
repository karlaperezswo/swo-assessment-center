import { getOpportunityStorage } from '../../services/opportunityStorageFactory';
import type { AgentTool } from './types';

interface Input {
  sessionId?: string;
  priority?: Array<'Alta' | 'Media' | 'Baja'>;
  limit?: number;
}

export const listOpportunitiesTool: AgentTool<Input> = {
  name: 'list_opportunities',
  description:
    'List opportunities generated for a session, optionally filtered by ' +
    'priority. Returns title, priority, estimatedARR, reasoning, and talking ' +
    'points (truncated). Use before drafting narratives so the agent grounds ' +
    'its output in evidence.',
  input_schema: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      priority: {
        type: 'array',
        items: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
      },
      limit: {
        type: 'number',
        description: 'Cap results (default 25 to stay token-friendly).',
      },
    },
    additionalProperties: false,
  },
  async run(input, ctx) {
    const sessionId = input.sessionId ?? ctx.sessionId;
    if (!sessionId) return { error: 'no sessionId available in context' };
    const storage = getOpportunityStorage();
    const all = await storage.getOpportunities(sessionId, {
      priority: input.priority,
    });
    const limit = Math.min(input.limit ?? 25, 100);
    return all.slice(0, limit).map((o) => ({
      id: o.id,
      title: o.title,
      priority: o.priority,
      estimatedARR: o.estimatedARR,
      category: o.category,
      reasoning: o.reasoning?.slice(0, 600),
      talkingPoints: o.talkingPoints?.slice(0, 5),
    }));
  },
};
