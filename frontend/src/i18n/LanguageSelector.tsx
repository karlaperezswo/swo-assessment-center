/**
 * LanguageSelector — global language dropdown.
 *
 * Self-contained component; insert anywhere in the header without
 * modifying existing layout logic.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from './useTranslation'

interface LanguageSelectorProps {
  className?: string
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { currentLanguage, availableLanguages, changeLanguage, isLoading } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = availableLanguages.find(l => l.code === currentLanguage) ?? availableLanguages[0]

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = async (code: string) => {
    setOpen(false)
    if (code !== currentLanguage) {
      await changeLanguage(code)
    }
  }

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2 py-1 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Select language"
      >
        <span aria-hidden="true">{current?.flag}</span>
        <span className="hidden sm:inline text-gray-700">{current?.name}</span>
        {isLoading ? (
          <svg className="animate-spin h-3 w-3 text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 py-1"
        >
          {availableLanguages.map(lang => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === currentLanguage}
              onClick={() => handleSelect(lang.code)}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                lang.code === currentLanguage ? 'font-semibold text-primary' : 'text-gray-700'
              }`}
            >
              <span aria-hidden="true">{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === currentLanguage && (
                <svg className="ml-auto h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
