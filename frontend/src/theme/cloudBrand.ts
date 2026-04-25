// Per-cloud brand tokens. Used by CloudIcon, CloudBadge, CloudSelector,
// table headers, chart bars and Architecture Diagram boxes.
//
// Colors are taken from each vendor's brand guide (primary brand color).
// Logos live in /public/cloud-logos/{aws,gcp,azure,oracle}.svg — see the plan
// for legal validation requirements before shipping the official SVGs.

import type { CloudProvider } from '../types/clouds';

export interface CloudBrand {
  color: string;     // primary brand color
  bg: string;        // tinted background for chips / column groups
  border: string;    // border color for chips / column groups
  text: string;      // accessible text color on `bg`
  shortName: string; // 'AWS' / 'GCP' / 'Azure' / 'Oracle'
  fullName: string;
  logoPath: string;  // /public/cloud-logos/{provider}.svg
}

export const CLOUD_BRAND: Readonly<Record<CloudProvider, CloudBrand>> = Object.freeze({
  aws: {
    color: '#FF9900',
    bg: '#FFF4E5',
    border: '#FFD699',
    text: '#7A4500',
    shortName: 'AWS',
    fullName: 'Amazon Web Services',
    logoPath: '/cloud-logos/aws.svg',
  },
  gcp: {
    color: '#4285F4',
    bg: '#E8F0FE',
    border: '#A4C2F4',
    text: '#1A56C9',
    shortName: 'GCP',
    fullName: 'Google Cloud Platform',
    logoPath: '/cloud-logos/gcp.svg',
  },
  azure: {
    color: '#0078D4',
    bg: '#DEECF9',
    border: '#A5C8E8',
    text: '#005A9E',
    shortName: 'Azure',
    fullName: 'Microsoft Azure',
    logoPath: '/cloud-logos/azure.svg',
  },
  oracle: {
    color: '#C74634',
    bg: '#FBE9E7',
    border: '#F2A99F',
    text: '#8B2E20',
    shortName: 'Oracle',
    fullName: 'Oracle Cloud Infrastructure',
    logoPath: '/cloud-logos/oracle.svg',
  },
});

export function brandFor(provider: CloudProvider): CloudBrand {
  return CLOUD_BRAND[provider];
}
