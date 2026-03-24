/**
 * OS Support Dates Service
 *
 * Resolves support lifecycle dates by querying endoflife.date API (cached 24h).
 * Falls back to bundled baseline data when the API is unreachable.
 *
 * Sources (via endoflife.date):
 *   Windows Server → https://endoflife.date/windows-server
 *   SQL Server     → https://endoflife.date/sql-server
 *   RHEL           → https://endoflife.date/rhel
 *   Ubuntu         → https://endoflife.date/ubuntu
 *   SLES           → https://endoflife.date/sles
 *   CentOS         → https://endoflife.date/centos
 *   Debian         → https://endoflife.date/debian
 *   Amazon Linux   → https://endoflife.date/amazon-linux
 */

import { getProductCycles, EolCycle } from './eolApiService';

export interface SupportDates {
  mainstreamEnd: string;
  extendedEnd: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(val: string | boolean | undefined): string {
  if (val === undefined || val === null) return '9999-12-31'; // still supported
  if (val === false) return '9999-12-31';                    // still supported
  if (val === true) return '1970-01-01';                     // already EOL (no date)
  return String(val);
}

/**
 * Convert an EolCycle to SupportDates.
 * endoflife.date uses `eol` for the final end date.
 * `extendedSupport` (when present) is the extended/LTSS end date.
 */
function cycleToDates(cycle: EolCycle): SupportDates {
  const eolDate = toDateStr(cycle.eol);
  const extDate = cycle.extendedSupport ? toDateStr(cycle.extendedSupport) : eolDate;
  // mainstream = earlier of the two; extended = later
  const mainstream = eolDate < extDate ? eolDate : extDate;
  const extended   = eolDate > extDate ? eolDate : extDate;
  return { mainstreamEnd: mainstream, extendedEnd: extended };
}

/**
 * Find the best matching cycle for a version string.
 * Tries longest-match first so "2012 R2" beats "2012".
 */
function findCycle(cycles: EolCycle[], versionHint: string): EolCycle | null {
  const hint = versionHint.toLowerCase();
  // Sort by cycle length desc so more specific cycles match first
  const sorted = [...cycles].sort((a, b) => b.cycle.length - a.cycle.length);
  for (const c of sorted) {
    if (hint.includes(c.cycle.toLowerCase())) return c;
  }
  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get support dates for an OS/SQL version string.
 * category: 'windows' | 'sql' | 'linux'
 */
export async function getSupportInfo(
  version: string,
  category: 'windows' | 'sql' | 'linux'
): Promise<SupportDates | null> {
  const v = version.toLowerCase();

  if (category === 'windows') {
    const { cycles } = await getProductCycles('windows-server');
    const match = findCycle(cycles, v);
    return match ? cycleToDates(match) : null;
  }

  if (category === 'sql') {
    const { cycles } = await getProductCycles('sql-server');
    const match = findCycle(cycles, v);
    return match ? cycleToDates(match) : null;
  }

  // Linux — try each distro
  if (v.includes('red hat') || v.includes('rhel')) {
    const { cycles } = await getProductCycles('rhel');
    const match = findCycle(cycles, v);
    if (match) return cycleToDates(match);
  }
  if (v.includes('ubuntu')) {
    const { cycles } = await getProductCycles('ubuntu');
    const match = findCycle(cycles, v);
    if (match) return cycleToDates(match);
  }
  if (v.includes('suse') || v.includes('sles')) {
    const { cycles } = await getProductCycles('sles');
    // SLES cycles use dots: "15.3" — normalize "15 SP3" → "15.3"
    const normalized = v.replace(/\s+sp(\d+)/i, '.$1');
    const match = findCycle(cycles, normalized);
    if (match) return cycleToDates(match);
  }
  if (v.includes('centos')) {
    const { cycles } = await getProductCycles('centos');
    const match = findCycle(cycles, v);
    if (match) return cycleToDates(match);
  }
  if (v.includes('debian')) {
    const { cycles } = await getProductCycles('debian');
    const match = findCycle(cycles, v);
    if (match) return cycleToDates(match);
  }
  if (v.includes('amazon linux') || v.includes('amazon-linux')) {
    const { cycles } = await getProductCycles('amazon-linux');
    const match = findCycle(cycles, v);
    if (match) return cycleToDates(match);
  }

  return null;
}

/**
 * Determine support status and risk level from an end date.
 */
export function getSupportStatus(
  endDate: string,
  currentDate: Date = new Date()
): {
  status: 'Unsupported' | 'Extended Support' | 'Mainstream Support';
  risk: 'High' | 'Med' | 'Low';
} {
  const end = new Date(endDate);
  if (currentDate > end) return { status: 'Unsupported', risk: 'High' };
  const yearsLeft = (end.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsLeft > 3) return { status: 'Mainstream Support', risk: 'Low' };
  return { status: 'Extended Support', risk: 'Med' };
}
