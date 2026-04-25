import type { IDocsService } from '../../types';

export const azureDocs: IDocsService = {
  buildSearchUrl: (query: string) =>
    `https://learn.microsoft.com/en-us/search/?terms=${encodeURIComponent(query)}&category=Documentation`,
  portalSearchUrl: (q: string) =>
    `https://learn.microsoft.com/en-us/search/?terms=${encodeURIComponent(q)}`,
  priorityLinks: [
    { url: 'https://learn.microsoft.com/en-us/azure/well-architected/', title: 'Azure Well-Architected Framework' },
    { url: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/', title: 'Cloud Adoption Framework (CAF) for Azure' },
    { url: 'https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/', title: 'Azure Landing Zones' },
    { url: 'https://azure.microsoft.com/en-us/migration/', title: 'Azure Migrate' },
  ],
};
