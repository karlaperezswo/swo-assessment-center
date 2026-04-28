import { getOpportunityStorage } from '../../services/opportunityStorageFactory';
import type { Opportunity } from '../../../../shared/types/opportunity.types';
import type { AgentTool } from './types';

interface Input {
  sessionId?: string;
  priority?: string[];
  category?: string[];
  highPriorityOnly?: boolean;
}

const HIGH_LABELS = new Set(['Alta', 'High', 'high', 'alta']);

/**
 * Aggregates the session's identified opportunities into monthly + annual
 * savings figures. Deterministic: no LLM math. The agent is supposed to call
 * this BEFORE giving a number when the consultant asks "how much will the
 * client save per month?".
 */
export const estimateMonthlySavingsTool: AgentTool<Input> = {
  name: 'estimate_monthly_savings',
  description:
    'Compute the monthly and annual savings for the current session by ' +
    'aggregating estimated ARR across opportunities. Returns total monthly, ' +
    'total annual, breakdown by priority and category, opportunity count, ' +
    'and a high-confidence subset (only Alta/High priority items). ' +
    'Use this whenever the user asks "how much will the client save per ' +
    'month/year?", "what is the ROI?", or "is migration worth it?". ' +
    'Do NOT do this math yourself — always call this tool.',
  input_schema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'Defaults to the current session in context.',
      },
      priority: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional priority filter. Accepts Alta/Media/Baja or High/Medium/Low.',
      },
      category: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional category filter (Seguridad, Migración, etc.).',
      },
      highPriorityOnly: {
        type: 'boolean',
        description:
          'Shortcut for priority=["Alta","High"]. Use when user asks for ' +
          '"committed savings" or "high-confidence ROI".',
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
    const all = await storage.getOpportunities(sessionId);
    if (all.length === 0) {
      return {
        sessionId,
        opportunityCount: 0,
        monthlyUSD: 0,
        annualUSD: 0,
        message:
          'La sesión no tiene oportunidades registradas todavía. Sube el ' +
          'MPA y MRA para que el sistema genere oportunidades, o pídelo ' +
          'desde la pantalla de Assess.',
      };
    }

    const priorityFilter = normalizeFilter(input.priority);
    const categoryFilter = normalizeFilter(input.category);
    const highOnly = input.highPriorityOnly === true;

    const filtered = all.filter((o) => {
      if (highOnly && !HIGH_LABELS.has(String(o.priority))) return false;
      if (priorityFilter && !priorityFilter.has(String(o.priority).toLowerCase()))
        return false;
      if (categoryFilter && !categoryFilter.has(String(o.category).toLowerCase()))
        return false;
      return true;
    });

    const annualUSD = filtered.reduce(
      (sum, o) => sum + (Number(o.estimatedARR) || 0),
      0
    );
    const monthlyUSD = annualUSD / 12;

    const byPriority = bucketBy(filtered, (o) => String(o.priority));
    const byCategory = bucketBy(filtered, (o) => String(o.category));
    const highConfidence = all.filter((o) => HIGH_LABELS.has(String(o.priority)));
    const highConfidenceAnnual = highConfidence.reduce(
      (sum, o) => sum + (Number(o.estimatedARR) || 0),
      0
    );

    return {
      sessionId,
      opportunityCount: filtered.length,
      totalOpportunities: all.length,
      monthlyUSD: Math.round(monthlyUSD),
      annualUSD: Math.round(annualUSD),
      threeYearUSD: Math.round(annualUSD * 3),
      averagePerOpportunityUSD:
        filtered.length > 0 ? Math.round(annualUSD / filtered.length) : 0,
      byPriority,
      byCategory,
      highConfidence: {
        count: highConfidence.length,
        annualUSD: Math.round(highConfidenceAnnual),
        monthlyUSD: Math.round(highConfidenceAnnual / 12),
      },
      currency: 'USD',
      assumptions: [
        'Anual = suma de estimatedARR de las oportunidades en alcance.',
        'Mensual = anual / 12 (steady-state, una vez ejecutadas todas).',
        'No incluye costos de implementación ni servicios profesionales.',
        'Cifras alta-confianza = sólo prioridad Alta/High.',
      ],
    };
  },
};

function normalizeFilter(values?: string[]): Set<string> | null {
  if (!values || values.length === 0) return null;
  return new Set(values.map((v) => v.trim().toLowerCase()));
}

function bucketBy(
  items: Opportunity[],
  keyOf: (o: Opportunity) => string
): Record<string, { count: number; annualUSD: number }> {
  const out: Record<string, { count: number; annualUSD: number }> = {};
  for (const o of items) {
    const k = keyOf(o) || 'Sin clasificar';
    if (!out[k]) out[k] = { count: 0, annualUSD: 0 };
    out[k].count += 1;
    out[k].annualUSD += Number(o.estimatedARR) || 0;
  }
  for (const k of Object.keys(out)) {
    out[k].annualUSD = Math.round(out[k].annualUSD);
  }
  return out;
}
