import type { IFrameworkService } from '../../types';
import { gcpLandingZoneSections } from './landingZone';

export const gcpFramework: IFrameworkService = {
  frameworkName: 'Google Cloud Architecture Framework',
  pillars: [
    'Operational Excellence',
    'Security, Privacy, and Compliance',
    'Reliability',
    'Cost Optimization',
    'Performance Optimization',
    'Sustainability',
  ],
  canonicalUrl: 'https://cloud.google.com/architecture/framework',
  landingZoneSections: gcpLandingZoneSections,
};
