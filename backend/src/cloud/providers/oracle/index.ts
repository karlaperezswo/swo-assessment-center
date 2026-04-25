import type { ICloudProvider } from '../../types';
import { oracleCompute } from './compute';
import { oracleDatabase } from './database';
import { oraclePricing } from './pricing';
import { oracleFramework } from './framework';
import { oracleDocs } from './docs';

export const oracleProvider: ICloudProvider = Object.freeze({
  id: 'oracle',
  displayName: 'Oracle Cloud Infrastructure',
  defaultRegion: 'us-ashburn-1',
  availableRegions: [
    'us-ashburn-1',
    'us-phoenix-1',
    'us-chicago-1',
    'eu-frankfurt-1',
    'uk-london-1',
    'ap-singapore-1',
    'ap-tokyo-1',
    'ap-mumbai-1',
    'sa-saopaulo-1',
    'me-jeddah-1',
    'af-johannesburg-1',
  ] as const,
  compute: oracleCompute,
  database: oracleDatabase,
  pricing: oraclePricing,
  framework: oracleFramework,
  docs: oracleDocs,
});
