import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TranslationProvider } from '../src/i18n/provider'
import { useTranslation } from '../src/i18n/context'
import en from '../src/i18n/en.json'
import sv from '../src/i18n/sv.json'

function Probe() {
  const { language, setLanguage, t } = useTranslation()

  return (
    <>
      <span data-testid="language">{language}</span>
      <span data-testid="title">{t('app.title')}</span>
      <button onClick={() => setLanguage('xx')}>break it</button>
    </>
  )
}

function renderProbe() {
  return render(
    <TranslationProvider>
      <Probe />
    </TranslationProvider>
  )
}

describe('TranslationProvider language resolution', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('defaults to English when nothing has been saved', () => {
    renderProbe()

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('title')).toHaveTextContent(en.app.title)
  })

  test('honours a supported saved language', () => {
    localStorage.setItem('language', 'sv')

    renderProbe()

    expect(screen.getByTestId('language')).toHaveTextContent('sv')
    expect(screen.getByTestId('title')).toHaveTextContent(sv.app.title)
  })

  test('falls back to English when the saved language is not supported', () => {
    // Anything else on this origin (localhost:5173 is shared by every Vite
    // project) can leave a value here. An unknown one used to make
    // translations[language] undefined, so every key rendered as its own name.
    localStorage.setItem('language', 'xx')

    renderProbe()

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('title')).toHaveTextContent(en.app.title)
  })

  test('repairs the stored value so the bad one cannot come back on reload', () => {
    localStorage.setItem('language', 'xx')

    renderProbe()

    expect(localStorage.getItem('language')).toBe('en')
  })

  test('ignores a switch to an unsupported language', () => {
    renderProbe()

    fireEvent.click(screen.getByRole('button', { name: /break it/i }))

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('title')).toHaveTextContent(en.app.title)
  })
})
