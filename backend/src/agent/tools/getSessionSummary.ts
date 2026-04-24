import { getOpportunityStorage } from '../../services/opportunityStorageFactory';
import type { AgentTool } from './types';

interface Input {
  sessionId?: string;
}

export const getSessionSummaryTool: AgentTool<Input> = {
  name: 'get_session_summary',
  description:
    'Return a concise summary of the current assessment session: client name, ' +
    'current phase, number of opportunities and their aggregate estimated ARR. ' +
    'Use this when the user asks "where are we", "what do we have", or similar.',
  input_schema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Session ID. Defaults to the current session context.',
      },
    },
    additionalProperties: false,
  },
  async run(input, ctx) {
    const sessionId = input.sessionId ?? ctx.sessionId;
    if (!sessionId) {
      return { error: 'no sessionId available in context' };
    }
    const storage = getOpportunityStorage();
    const opportunities = await storage.getOpportunities(sessionId);
    const totalARR = opportunities.reduce((sum, o) => sum + (o.estimatedARR ?? 0), 0);
    const byPriority = opportunities.reduce<Record<string, number>>((acc, o) => {
      acc[o.priority] = (acc[o.priority] ?? 0) + 1;
      return acc;
    }, {});
    return {
      sessionId,
      opportunityCount: opportunities.length,
      estimatedARR: totalARR,
      byPriority,
      phaseContext: ctx.pageContext ?? null,
    };
  },
};
