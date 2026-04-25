import type { IDocsService } from '../../types';

export const oracleDocs: IDocsService = {
  buildSearchUrl: (query: string) =>
    `https://docs.oracle.com/en/cloud/?q=${encodeURIComponent(query)}`,
  portalSearchUrl: (q: string) =>
    `https://www.google.com/search?q=site%3Adocs.oracle.com+${encodeURIComponent(q)}`,
  priorityLinks: [
    { url: 'https://docs.oracle.com/en/solutions/oci-best-practices-framework/', title: 'OCI Best Practices Framework' },
    { url: 'https://docs.oracle.com/en/cloud/', title: 'OCI Documentation' },
    { url: 'https://www.oracle.com/cloud/migration/', title: 'OCI Migration' },
    { url: 'https://docs.oracle.com/en/solutions/oci-secure-foundation/', title: 'OCI Secure Foundation Landing Zone' },
  ],
};
