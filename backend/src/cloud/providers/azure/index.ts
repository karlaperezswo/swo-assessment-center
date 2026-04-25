import type { ICloudProvider } from '../../types';
import { azureCompute } from './compute';
import { azureDatabase } from './database';
import { azurePricing } from './pricing';
import { azureFramework } from './framework';
import { azureDocs } from './docs';

export const azureProvider: ICloudProvider = Object.freeze({
  id: 'azure',
  displayName: 'Microsoft Azure',
  defaultRegion: 'eastus',
  availableRegions: [
    'eastus',
    'eastus2',
    'centralus',
    'westus2',
    'westus3',
    'northeurope',
    'westeurope',
    'southeastasia',
    'japaneast',
    'centralindia',
    'brazilsouth',
    'uaenorth',
  ] as const,
  compute: azureCompute,
  database: azureDatabase,
  pricing: azurePricing,
  framework: azureFramework,
  docs: azureDocs,
});
