/**
 * TranslationService — Core translation logic
 *
 * Resolution order:
 *   1. If targetLang === DEFAULT_LANGUAGE → return i18next result directly (no LLM)
 *   2. Look up in i18next static locale files
 *   3. Look up in TranslationCache (memory → localStorage)
 *   4. Call LLM backend endpoint, cache result
 *   5. Fallback: return original keyOrText on any error
 *
 * Postcondition: always returns a non-empty string, never throws.
 */

import i18next from 'i18next'
import { translationCache } from './TranslationCache'
import { DEFAULT_LANGUAGE } from './config'

export interface TranslateOptions {
  defaultValue?: string
  interpolation?: Record<string, string | number>
  namespace?: string
}

const LLM_ENDPOINT = '/api/i18n/translate'

async function callLLM(text: string, targetLanguage: string): Promise<string> {
  const response = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      targetLanguage,
      sourceLanguage: DEFAULT_LANGUAGE,
      context: 'AWS migration assessment tool UI',
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM endpoint returned ${response.status}`)
  }

  const data = await response.json()
  return data.translation as string
}

export async function translate(
  keyOrText: string,
  targetLang: string,
  options?: TranslateOptions
): Promise<string> {
  if (!keyOrText) return keyOrText

  // Step 1: Default language — no LLM needed
  if (targetLang === DEFAULT_LANGUAGE) {
    const result = i18next.t(keyOrText, {
      lng: DEFAULT_LANGUAGE,
      defaultValue: options?.defaultValue ?? keyOrText,
      ...(options?.interpolation ?? {}),
      ns: options?.namespace,
    })
    return (result as string) || keyOrText
  }

  // Step 2: Static locale file via i18next
  const i18nResult = i18next.t(keyOrText, {
    lng: targetLang,
    defaultValue: keyOrText, // i18next returns the key when not found
    ...(options?.interpolation ?? {}),
    ns: options?.namespace,
  }) as string

  if (i18nResult && i18nResult !== keyOrText) {
    return i18nResult
  }

  // Step 3: Translation cache
  const cached = translationCache.get(targetLang, keyOrText)
  if (cached !== null) {
    return cached
  }

  // Step 4: LLM fallback
  try {
    const llmResult = await callLLM(keyOrText, targetLang)
    if (llmResult) {
      translationCache.set(targetLang, keyOrText, llmResult)
      return llmResult
    }
  } catch (err) {
    console.warn('[i18n] LLM translation failed for key:', keyOrText, err)
  }

  // Step 5: Return original text — graceful degradation
  return options?.defaultValue ?? keyOrText
}
