import { createContext, useContext } from 'react'

export const TranslationContext = createContext()

export function useTranslation() {
  const context = useContext(TranslationContext)

  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }

  return context
}