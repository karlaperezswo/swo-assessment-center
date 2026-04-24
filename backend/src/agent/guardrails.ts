/**
 * Application-layer guardrails for the AI copilot. Runs BEFORE we hand the
 * message to the orchestrator. Cheap, deterministic checks that complement
 * (do not replace) the Bedrock Guardrail running on the model side.
 *
 * Three concerns covered here:
 *  - input shape       (length cap on message + pageContext)
 *  - jailbreak heuristic (well-known prompt-injection / role-override patterns)
 *  - tenant isolation   (existing thread must belong to caller's orgId)
 */

import type { AgentThread } from '../db/AgentThreadRepository';

export const MAX_MESSAGE_CHARS = 8000;
export const MAX_PAGE_CONTEXT_BYTES = 5_000;

const JAILBREAK_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
  /forget\s+(everything|all\s+previous|your\s+instructions)/i,
  /(you\s+are|act\s+as|pretend\s+to\s+be|roleplay\s+as)\s+(now\s+)?(an?\s+)?(unrestricted|uncensored|developer|dan|jailbroken|admin|root)/i,
  /\bDAN\b\s+mode/i,
  /developer\s+mode\s+(enabled|on|activated)/i,
  /(reveal|show|print|output|leak|dump|expose)\s+(your\s+)?(system\s+prompt|initial\s+prompt|instructions|hidden\s+rules)/i,
  /(repeat|recite)\s+(your|the)\s+(system|initial)\s+(prompt|message|instructions)/i,
  /<\s*\/?\s*(system|runtime_context|instructions)\s*>/i,
  /\bnew\s+system\s+prompt\b/i,
];

export type GuardrailDecision =
  | { ok: true }
  | { ok: false; reason: string; code: GuardrailCode };

export type GuardrailCode =
  | 'message_too_long'
  | 'page_context_too_large'
  | 'jailbreak_pattern'
  | 'tenant_mismatch';

export interface GuardrailInput {
  message: string;
  pageContext?: Record<string, unknown>;
  caller: { sub?: string; orgId?: string };
  existingThread?: AgentThread | null;
}

export function evaluateInput(input: GuardrailInput): GuardrailDecision {
  if (input.message.length > MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      code: 'message_too_long',
      reason: `message exceeds ${MAX_MESSAGE_CHARS} chars`,
    };
  }

  if (input.pageContext) {
    const size = Buffer.byteLength(JSON.stringify(input.pageContext), 'utf8');
    if (size > MAX_PAGE_CONTEXT_BYTES) {
      return {
        ok: false,
        code: 'page_context_too_large',
        reason: `pageContext is ${size} bytes (max ${MAX_PAGE_CONTEXT_BYTES})`,
      };
    }
  }

  for (const re of JAILBREAK_PATTERNS) {
    if (re.test(input.message)) {
      return {
        ok: false,
        code: 'jailbreak_pattern',
        reason: 'message matches a known prompt-injection pattern',
      };
    }
  }

  if (input.existingThread && input.caller.orgId) {
    const threadOrg = input.existingThread.orgId;
    if (threadOrg && threadOrg !== input.caller.orgId) {
      return {
        ok: false,
        code: 'tenant_mismatch',
        reason: 'thread belongs to a different organization',
      };
    }
  }

  return { ok: true };
}

/**
 * User-facing message for a blocked decision. Vague on purpose so we don't
 * teach attackers which pattern matched.
 */
export function userMessageFor(code: GuardrailCode): string {
  switch (code) {
    case 'tenant_mismatch':
      return 'No tienes acceso a este hilo de conversación.';
    case 'jailbreak_pattern':
      return 'No puedo procesar mensajes que intenten redefinir mi comportamiento. Reformula tu pregunta sobre el assessment.';
    case 'message_too_long':
      return `Tu mensaje supera el límite (${MAX_MESSAGE_CHARS} caracteres). Acórtalo, por favor.`;
    case 'page_context_too_large':
      return 'El contexto de la pantalla es demasiado grande para procesar.';
  }
}
