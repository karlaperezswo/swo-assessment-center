/**
 * I18nProvider — React context that initializes i18next and exposes
 * language state + translate() to the entire component tree.
 *
 * Non-intrusive: wrap <App /> in main.tsx only.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import i18next from 'i18next'
import {
  DEFAULT_LANGUAGE,
  LANG_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  LanguageOption,
  initializeI18n,
} from './config'
import { translate as translateFn, TranslateOptions } from './TranslationService'

interface I18nContextValue {
  currentLanguage: string
  availableLanguages: LanguageOption[]
  changeLanguage: (lang: string) => Promise<void>
  isLoading: boolean
  translate: (keyOrText: string, options?: TranslateOptions) => string
  translateAsync: (keyOrText: string, options?: TranslateOptions) => Promise<string>
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18nContext must be used inside <I18nProvider>')
  }
  return ctx
}

interface Props {
  children: React.ReactNode
}

export function I18nProvider({ children }: Props) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(DEFAULT_LANGUAGE)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize i18next once on mount
  useEffect(() => {
    initializeI18n().then(() => {
      setCurrentLanguage(i18next.language || DEFAULT_LANGUAGE)
      setIsLoading(false)
    })
  }, [])

  const changeLanguage = useCallback(async (lang: string) => {
    if (!SUPPORTED_LANGUAGE_CODES.includes(lang)) {
      console.warn(`[i18n] Language "${lang}" is not supported. Ignoring.`)
      return
    }
    if (lang === currentLanguage) return

    setIsLoading(true)
    try {
      await i18next.changeLanguage(lang)
      try { localStorage.setItem(LANG_STORAGE_KEY, lang) } catch { /* ignore */ }
      setCurrentLanguage(lang)
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage])

  /**
   * Synchronous translate — returns current i18next value immediately.
   * Falls back to keyOrText if not found. For async LLM fallback use translateAsync.
   */
  const translate = useCallback((keyOrText: string, options?: TranslateOptions): string => {
    if (!keyOrText) return keyOrText
    const result = i18next.t(keyOrText, {
      lng: currentLanguage,
      defaultValue: options?.defaultValue ?? keyOrText,
      ...(options?.interpolation ?? {}),
      ns: options?.namespace,
    })
    return (result as string) || keyOrText
  }, [currentLanguage])

  /**
   * Async translate — full resolution chain: i18next → cache → LLM.
   */
  const translateAsync = useCallback(
    (keyOrText: string, options?: TranslateOptions) =>
      translateFn(keyOrText, currentLanguage, options),
    [currentLanguage]
  )

  const value: I18nContextValue = {
    currentLanguage,
    availableLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isLoading,
    translate,
    translateAsync,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
