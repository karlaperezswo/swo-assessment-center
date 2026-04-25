// Helper hook to translate per-cloud labels without inflating i18n files
// with combinatoric keys (we don't want serverTable.aws.recCol +
// serverTable.gcp.recCol + ... etc). Pattern: interpolate the cloud name.

import { useTranslation } from 'react-i18next';
import type { CloudProvider } from '../types/clouds';
import { brandFor } from '../theme/cloudBrand';

export function useCloudLabel() {
  const { t } = useTranslation();
  return (provider: CloudProvider, kind: 'compute' | 'database' | 'shortName' | 'fullName' = 'shortName') => {
    const brand = brandFor(provider);
    if (kind === 'shortName') return brand.shortName;
    if (kind === 'fullName') return brand.fullName;
    // For 'compute' / 'database' we read the canonical service name from i18n.
    return t(`cloud.${provider}.${kind}.label`, { defaultValue: brand.shortName });
  };
}
