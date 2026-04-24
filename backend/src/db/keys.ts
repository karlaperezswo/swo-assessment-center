/**
 * Centralised key builders for the single-table design.
 *
 * Every entity's partition/sort key pattern lives here so controllers and
 * services never concatenate strings by hand. Keeping this one-file-fits-all
 * avoids typos and makes it easy to introspect the schema.
 */

export const keys = {
  org: {
    pk: (orgId: string) => `ORG#${orgId}`,
    meta: { sk: 'META' },
    membership: (userId: string) => ({ sk: `USER#${userId}` }),
  },

  user: {
    pk: (userId: string) => `USER#${userId}`,
    profile: { sk: 'PROFILE' },
    mcpKey: (keyId: string) => ({ sk: `MCPKEY#${keyId}` }),
    byEmail: (email: string) => ({
      gsi1pk: `EMAIL#${email.toLowerCase()}`,
      gsi1sk: 'PROFILE',
    }),
  },

  session: {
    pk: (sessionId: string) => `SESSION#${sessionId}`,
    meta: { sk: 'META' },
    assessment: (kind: 'MPA' | 'MRA' | 'QUESTIONNAIRE') => ({
      sk: `ASSESSMENT#${kind}`,
    }),
    opportunity: (oppId: string) => ({ sk: `OPP#${oppId}` }),
    document: (docId: string) => ({ sk: `DOC#${docId}` }),
    agentThread: (threadId: string) => ({ sk: `AGENT#${threadId}` }),
    byOrg: (orgId: string, createdAt: string) => ({
      gsi1pk: `ORG#${orgId}`,
      gsi1sk: `SESSION#${createdAt}`,
    }),
    byOwner: (ownerId: string, createdAt: string) => ({
      gsi2pk: `OWNER#${ownerId}`,
      gsi2sk: `SESSION#${createdAt}`,
    }),
  },

  audit: {
    pk: (date: string) => `AUDIT#${date}`, // yyyy-mm-dd
    entry: (ts: string, userId: string) => ({ sk: `${ts}#${userId}` }),
  },
} as const;

export const OPPORTUNITY_SK_PREFIX = 'OPP#';
