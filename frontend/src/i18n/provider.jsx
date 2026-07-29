import { useState, useEffect } from 'react'
import en from './en.json'
import sv from './sv.json'
import fi from './fi.json'
import { TranslationContext } from './context'

const translations = { en, sv, fi }
const DEFAULT_LANGUAGE = 'en'

const supportedLanguage = (value) =>
  Object.prototype.hasOwnProperty.call(translations, value) ? value : DEFAULT_LANGUAGE

export function TranslationProvider({ children }) {
  const [language, setLanguageState] = useState(() =>
    supportedLanguage(localStorage.getItem('language'))
  )

  // Ignores unsupported values rather than storing them, so the app can never
  // end up in the no-language state at runtime either.
  const setLanguage = (next) => {
    if (Object.prototype.hasOwnProperty.call(translations, next)) {
      setLanguageState(next)
    }
  }

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }

    return value || key
  }

  const tList = (key) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return []
      }
    }

    return Array.isArray(value) ? value : []
  }

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, tList }}>
      {children}
    </TranslationContext.Provider>
  )
}
