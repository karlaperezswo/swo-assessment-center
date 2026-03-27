/**
 * EOL API Service
 * Fetches end-of-life lifecycle data from https://endoflife.date API
 * API docs: https://endoflife.date/docs/api/v1/
 *
 * Strategy:
 * - Fetch from endoflife.date on first use, then cache for 24h
 * - On fetch failure, fall back to hardcoded baseline data
 * - Exposes lastUpdated timestamp so the UI can show data freshness
 *
 * Products mapped:
 *   windows-server  → Windows Server
 *   sql-server      → SQL Server
 *   rhel            → Red Hat Enterprise Linux
 *   ubuntu          → Ubuntu LTS
 *   sles            → SUSE Linux Enterprise Server
 *   centos          → CentOS
 *   debian          → Debian
 *   amazon-linux    → Amazon Linux
 */

import https from 'https';

const EOL_API_BASE = 'https://endoflife.date/api';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface EolCycle {
  cycle: string;          // e.g. "2019", "15 SP3"
  releaseDate: string;    // YYYY-MM-DD
  eol: string | boolean;  // YYYY-MM-DD or false (still supported)
  extendedSupport?: string | boolean;
  lts?: boolean;
  latest?: string;
  link?: string;
}

interface CacheEntry {
  data: EolCycle[];
  fetchedAt: number;
  source: 'api' | 'fallback';
}

// In-memory cache: product slug → CacheEntry
const cache = new Map<string, CacheEntry>();

// ─── Fallback data (used when API is unreachable) ────────────────────────────

const FALLBACK: Record<string, EolCycle[]> = {
  'windows-server': [
    { cycle: '2025', releaseDate: '2024-11-01', eol: '2034-10-10' },
    { cycle: '2022', releaseDate: '2021-08-18', eol: '2031-10-14' },
    { cycle: '2019', releaseDate: '2018-11-13', eol: '2029-01-09' },
    { cycle: '2016', releaseDate: '2016-10-15', eol: '2027-01-12' },
    { cycle: '2012-R2', releaseDate: '2013-11-25', eol: '2023-10-10' },
    { cycle: '2012', releaseDate: '2012-10-30', eol: '2023-10-10' },
    { cycle: '2008-R2', releaseDate: '2009-10-22', eol: '2020-01-14' },
    { cycle: '2008', releaseDate: '2008-02-27', eol: '2020-01-14' },
  ],
  'sql-server': [
    { cycle: '2022', releaseDate: '2022-11-16', eol: '2033-01-11', extendedSupport: '2033-01-11' },
    { cycle: '2019', releaseDate: '2019-11-04', eol: '2030-01-08', extendedSupport: '2030-01-08' },
    { cycle: '2017', releaseDate: '2017-10-02', eol: '2027-10-12', extendedSupport: '2027-10-12' },
    { cycle: '2016', releaseDate: '2016-06-01', eol: '2026-07-14', extendedSupport: '2026-07-14' },
    { cycle: '2014', releaseDate: '2014-04-01', eol: '2024-07-09', extendedSupport: '2024-07-09' },
    { cycle: '2012', releaseDate: '2012-03-06', eol: '2022-07-12', extendedSupport: '2022-07-12' },
    { cycle: '2008-R2', releaseDate: '2010-04-21', eol: '2019-07-09', extendedSupport: '2019-07-09' },
  ],
  'rhel': [
    { cycle: '9', releaseDate: '2022-05-17', eol: '2032-05-31', extendedSupport: '2032-05-31' },
    { cycle: '8', releaseDate: '2019-05-07', eol: '2029-05-31', extendedSupport: '2029-05-31' },
    { cycle: '7', releaseDate: '2014-06-10', eol: '2024-06-30', extendedSupport: '2024-06-30' },
    { cycle: '6', releaseDate: '2010-11-10', eol: '2020-11-30', extendedSupport: '2020-11-30' },
  ],
  'ubuntu': [
    { cycle: '24.04', releaseDate: '2024-04-25', eol: '2034-04-25', lts: true },
    { cycle: '22.04', releaseDate: '2022-04-21', eol: '2032-04-21', lts: true },
    { cycle: '20.04', releaseDate: '2020-04-23', eol: '2030-04-23', lts: true },
    { cycle: '18.04', releaseDate: '2018-04-26', eol: '2028-04-26', lts: true },
    { cycle: '16.04', releaseDate: '2016-04-21', eol: '2024-04-23', lts: true },
  ],
  'sles': [
    { cycle: '15.6', releaseDate: '2024-06-24', eol: '2031-07-31' },
    { cycle: '15.5', releaseDate: '2023-06-19', eol: '2027-10-31' },
    { cycle: '15.4', releaseDate: '2022-06-22', eol: '2025-10-31' },
    { cycle: '15.3', releaseDate: '2021-06-23', eol: '2025-10-31' },
    { cycle: '15.2', releaseDate: '2020-07-22', eol: '2024-12-31' },
    { cycle: '15.1', releaseDate: '2019-06-26', eol: '2024-01-31' },
    { cycle: '15', releaseDate: '2018-07-16', eol: '2022-12-31' },
    { cycle: '12.5', releaseDate: '2019-12-09', eol: '2027-10-31' },
  ],
  'centos': [
    { cycle: '8', releaseDate: '2019-09-24', eol: '2021-12-31' },
    { cycle: '7', releaseDate: '2014-07-07', eol: '2024-06-30' },
    { cycle: '6', releaseDate: '2011-07-10', eol: '2020-11-30' },
  ],
  'debian': [
    { cycle: '12', releaseDate: '2023-06-10', eol: '2028-06-10' },
    { cycle: '11', releaseDate: '2021-08-14', eol: '2026-08-15' },
    { cycle: '10', releaseDate: '2019-07-06', eol: '2024-06-30' },
  ],
  'amazon-linux': [
    { cycle: '2023', releaseDate: '2023-03-15', eol: '2028-03-15' },
    { cycle: '2', releaseDate: '2018-06-26', eol: '2026-06-30' },
    { cycle: '1', releaseDate: '2010-09-28', eol: '2023-12-31' },
  ],
};

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error(`Invalid JSON from ${url}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get lifecycle data for a product slug.
 * Returns cached data if fresh, otherwise fetches from endoflife.date.
 * Falls back to hardcoded data on any error.
 */
export async function getProductCycles(slug: string): Promise<{ cycles: EolCycle[]; source: 'api' | 'fallback'; fetchedAt: number }> {
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { cycles: cached.data, source: cached.source, fetchedAt: cached.fetchedAt };
  }

  try {
    const data: EolCycle[] = await fetchJson(`${EOL_API_BASE}/${slug}.json`);
    const entry: CacheEntry = { data, fetchedAt: Date.now(), source: 'api' };
    cache.set(slug, entry);
    console.log(`[EOL-API] ✓ Fetched ${slug} from endoflife.date (${data.length} cycles)`);
    return { cycles: data, source: 'api', fetchedAt: entry.fetchedAt };
  } catch (err) {
    console.warn(`[EOL-API] ⚠ Failed to fetch ${slug}: ${(err as Error).message}. Using fallback.`);
    const fallback = FALLBACK[slug] ?? [];
    const entry: CacheEntry = { data: fallback, fetchedAt: Date.now(), source: 'fallback' };
    cache.set(slug, entry);
    return { cycles: fallback, source: 'fallback', fetchedAt: entry.fetchedAt };
  }
}

/**
 * Get cache status for all known products — used by the status endpoint.
 */
export function getCacheStatus(): Record<string, { fetchedAt: number; source: 'api' | 'fallback'; cycles: number }> {
  const result: Record<string, { fetchedAt: number; source: 'api' | 'fallback'; cycles: number }> = {};
  for (const [slug, entry] of cache.entries()) {
    result[slug] = { fetchedAt: entry.fetchedAt, source: entry.source, cycles: entry.data.length };
  }
  return result;
}

/**
 * Force-refresh a product (bypass cache TTL).
 */
export async function refreshProduct(slug: string): Promise<void> {
  cache.delete(slug);
  await getProductCycles(slug);
}

/**
 * All product slugs used by this app.
 */
export const PRODUCT_SLUGS = ['windows-server', 'sql-server', 'rhel', 'ubuntu', 'sles', 'centos', 'debian', 'amazon-linux'] as const;
