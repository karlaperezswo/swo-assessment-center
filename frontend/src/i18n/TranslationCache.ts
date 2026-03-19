/**
 * TranslationCache — Two-level cache (memory Map + localStorage)
 * Avoids repeated LLM calls for the same (lang, key) pair.
 */

const CACHE_PREFIX = 'i18n_cache_'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_MEMORY_ENTRIES = 1000

interface CacheEntry {
  value: string
  timestamp: number
  ttl: number
}

export interface CacheStats {
  memoryEntries: number
  localStorageEntries: number
}

/** Simple djb2 hash for building compact cache keys */
function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0 // keep unsigned 32-bit
  }
  return hash.toString(36)
}

export class TranslationCache {
  private memoryCache = new Map<string, string>()

  private buildKey(lang: string, key: string): string {
    return `${lang}_${hashString(key)}`
  }

  get(lang: string, key: string): string | null {
    const cacheKey = this.buildKey(lang, key)

    // Level 1: memory (O(1))
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!
    }

    // Level 2: localStorage
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`)
      if (raw) {
        const entry: CacheEntry = JSON.parse(raw)
        if (Date.now() - entry.timestamp < entry.ttl) {
          // Warm memory cache
          this.memoryCache.set(cacheKey, entry.value)
          return entry.value
        } else {
          // Expired — clean up
          localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`)
        }
      }
    } catch {
      // localStorage unavailable or corrupted — ignore
    }

    return null
  }

  set(lang: string, key: string, value: string): void {
    const cacheKey = this.buildKey(lang, key)

    // LRU eviction: remove oldest entry when at capacity
    if (this.memoryCache.size >= MAX_MEMORY_ENTRIES) {
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey !== undefined) {
        this.memoryCache.delete(firstKey)
      }
    }

    this.memoryCache.set(cacheKey, value)

    try {
      const entry: CacheEntry = {
        value,
        timestamp: Date.now(),
        ttl: CACHE_TTL_MS,
      }
      localStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry))
    } catch {
      // QuotaExceededError or unavailable — memory cache still works
    }
  }

  has(lang: string, key: string): boolean {
    return this.get(lang, key) !== null
  }

  clear(lang?: string): void {
    if (lang) {
      // Clear only entries for the given language
      for (const k of Array.from(this.memoryCache.keys())) {
        if (k.startsWith(`${lang}_`)) this.memoryCache.delete(k)
      }
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i)
          if (k && k.startsWith(`${CACHE_PREFIX}${lang}_`)) {
            localStorage.removeItem(k)
          }
        }
      } catch {
        // ignore
      }
    } else {
      this.memoryCache.clear()
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i)
          if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k)
        }
      } catch {
        // ignore
      }
    }
  }

  getStats(): CacheStats {
    let localStorageEntries = 0
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(CACHE_PREFIX)) localStorageEntries++
      }
    } catch {
      // ignore
    }
    return {
      memoryEntries: this.memoryCache.size,
      localStorageEntries,
    }
  }
}

// Singleton instance shared across the app
export const translationCache = new TranslationCache()
