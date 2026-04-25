import type { IFrameworkService } from '../../types';
import { awsLandingZoneSections } from './landingZone';

export const awsFramework: IFrameworkService = {
  frameworkName: 'AWS Well-Architected Framework',
  pillars: [
    'Operational Excellence',
    'Security',
    'Reliability',
    'Performance Efficiency',
    'Cost Optimization',
    'Sustainability',
  ],
  canonicalUrl: 'https://aws.amazon.com/architecture/well-architected/',
  landingZoneSections: awsLandingZoneSections,
};
