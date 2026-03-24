/**
 * OS Version Normalizer - shared between Cloudamize and Matilda parsers
 *
 * Rules:
 * - Windows: strip trailing build numbers (10.0.17763, 6.3.9600) — keep full name with year
 *   "Microsoft Windows Server 2019 Standard 10.0.17763" → "Windows Server 2019 Standard"
 *
 * - Linux: group by distribution name only, strip all version numbers and codenames
 *   "Ubuntu 20.04 LTS (Focal Fossa)" → "Ubuntu"
 *   "Ubuntu 22.04.4 LTS (Jammy Jellyfish)" → "Ubuntu"
 *   "CentOS 7 (Core)" → "CentOS"
 *   "CentOS CentOS 8" → "CentOS"
 *   "Red Hat Enterprise Linux 8.6" → "Red Hat Enterprise Linux"
 *   "SUSE Linux Enterprise Server 15 SP3" → "SUSE Linux Enterprise Server"
 *   "Debian GNU/Linux 11 (bullseye)" → "Debian"
 *   "Amazon Linux 2" → "Amazon Linux"
 */

const LINUX_DISTROS: { pattern: RegExp; name: string }[] = [
  { pattern: /ubuntu/i,                          name: 'Ubuntu' },
  { pattern: /red\s*hat|rhel/i,                  name: 'Red Hat Enterprise Linux' },
  { pattern: /centos/i,                          name: 'CentOS' },
  { pattern: /suse|sles/i,                       name: 'SUSE Linux Enterprise Server' },
  { pattern: /debian/i,                          name: 'Debian' },
  { pattern: /amazon\s*linux/i,                  name: 'Amazon Linux' },
  { pattern: /oracle\s*linux/i,                  name: 'Oracle Linux' },
  { pattern: /fedora/i,                          name: 'Fedora' },
  { pattern: /rocky/i,                           name: 'Rocky Linux' },
  { pattern: /alma/i,                            name: 'AlmaLinux' },
];

function isLinux(osVersion: string): boolean {
  const v = osVersion.toLowerCase();
  return LINUX_DISTROS.some(d => d.pattern.test(v)) ||
    v.includes('linux') || v.includes('unix');
}

/**
 * Normalize a raw OS version string.
 * - Windows: strip build numbers, keep distro + year + edition
 * - Linux: return only the distribution name (no version numbers)
 */
export function normalizeOSVersion(osVersion: string): string {
  const trimmed = osVersion.trim();
  if (!trimmed) return 'Unknown';

  if (isLinux(trimmed)) {
    // Match known distro name and return it
    for (const distro of LINUX_DISTROS) {
      if (distro.pattern.test(trimmed)) return distro.name;
    }
    // Fallback: strip everything after the first word that looks like a version
    return trimmed.replace(/\s+[\d\(].*$/, '').trim() || trimmed;
  }

  // Windows: strip trailing build numbers like 10.0.17763 or 6.3.9600
  return trimmed.replace(/\s+\d+\.\d+[\.\d\-\w]*$/, '').trim();
}

/**
 * Build OS version string from separate OS name + version fields (Matilda format).
 * Handles the case where Matilda puts "Ubuntu" in OS and "Ubuntu 20.04.5 LTS" in Version —
 * avoids producing "Ubuntu Ubuntu 20.04.5 LTS".
 */
export function buildOSVersion(os: string, version: string): string {
  if (!version) return os || 'Unknown';
  if (!os) return version;
  // If version already starts with the OS name, use version only
  if (version.toLowerCase().startsWith(os.toLowerCase())) return version;
  return `${os} ${version}`.trim();
}
