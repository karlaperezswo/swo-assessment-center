// Maps generic service types to provider-specific icon paths and display
// labels. Used by the multi-cloud architecture comparison view to render
// equivalent topologies side by side. When official iconsets ship, only the
// SVG files in /public/cloud-icons/{provider}/ are replaced — this map and
// `frontend/src/diagram/iconMap.ts` callers don't change.

import type { CloudProvider, GenericService } from '@/types/clouds';

export interface IconEntry {
  /** Public-relative SVG path. */
  path: string;
  /** Provider-specific service name shown under the icon. */
  label: string;
}

const G = (svc: string, label: Record<CloudProvider, string>): Record<CloudProvider, IconEntry> => ({
  aws:    { path: `/cloud-icons/aws/${svc}.svg`,    label: label.aws },
  gcp:    { path: `/cloud-icons/gcp/${svc}.svg`,    label: label.gcp },
  azure:  { path: `/cloud-icons/azure/${svc}.svg`,  label: label.azure },
  oracle: { path: `/cloud-icons/oracle/${svc}.svg`, label: label.oracle },
});

export const ICON_MAP: Record<GenericService, Record<CloudProvider, IconEntry>> = {
  compute:        G('compute',        { aws: 'EC2',           gcp: 'Compute Engine', azure: 'Virtual Machine', oracle: 'OCI Compute' }),
  managed_db:     G('managed-db',     { aws: 'RDS',           gcp: 'Cloud SQL',      azure: 'Azure SQL',       oracle: 'Autonomous DB' }),
  load_balancer:  G('load-balancer',  { aws: 'ELB',           gcp: 'Cloud LB',       azure: 'Load Balancer',   oracle: 'OCI LB' }),
  object_storage: G('object-storage', { aws: 'S3',            gcp: 'Cloud Storage',  azure: 'Blob Storage',    oracle: 'Object Storage' }),
  block_storage:  G('block-storage',  { aws: 'EBS',           gcp: 'Persistent Disk',azure: 'Managed Disk',    oracle: 'Block Volume' }),
  queue:          G('queue',          { aws: 'SQS',           gcp: 'Pub/Sub',        azure: 'Service Bus',     oracle: 'OCI Streaming' }),
  cdn:            G('cdn',            { aws: 'CloudFront',    gcp: 'Cloud CDN',      azure: 'Front Door',      oracle: 'OCI CDN' }),
  cache:          G('cache',          { aws: 'ElastiCache',   gcp: 'Memorystore',    azure: 'Cache for Redis', oracle: 'OCI Cache' }),
  vpn:            G('vpn',            { aws: 'Site-to-Site VPN', gcp: 'Cloud VPN',   azure: 'VPN Gateway',     oracle: 'IPSec VPN' }),
  dns:            G('dns',            { aws: 'Route 53',      gcp: 'Cloud DNS',      azure: 'Azure DNS',       oracle: 'OCI DNS' }),
  secrets:        G('secrets',        { aws: 'Secrets Manager',gcp: 'Secret Manager',azure: 'Key Vault',       oracle: 'OCI Vault' }),
  identity:       G('identity',       { aws: 'IAM',           gcp: 'Cloud IAM',      azure: 'Entra ID',        oracle: 'OCI IAM' }),
  monitoring:     G('monitoring',     { aws: 'CloudWatch',    gcp: 'Cloud Monitoring', azure: 'Azure Monitor', oracle: 'OCI Monitoring' }),
};

export function iconFor(service: GenericService, provider: CloudProvider): IconEntry {
  return ICON_MAP[service][provider];
}
