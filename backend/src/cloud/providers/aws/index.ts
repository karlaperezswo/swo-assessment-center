import type { ICloudProvider } from '../../types';
import { awsCompute } from './compute';
import { awsDatabase } from './database';
import { awsPricing } from './pricing';
import { awsFramework } from './framework';
import { awsDocs } from './docs';

export const awsProvider: ICloudProvider = Object.freeze({
  id: 'aws',
  displayName: 'Amazon Web Services',
  defaultRegion: 'us-east-1',
  availableRegions: [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-central-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'sa-east-1',
  ] as const,
  compute: awsCompute,
  database: awsDatabase,
  pricing: awsPricing,
  framework: awsFramework,
  docs: awsDocs,
});
