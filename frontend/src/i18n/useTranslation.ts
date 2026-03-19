/**
 * useTranslation — hook that exposes the i18n context.
 *
 * Usage:
 *   const { t, currentLanguage, changeLanguage, isLoading } = useTranslation()
 *   <h1>{t('header.title')}</h1>
 *
 * Must be used inside <I18nProvider>.
 */

import { useI18nContext } from './I18nProvider'
import type { TranslateOptions } from './TranslationService'

export function useTranslation() {
  const { currentLanguage, availableLanguages, changeLanguage, isLoading, translate, translateAsync } =
    useI18nContext()

  return {
    /** Synchronous translate — instant, uses i18next static files */
    t: (keyOrText: string, options?: TranslateOptions) => translate(keyOrText, options),
    /** Async translate — full chain including LLM fallback */
    tAsync: (keyOrText: string, options?: TranslateOptions) => translateAsync(keyOrText, options),
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isLoading,
  }
}
