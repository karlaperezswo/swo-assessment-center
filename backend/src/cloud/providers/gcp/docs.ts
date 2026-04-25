import type { IDocsService } from '../../types';

export const gcpDocs: IDocsService = {
  buildSearchUrl: (query: string) =>
    `https://cloud.google.com/s/results?q=${encodeURIComponent(query)}`,
  portalSearchUrl: (q: string) =>
    `https://www.google.com/search?q=site%3Acloud.google.com+${encodeURIComponent(q)}`,
  priorityLinks: [
    { url: 'https://cloud.google.com/architecture/framework', title: 'Google Cloud Architecture Framework' },
    { url: 'https://cloud.google.com/docs/overview', title: 'Google Cloud Overview' },
    { url: 'https://cloud.google.com/migrate', title: 'Google Cloud Migration Center' },
    { url: 'https://cloud.google.com/architecture/landing-zones', title: 'Landing Zones on Google Cloud' },
  ],
};
