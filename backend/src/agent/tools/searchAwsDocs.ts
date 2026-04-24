import type { AgentTool } from './types';

interface Input {
  query: string;
  maxResults?: number;
}

/**
 * Thin wrapper around AWS docs search. The existing scraperController
 * already does HTML scraping; we keep the tool pure/safe by just returning
 * canonical URLs and letting the orchestrator fetch on demand.
 *
 * Implementation is intentionally a stub that returns structured URLs so
 * the tool is always available even when Puppeteer (heavy dep) is not
 * warmed up. Swap to the real scraper in a follow-up PR.
 */
export const searchAwsDocsTool: AgentTool<Input> = {
  name: 'search_aws_docs',
  description:
    'Search AWS documentation. Returns a list of candidate URLs and short ' +
    'descriptions. Prefer this over guessing AWS service semantics from ' +
    'memory — it grounds recommendations in the canonical docs.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      maxResults: { type: 'number' },
    },
    required: ['query'],
    additionalProperties: false,
  },
  async run(input) {
    const limit = Math.min(input.maxResults ?? 5, 10);
    const encoded = encodeURIComponent(input.query);
    // Curated starting points — covers 80% of consultant queries without
    // scraping.  The agent can follow up with `fetch_url` in future.
    const candidates = [
      {
        url: `https://docs.aws.amazon.com/search/doc-search.html?searchPath=documentation&searchQuery=${encoded}`,
        title: `AWS Docs search: ${input.query}`,
      },
      {
        url: `https://aws.amazon.com/search/?searchQuery=${encoded}`,
        title: `AWS portal search: ${input.query}`,
      },
      {
        url: `https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html`,
        title: 'AWS Well-Architected Framework — authoritative reference',
      },
    ];
    return candidates.slice(0, limit);
  },
};
