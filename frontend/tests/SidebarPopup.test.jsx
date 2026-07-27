import { render as rtlRender, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SidebarPopup from '../src/components/SidebarPopup'
import { TranslationContext } from '../src/i18n/context'
import bslMaterialService from '../src/services/bslMaterial'

jest.mock('../src/services/bslMaterial')

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
  sv: {
    'common.close': 'Stäng',
    'bslMaterial.title': 'BSL-spelets material (biosäkerhetsnivåer)',
    'bslMaterial.protectiveEquipment': 'Skyddsutrustning:',
    'bslMaterial.exampleOrganisms': 'Exempelorganismer:',
    'bslMaterial.sources': 'Källor',
  },
}

const materialEn = {
  intro: { heading: 'International development', paragraphs: ['Roots of the BSL system.'] },
  riskGroups: { heading: 'The four risk groups', intro: 'Based on four factors:', factors: ['Pathogenicity'] },
  bslLevels: [
    {
      level: 1,
      title: 'BSL-1 — Low risk',
      description: 'Low risk description.',
      equipment: ['Lab coat'],
      examples: 'Example organisms.',
    },
  ],
  organismTables: [],
  sources: [],
}

const materialFi = {
  intro: { heading: 'Kansainvälinen kehitys', paragraphs: ['BSL-järjestelmän juuret.'] },
  riskGroups: { heading: 'Neljä riskiryhmää', intro: 'Perustuu neljään tekijään:', factors: ['Patogeenisuus'] },
  bslLevels: [
    {
      level: 1,
      title: 'BSL-1 — Matala riski',
      description: 'Matalan riskin kuvaus.',
      equipment: ['Laboratoriotakki'],
      examples: 'Esimerkkiorganismeja.',
    },
  ],
  organismTables: [],
  sources: [],
}

const materialSv = {
  intro: { heading: 'Internationell utveckling', paragraphs: ['BSL-systemets rötter.'] },
  riskGroups: { heading: 'De fyra riskgrupperna', intro: 'Baseras på fyra faktorer:', factors: ['Patogenicitet'] },
  bslLevels: [
    {
      level: 1,
      title: 'BSL-1 — Låg risk',
      description: 'Beskrivning av låg risk.',
      equipment: ['Labbrock'],
      examples: 'Exempelorganismer.',
    },
  ],
  organismTables: [],
  sources: [],
}

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows the English material by default', async () => {
    bslMaterialService.getMaterial.mockResolvedValue(materialEn)

    renderWithLanguage('en')

    expect(
      await screen.findByRole('heading', { name: /BSL Game Material \(Biosafety Levels\)/i })
    ).toBeInTheDocument()
    expect(await screen.findByText(/International development/i)).toBeInTheDocument()
    expect(bslMaterialService.getMaterial).toHaveBeenCalledWith('en')
  })

  test('shows the Finnish material when language is fi', async () => {
    bslMaterialService.getMaterial.mockResolvedValue(materialFi)

    renderWithLanguage('fi')

    expect(
      await screen.findByRole('heading', { name: /BSL-pelin materiaali \(biosafety-tasot\)/i })
    ).toBeInTheDocument()
    expect(await screen.findByText(/Kansainvälinen kehitys/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Suojavarustus:/i).length).toBeGreaterThan(0)
    expect(bslMaterialService.getMaterial).toHaveBeenCalledWith('fi')
  })

  test('shows the Swedish material when language is sv', async () => {
    bslMaterialService.getMaterial.mockResolvedValue(materialSv)

    renderWithLanguage('sv')

    expect(
      await screen.findByRole('heading', { name: /BSL-spelets material \(biosäkerhetsnivåer\)/i })
    ).toBeInTheDocument()
    expect(await screen.findByText(/Internationell utveckling/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Skyddsutrustning:/i).length).toBeGreaterThan(0)
    expect(bslMaterialService.getMaterial).toHaveBeenCalledWith('sv')
  })
})
