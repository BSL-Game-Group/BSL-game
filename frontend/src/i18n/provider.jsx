import { useState, useEffect } from 'react'
import en from './en.json'
import sv from './sv.json'
import { TranslationContext } from './context'

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'en'
  })

  const translations = { en, sv }

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