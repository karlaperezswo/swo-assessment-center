/**
 * SQL Server Pricing Service
 *
 * Microsoft does not publish a machine-readable API for on-premise SQL Server
 * license list prices. The official source is the Microsoft Product Terms PDF
 * and the Volume Licensing Price List, which require authentication.
 *
 * Strategy:
 * - Attempt to scrape the public Microsoft SQL Server pricing page for current prices
 * - Cache result for 24h
 * - Fall back to last-known prices (updated manually when Microsoft publishes changes)
 *
 * Prices are per-core (2-core pack) in USD, Open NL ERP.
 * Source: https://www.microsoft.com/en-us/sql-server/sql-server-2022-comparison
 */

import https from 'https';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface SQLEditionPrice {
  edition: string;
  pricePerTwoCorePack: number; // USD
  source: 'scraped' | 'fallback';
  fetchedAt: number;
}

interface PriceCache {
  prices: Record<string, SQLEditionPrice>;
  fetchedAt: number;
  source: 'scraped' | 'fallback';
}

let priceCache: PriceCache | null = null;

// ─── Fallback prices (Microsoft SQL Server 2022, Open NL ERP, USD) ───────────
// Source: https://www.microsoft.com/en-us/sql-server/sql-server-2022-comparison
// Last verified: March 2026
const FALLBACK_PRICES: Record<string, number> = {
  'Enterprise': 15123,
  'Standard':   3945,
  'Web':        0,       // Only available through hosting partners — no list price
  'Developer':  0,       // Free
  'Express':    0,       // Free
};

// ─── Scraper ─────────────────────────────────────────────────────────────────

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BusinessCaseBot/1.0)' }
    }, (res) => {
      // Follow one redirect
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

/**
 * Try to extract SQL Server prices from Microsoft's comparison page.
 * Returns null if parsing fails — caller falls back to hardcoded values.
 */
async function scrapeMicrosoftPrices(): Promise<Record<string, number> | null> {
  try {
    const html = await fetchHtml('https://www.microsoft.com/en-us/sql-server/sql-server-2022-comparison');

    // Look for price patterns like "$15,123" or "15,123" near "Enterprise" / "Standard"
    const enterpriseMatch = html.match(/Enterprise[^$]*\$\s*([\d,]+)/i)
      || html.match(/\$\s*([\d,]+)[^<]*Enterprise/i);
    const standardMatch = html.match(/Standard[^$]*\$\s*([\d,]+)/i)
      || html.match(/\$\s*([\d,]+)[^<]*Standard/i);

    if (!enterpriseMatch && !standardMatch) return null;

    const parse = (m: RegExpMatchArray | null) =>
      m ? parseInt(m[1].replace(/,/g, ''), 10) : null;

    const enterprise = parse(enterpriseMatch);
    const standard   = parse(standardMatch);

    if (!enterprise && !standard) return null;

    console.log(`[SQL-PRICING] Scraped — Enterprise: $${enterprise}, Standard: $${standard}`);
    return {
      'Enterprise': enterprise ?? FALLBACK_PRICES['Enterprise'],
      'Standard':   standard   ?? FALLBACK_PRICES['Standard'],
      'Web':        0,
      'Developer':  0,
      'Express':    0,
    };
  } catch (err) {
    console.warn(`[SQL-PRICING] Scrape failed: ${(err as Error).message}`);
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get current SQL Server list prices.
 * Tries to scrape Microsoft's page; falls back to hardcoded values.
 */
export async function getSQLPrices(): Promise<PriceCache> {
  if (priceCache && Date.now() - priceCache.fetchedAt < CACHE_TTL_MS) {
    return priceCache;
  }

  const scraped = await scrapeMicrosoftPrices();
  const rawPrices = scraped ?? FALLBACK_PRICES;
  const source: 'scraped' | 'fallback' = scraped ? 'scraped' : 'fallback';

  const prices: Record<string, SQLEditionPrice> = {};
  for (const [edition, price] of Object.entries(rawPrices)) {
    prices[edition] = { edition, pricePerTwoCorePack: price, source, fetchedAt: Date.now() };
  }

  priceCache = { prices, fetchedAt: Date.now(), source };
  console.log(`[SQL-PRICING] Cache updated — source: ${source}`);
  return priceCache;
}

/**
 * Get price for a specific SQL edition (case-insensitive partial match).
 */
export async function getPriceForEdition(edition: string): Promise<number> {
  const cache = await getSQLPrices();
  const edLower = edition.toLowerCase();
  for (const [key, val] of Object.entries(cache.prices)) {
    if (edLower.includes(key.toLowerCase())) return val.pricePerTwoCorePack;
  }
  // Unknown edition → use Standard as safe default
  return cache.prices['Standard']?.pricePerTwoCorePack ?? FALLBACK_PRICES['Standard'];
}

/**
 * Get cache metadata for the status endpoint.
 */
export function getSQLPricingStatus(): { fetchedAt: number; source: string } | null {
  if (!priceCache) return null;
  return { fetchedAt: priceCache.fetchedAt, source: priceCache.source };
}
