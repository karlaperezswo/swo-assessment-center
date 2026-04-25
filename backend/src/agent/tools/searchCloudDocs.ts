// Multi-cloud documentation search. Replaces searchAwsDocs with a parametrized
// tool that picks the docs portal of the requested provider. The legacy
// `search_aws_docs` tool stays registered as an alias that routes to this one
// with provider='aws' for backward compatibility with cached agent threads.

import type { AgentTool } from './types';
import type { CloudProvider } from '../../../../shared/types/cloud.types';
import { CLOUD_PROVIDERS } from '../../cloud/registry';

interface Input {
  provider: CloudProvider;
  query: string;
  maxResults?: number;
}

export const searchCloudDocsTool: AgentTool<Input> = {
  name: 'search_cloud_docs',
  description:
    'Search the official documentation portal of a specific cloud provider ' +
    '(AWS, GCP, Azure, or Oracle). Returns candidate URLs grounded in canonical ' +
    'docs. Call this BEFORE answering questions that require service semantics, ' +
    'and call it multiple times in parallel when comparing across clouds.',
  input_schema: {
    type: 'object',
    properties: {
      provider: { type: 'string', enum: ['aws', 'gcp', 'azure', 'oracle'] },
      query: { type: 'string' },
      maxResults: { type: 'number' },
    },
    required: ['provider', 'query'],
    additionalProperties: false,
  },
  async run(input, ctx) {
    const active = ctx.activeProviders ?? ['aws'];
    if (!active.includes(input.provider)) {
      return {
        error:
          `Provider '${input.provider}' is not active in this session. ` +
          `Active providers: ${active.join(', ')}. ` +
          'Suggest the user activates it via the cloud selector.',
      };
    }
    const provider = CLOUD_PROVIDERS[input.provider];
    const limit = Math.min(input.maxResults ?? 5, 10);
    const candidates = [
      { url: provider.docs.buildSearchUrl(input.query), title: `${provider.displayName} docs: ${input.query}` },
      { url: provider.docs.portalSearchUrl(input.query), title: `${provider.displayName} portal: ${input.query}` },
      ...provider.docs.priorityLinks,
    ];
    return candidates.slice(0, limit);
  },
};
