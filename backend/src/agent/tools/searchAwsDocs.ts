// Legacy AWS-only docs search. Now an alias of `search_cloud_docs` with the
// provider hard-coded to 'aws' so cached agent threads keep working. New
// agent runs receive the multi-cloud tool from the registry instead.
//
// @deprecated Use `search_cloud_docs` with provider='aws'. Remove in F7.

import type { AgentTool } from './types';
import { searchCloudDocsTool } from './searchCloudDocs';

interface Input {
  query: string;
  maxResults?: number;
}

export const searchAwsDocsTool: AgentTool<Input> = {
  name: 'search_aws_docs',
  description:
    '(legacy) Search AWS documentation. New code should call search_cloud_docs ' +
    'with provider=aws.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      maxResults: { type: 'number' },
    },
    required: ['query'],
    additionalProperties: false,
  },
  async run(input, ctx) {
    return searchCloudDocsTool.run({ provider: 'aws', ...input }, ctx);
  },
};
