import type { CloudProvider } from '../../../shared/types/cloud.types';
import type { ICloudProvider } from './types';
import { awsProvider } from './providers/aws';
import { gcpProvider } from './providers/gcp';
import { azureProvider } from './providers/azure';
import { oracleProvider } from './providers/oracle';

// Registry of all cloud providers. Order is the canonical iteration order for
// multi-cloud comparisons in tables, charts and the report Word document.
export const CLOUD_PROVIDERS: Readonly<Record<CloudProvider, ICloudProvider>> = Object.freeze({
  aws: awsProvider,
  gcp: gcpProvider,
  azure: azureProvider,
  oracle: oracleProvider,
});

export function getProvider(id: CloudProvider): ICloudProvider {
  const p = CLOUD_PROVIDERS[id];
  if (!p) throw new Error(`Cloud provider not registered: ${id}`);
  return p;
}

export function getRegisteredProviders(): readonly CloudProvider[] {
  return Object.keys(CLOUD_PROVIDERS) as CloudProvider[];
}

export function getProviders(ids: readonly CloudProvider[]): ICloudProvider[] {
  const seen = new Set<CloudProvider>();
  const result: ICloudProvider[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const p = CLOUD_PROVIDERS[id];
    if (p) result.push(p);
  }
  return result;
}
