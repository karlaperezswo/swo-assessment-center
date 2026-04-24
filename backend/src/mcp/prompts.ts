/**
 * Prompt library exposed to MCP clients. Clients (e.g. Claude Desktop) can
 * list these as one-click prompts for common consultant workflows.
 */

export const PROMPTS = [
  {
    name: 'migration-wave-planning',
    description: 'Plan migration waves for an assessment session.',
    arguments: [
      { name: 'sessionId', description: 'Assessment session ID', required: true },
    ],
    messages: (args: Record<string, string>) => [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Analiza la sesión ${args.sessionId} y propón 3–5 waves de migración. Para cada wave indica: nombre, estrategia 7R dominante, servidores candidatos, dependencias resueltas, riesgo, y duración estimada. Usa la herramienta list_opportunities y get_session_summary antes de responder.`,
        },
      },
    ],
  },
  {
    name: 'client-briefing-prep',
    description: 'Draft talking points for a customer-facing briefing.',
    arguments: [
      { name: 'sessionId', description: 'Assessment session ID', required: true },
    ],
    messages: (args: Record<string, string>) => [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Prepárame un briefing de 10 minutos para reunión con el cliente (sesión ${args.sessionId}). Incluye: contexto, 3 hallazgos críticos con evidencia, próximos pasos concretos, y 2 preguntas de validación para el cliente. Markdown limpio.`,
        },
      },
    ],
  },
  {
    name: 'executive-summary-draft',
    description: 'Generate an executive summary for the session.',
    arguments: [
      { name: 'sessionId', description: 'Assessment session ID', required: true },
    ],
    messages: (args: Record<string, string>) => [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Redacta un Executive Summary para el informe de la sesión ${args.sessionId}. 200–300 palabras, tono ejecutivo, sin jerga técnica innecesaria. Estructura: contexto, oportunidades prioritarias, ARR estimado, próximos 30 días. Usa list_opportunities para aterrizar en datos reales.`,
        },
      },
    ],
  },
] as const;

export type PromptDefinition = (typeof PROMPTS)[number];
