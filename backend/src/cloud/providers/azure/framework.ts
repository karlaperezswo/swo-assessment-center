import type { IFrameworkService } from '../../types';
import { azureLandingZoneSections } from './landingZone';

export const azureFramework: IFrameworkService = {
  frameworkName: 'Azure Well-Architected Framework',
  pillars: [
    'Reliability',
    'Security',
    'Cost Optimization',
    'Operational Excellence',
    'Performance Efficiency',
  ],
  canonicalUrl: 'https://learn.microsoft.com/en-us/azure/well-architected/',
  landingZoneSections: azureLandingZoneSections,
};
