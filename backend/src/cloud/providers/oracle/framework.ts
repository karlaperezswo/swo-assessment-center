import type { IFrameworkService } from '../../types';
import { oracleLandingZoneSections } from './landingZone';

export const oracleFramework: IFrameworkService = {
  frameworkName: 'Oracle Cloud Architecture Framework',
  pillars: [
    'Operational Excellence',
    'Security and Compliance',
    'Reliability and Resilience',
    'Performance Efficiency',
    'Cost Optimization',
    'Sustainability',
  ],
  canonicalUrl: 'https://docs.oracle.com/en/solutions/oci-best-practices-framework/',
  landingZoneSections: oracleLandingZoneSections,
};
