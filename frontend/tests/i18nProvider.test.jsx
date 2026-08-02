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

describe('TranslationProvider language switching', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  function SwitchableProbe() {
    const { language, setLanguage, t } = useTranslation()

    return (
      <>
        <span data-testid="language">{language}</span>
        <span data-testid="title">{t('app.title')}</span>
        <button onClick={() => setLanguage('sv')}>Swedish</button>
        <button onClick={() => setLanguage('fi')}>Finnish</button>
        <button onClick={() => setLanguage('en')}>English</button>
      </>
    )
  }

  test('switches between English and Swedish', () => {
    render(
      <TranslationProvider>
        <SwitchableProbe />
      </TranslationProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')
    expect(screen.getByTestId('title')).toHaveTextContent(en.app.title)

    fireEvent.click(screen.getByRole('button', { name: /swedish/i }))

    expect(screen.getByTestId('language')).toHaveTextContent('sv')
    expect(screen.getByTestId('title')).toHaveTextContent(sv.app.title)
  })

  test('persists language to localStorage', () => {
    render(
      <TranslationProvider>
        <SwitchableProbe />
      </TranslationProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /swedish/i }))

    expect(localStorage.getItem('language')).toBe('sv')
  })

  test('supports multiple language switches', () => {
    render(
      <TranslationProvider>
        <SwitchableProbe />
      </TranslationProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /swedish/i }))
    expect(screen.getByTestId('language')).toHaveTextContent('sv')

    fireEvent.click(screen.getByRole('button', { name: /english/i }))
    expect(screen.getByTestId('language')).toHaveTextContent('en')

    fireEvent.click(screen.getByRole('button', { name: /finnish/i }))
    expect(screen.getByTestId('language')).toHaveTextContent('fi')
  })

  test('renders translations with interpolation', () => {
    function InterpolationProbe() {
      const { t } = useTranslation()

      return (
        <span data-testid="interpolated">
          {t('answerPopup.chosenLevel').replace('{level}', 'BSL-2')}
        </span>
      )
    }

    render(
      <TranslationProvider>
        <InterpolationProbe />
      </TranslationProvider>
    )

    expect(screen.getByTestId('interpolated')).toHaveTextContent('BSL-2')
  })
})

describe('useTranslation hook edge cases', () => {
  test('t function returns correct translation for nested keys', () => {
    function NestedKeyProbe() {
      const { t } = useTranslation()

      return (
        <>
          <span data-testid="app-title">{t('app.title')}</span>
          <span data-testid="start-button">{t('startScreen.startButton')}</span>
          <span data-testid="lecture-title">{t('lecturePanel.title')}</span>
        </>
      )
    }

    render(
      <TranslationProvider>
        <NestedKeyProbe />
      </TranslationProvider>
    )

    expect(screen.getByTestId('app-title')).toHaveTextContent('BSL-game')
    expect(screen.getByTestId('start-button')).toHaveTextContent('Start Game')
    expect(screen.getByTestId('lecture-title')).toHaveTextContent('Lecture Materials')
  })

  test('t function handles missing keys gracefully', () => {
    function MissingKeyProbe() {
      const { t } = useTranslation()

      return <span data-testid="missing">{t('non.existent.key')}</span>
    }

    render(
      <TranslationProvider>
        <MissingKeyProbe />
      </TranslationProvider>
    )

    // Should render something (either undefined or the key path)
    expect(screen.getByTestId('missing')).toBeInTheDocument()
  })
})
