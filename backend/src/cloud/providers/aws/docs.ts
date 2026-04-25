import type { IDocsService } from '../../types';

export const awsDocs: IDocsService = {
  buildSearchUrl: (query: string) =>
    `https://docs.aws.amazon.com/search/doc-search.html?searchPath=documentation&searchQuery=${encodeURIComponent(query)}`,
  portalSearchUrl: (q: string) =>
    `https://aws.amazon.com/search/?searchQuery=${encodeURIComponent(q)}`,
  priorityLinks: [
    { url: 'https://aws.amazon.com/architecture/well-architected/', title: 'AWS Well-Architected Framework' },
    { url: 'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/aws-overview.html', title: 'AWS Overview' },
    { url: 'https://aws.amazon.com/migration-evaluator/', title: 'AWS Migration Evaluator' },
    { url: 'https://aws.amazon.com/cloud-migration/', title: 'AWS Cloud Migration' },
  ],
};
