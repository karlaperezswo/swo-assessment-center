/**
 * i18n configuration — constants and initialization
 */

import i18next from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

export const DEFAULT_LANGUAGE = 'es-MX'
export const FALLBACK_LANGUAGE = 'en'
export const LANG_STORAGE_KEY = 'map-central-lang'

export interface LanguageOption {
  code: string
  name: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'es-MX', name: 'Español (México)', flag: '🇲🇽' },
  { code: 'en',    name: 'English',           flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
]

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code)

/** Find the best matching supported language for a browser locale string */
export function findBestMatch(browserLang: string | undefined): string | null {
  if (!browserLang) return null

  // Exact match
  if (SUPPORTED_LANGUAGE_CODES.includes(browserLang)) return browserLang

  // Language-only match (e.g. "es" matches "es-MX")
  const base = browserLang.split('-')[0]
  const match = SUPPORTED_LANGUAGE_CODES.find(code => code.startsWith(base))
  return match ?? null
}

let initialized = false

export async function initializeI18n(): Promise<void> {
  if (initialized) return
  initialized = true

  // Priority: saved preference → default (es-MX)
  // Browser language is intentionally ignored — app defaults to Spanish
  const savedLang = (() => {
    try { return localStorage.getItem(LANG_STORAGE_KEY) } catch { return null }
  })()

  const initialLang =
    (savedLang && SUPPORTED_LANGUAGE_CODES.includes(savedLang) ? savedLang : null) ??
    DEFAULT_LANGUAGE

  await i18next
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      lng: initialLang,
      fallbackLng: FALLBACK_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGE_CODES,
      backend: {
        loadPath: '/locales/{{lng}}.json',
      },
      interpolation: {
        escapeValue: false, // React already escapes
      },
      react: {
        useSuspense: false,
      },
      // Don't log missing keys to console in production
      saveMissing: false,
    })
}
