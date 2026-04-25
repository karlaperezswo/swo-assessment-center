import type { ICloudProvider } from '../../types';
import { gcpCompute } from './compute';
import { gcpDatabase } from './database';
import { gcpPricing } from './pricing';
import { gcpFramework } from './framework';
import { gcpDocs } from './docs';

export const gcpProvider: ICloudProvider = Object.freeze({
  id: 'gcp',
  displayName: 'Google Cloud Platform',
  defaultRegion: 'us-central1',
  availableRegions: [
    'us-east1',
    'us-east4',
    'us-central1',
    'us-west1',
    'us-west2',
    'europe-west1',
    'europe-west3',
    'europe-north1',
    'asia-southeast1',
    'asia-northeast1',
    'asia-south1',
    'southamerica-east1',
  ] as const,
  compute: gcpCompute,
  database: gcpDatabase,
  pricing: gcpPricing,
  framework: gcpFramework,
  docs: gcpDocs,
});
