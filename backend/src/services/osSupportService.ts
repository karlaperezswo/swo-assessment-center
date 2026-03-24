/**
 * OS Support Service
 * Classifies operating systems based on AWS Application Migration Service support
 * Source: https://docs.aws.amazon.com/mgn/latest/ug/Supported-Operating-Systems.html
 * Created: 2026-03-04 - Migration Strategy Module
 */

import { MigrationCategory, MigrationStrategy } from '../../../shared/types/businessCase.types';

interface OSClassification {
  supported: boolean;
  category: MigrationCategory;
  strategy: MigrationStrategy;
  notes?: string;
}

/**
 * Supported Windows versions
 */
const SUPPORTED_WINDOWS = [
  'Windows Server 2025',
  'Windows Server 2022',
  'Windows Server 2019',
  'Windows Server 2016',
  'Windows 10',
];

/**
 * Windows versions near EOL (supported but need replatform)
 */
const WINDOWS_NEAR_EOL = [
  'Windows Server 2012',
  'Windows Server 2012 R2',
];

/**
 * Unsupported Windows versions
 */
const UNSUPPORTED_WINDOWS = [
  'Windows Server 2008',
  'Windows Server 2003',
  'Windows 7',
  'Windows 8',
];

/**
 * Supported Linux distributions with version ranges
 */
const SUPPORTED_LINUX = {
  'Amazon Linux': { min: 1, max: 2023 },
  'RHEL': { min: 6.0, max: 10 },
  'Red Hat': { min: 6.0, max: 10 },
  'CentOS': { min: 6.0, max: 8.0 },
  'Oracle Linux': { min: 6.0, max: 9.4 },
  'Rocky Linux': { min: 8, max: 9.7 },
  'SUSE': { min: 11, max: 15 },
  'SLES': { min: 11, max: 15 },
  'Ubuntu': { min: 12.04, max: 24.04 },
  'Debian': { min: 10, max: 11 },
};

/**
 * Linux versions near EOL
 */
const LINUX_NEAR_EOL = [
  'RHEL 6',
  'CentOS 6',
  'CentOS 7',
  'Amazon Linux 1',
  'Ubuntu 12.04',
  'Ubuntu 14.04',
  'Debian 10',
];

/**
 * Classify OS version and determine migration strategy
 */
export function classifyOS(osVersion: string): OSClassification {
  if (!osVersion || osVersion.trim() === '') {
    return {
      supported: false,
      category: 'Purchase',
      strategy: 'Retain',
      notes: 'Unknown OS'
    };
  }

  const osLower = osVersion.toLowerCase().trim();

  // Check Windows
  if (osLower.includes('windows')) {
    return classifyWindows(osVersion, osLower);
  }

  // Check Linux
  return classifyLinux(osVersion, osLower);
}

/**
 * Classify Windows OS
 */
function classifyWindows(osVersion: string, osLower: string): OSClassification {
  // Check if supported (modern versions)
  for (const supported of SUPPORTED_WINDOWS) {
    if (osLower.includes(supported.toLowerCase())) {
      return {
        supported: true,
        category: 'Migrate',
        strategy: 'Rehost',
        notes: 'Fully supported - Lift & Shift'
      };
    }
  }

  // Check if near EOL (needs replatform)
  for (const nearEOL of WINDOWS_NEAR_EOL) {
    if (osLower.includes(nearEOL.toLowerCase())) {
      return {
        supported: true,
        category: 'Migrate',
        strategy: 'Replatform',
        notes: 'Near EOL - Requires update'
      };
    }
  }

  // Check if unsupported
  for (const unsupported of UNSUPPORTED_WINDOWS) {
    if (osLower.includes(unsupported.toLowerCase())) {
      return {
        supported: false,
        category: 'Purchase',
        strategy: 'Retire',
        notes: 'EOL - Retire or upgrade'
      };
    }
  }

  // Unknown Windows version
  return {
    supported: false,
    category: 'Purchase',
    strategy: 'Retain',
    notes: 'Unknown Windows version'
  };
}

/**
 * Classify Linux OS
 */
function classifyLinux(osVersion: string, osLower: string): OSClassification {
  // Check for 32-bit (not supported)
  if (osLower.includes('32-bit') || osLower.includes('i386') || osLower.includes('i686')) {
    return {
      supported: false,
      category: 'Purchase',
      strategy: 'Repurchase',
      notes: '32-bit not supported'
    };
  }

  // Check each Linux distribution
  for (const [distro, range] of Object.entries(SUPPORTED_LINUX)) {
    if (osLower.includes(distro.toLowerCase())) {
      const version = extractLinuxVersion(osVersion);
      
      if (version !== null && version >= range.min && version <= range.max) {
        // Check if near EOL
        const isNearEOL = LINUX_NEAR_EOL.some(eol => osLower.includes(eol.toLowerCase()));
        
        if (isNearEOL) {
          return {
            supported: true,
            category: 'Migrate',
            strategy: 'Replatform',
            notes: 'Near EOL - Consider update'
          };
        }
        
        return {
          supported: true,
          category: 'Migrate',
          strategy: 'Rehost',
          notes: 'Fully supported - Lift & Shift'
        };
      } else if (version !== null && version < range.min) {
        return {
          supported: false,
          category: 'Purchase',
          strategy: 'Repurchase',
          notes: 'Version too old'
        };
      }
    }
  }

  // Unknown Linux distribution
  return {
    supported: false,
    category: 'Purchase',
    strategy: 'Retain',
    notes: 'Unknown Linux distribution'
  };
}

/**
 * Extract version number from Linux OS string
 */
function extractLinuxVersion(osVersion: string): number | null {
  // Try to extract version like "8.5", "9.4", "12.04", etc.
  const versionMatch = osVersion.match(/(\d+(?:\.\d+)?)/);
  if (versionMatch) {
    return parseFloat(versionMatch[1]);
  }
  return null;
}

/**
 * Get summary statistics for migration strategies
 */
export function getMigrationSummary(classifications: Map<string, { count: number; classification: OSClassification }>) {
  const summary = {
    totalServers: 0,
    byCategory: {
      purchase: 0,
      migrate: 0,
      modernize: 0
    },
    byStrategy: {
      repurchase: 0,
      retire: 0,
      retain: 0,
      rehost: 0,
      relocate: 0,
      replatform: 0,
      refactor: 0
    }
  };

  for (const { count, classification } of classifications.values()) {
    summary.totalServers += count;
    
    // By category
    const categoryKey = classification.category.toLowerCase() as keyof typeof summary.byCategory;
    summary.byCategory[categoryKey] += count;
    
    // By strategy
    const strategyKey = classification.strategy.toLowerCase() as keyof typeof summary.byStrategy;
    summary.byStrategy[strategyKey] += count;
  }

  return summary;
}
