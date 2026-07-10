import { render as rtlRender, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LanguageSelector from '../src/components/LanguageSelector'
import { TranslationContext } from '../src/i18n/context'

function renderWithLanguage(language, setLanguage = jest.fn()) {
  const value = { language, setLanguage, t: (k) => k, tList: () => [] }
  return rtlRender(
    <TranslationContext.Provider value={value}>
      <LanguageSelector />
    </TranslationContext.Provider>
  )
}

describe('LanguageSelector', () => {
  test('renders all three language buttons', () => {
    renderWithLanguage('en')

    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /svenska/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /suomi/i })).toBeInTheDocument()
  })

  test('clicking Svenska calls setLanguage with sv', () => {
    const setLanguage = jest.fn()
    renderWithLanguage('en', setLanguage)

    fireEvent.click(screen.getByRole('button', { name: /svenska/i }))

    expect(setLanguage).toHaveBeenCalledWith('sv')
  })

  test('clicking Suomi calls setLanguage with fi', () => {
    const setLanguage = jest.fn()
    renderWithLanguage('en', setLanguage)

    fireEvent.click(screen.getByRole('button', { name: /suomi/i }))

    expect(setLanguage).toHaveBeenCalledWith('fi')
  })

  test('clicking English calls setLanguage with en', () => {
    const setLanguage = jest.fn()
    renderWithLanguage('fi', setLanguage)

    fireEvent.click(screen.getByRole('button', { name: /english/i }))

    expect(setLanguage).toHaveBeenCalledWith('en')
  })
})
