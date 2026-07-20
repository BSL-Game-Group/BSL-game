import { render as rtlRender, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SidebarPopup from '../src/components/SidebarPopup'
import { TranslationContext } from '../src/i18n/context'

const translations = {
  en: {
    'common.close': 'Close',
    'bslMaterial.title': 'BSL Game Material (Biosafety Levels)',
    'bslMaterial.protectiveEquipment': 'Protective equipment:',
    'bslMaterial.exampleOrganisms': 'Example organisms:',
    'bslMaterial.sources': 'Sources',
  },
  fi: {
    'common.close': 'Sulje',
    'bslMaterial.title': 'BSL-pelin materiaali (biosafety-tasot)',
    'bslMaterial.protectiveEquipment': 'Suojavarustus:',
    'bslMaterial.exampleOrganisms': 'Esimerkkiorganismeja:',
    'bslMaterial.sources': 'Lähteet',
  },
}
translations.sv = translations.en

function renderWithLanguage(language, props = {}) {
  const value = {
    language,
    setLanguage: jest.fn(),
    t: (k) => translations[language][k] ?? k,
    tList: () => ['#', 'Name', 'Scientific name', 'Type', 'Note'],
  }
  return rtlRender(
    <TranslationContext.Provider value={value}>
      <SidebarPopup open onClose={jest.fn()} {...props} />
    </TranslationContext.Provider>
  )
}

describe('SidebarPopup', () => {
  test('shows the English material by default', () => {
    renderWithLanguage('en')

    expect(
      screen.getByRole('heading', { name: /BSL Game Material \(Biosafety Levels\)/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/International development/i)).toBeInTheDocument()
  })

  test('shows the Finnish material when language is fi', () => {
    renderWithLanguage('fi')

    expect(
      screen.getByRole('heading', { name: /BSL-pelin materiaali \(biosafety-tasot\)/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/Kansainvälinen kehitys/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Suojavarustus:/i).length).toBeGreaterThan(0)
  })

  test('falls back to English content for Swedish (not yet translated)', () => {
    renderWithLanguage('sv')

    expect(screen.getByText(/International development/i)).toBeInTheDocument()
  })
})
