import { render, screen, act } from './test-utils'
import { render as rtlRender } from '@testing-library/react'
import Task from '../src/components/Task'
import { EventBus } from '../src/game/EventBus'
import { TranslationContext } from '../src/i18n/context'

function renderWithLanguage(language) {
  const value = { language, setLanguage: jest.fn(), t: (k) => k, tList: () => [] }
  return rtlRender(
    <TranslationContext.Provider value={value}>
      <Task />
    </TranslationContext.Provider>
  )
}

jest.mock('../src/game/EventBus', () => ({
  EventBus: {
    on: jest.fn(),
    off: jest.fn(),
  },
}))

describe('Task', () => {
  let eventHandler

  beforeEach(() => {
    jest.clearAllMocks()

    EventBus.on.mockImplementation((event, handler) => {
      if (event === 'current-microbe-updated') {
        eventHandler = handler
      }
    })
  })

  test('subscribes to EventBus on mount', () => {
    render(<Task />)

    expect(EventBus.on).toHaveBeenCalledWith(
      'current-microbe-updated',
      expect.any(Function)
    )
  })

  test('unsubscribes from EventBus on unmount', () => {
    const { unmount } = render(<Task />)

    const handler = EventBus.on.mock.calls[0][1]

    unmount()

    expect(EventBus.off).toHaveBeenCalledWith(
      'current-microbe-updated',
      handler
    )
  })

  test('renders nothing initially', () => {
    const { container } = render(<Task />)

    expect(container.firstChild).toBeNull()
  })

  test('renders microbe information when event is received', () => {
    render(<Task />)

    const microbe = {
      common_name: 'E. coli',
      scientific_name: 'Escherichia coli',
      type: 'Bacterium',
      lecture_text: 'Common gut bacterium',
    }

    act(() => {
      eventHandler(microbe)
    })

    expect(
      screen.getByRole('heading', {
        name: /the microbe you will handle/i,
      })
    ).toBeInTheDocument()

    expect(screen.getByText('E. coli')).toBeInTheDocument()
    expect(screen.getByText('Escherichia coli')).toBeInTheDocument()
    expect(screen.getByText('Bacterium')).toBeInTheDocument()
    expect(screen.getByText('Common gut bacterium')).toBeInTheDocument()
  })

  test('copies the microbe object instead of using the original reference', () => {
    render(<Task />)

    const microbe = {
      common_name: 'E. coli',
      scientific_name: 'Escherichia coli',
      type: 'Bacterium',
      lecture_text: 'Common gut bacterium',
    }

    act(() => {
      eventHandler(microbe)
    })

    microbe.common_name = 'Changed'

    expect(screen.getByText('E. coli')).toBeInTheDocument()
    expect(screen.queryByText('Changed')).not.toBeInTheDocument()
  })

  test('shows the Swedish fields when language is sv', () => {
    renderWithLanguage('sv')

    const microbe = {
      common_name: 'E. coli',
      common_name_sv: 'E. coli (svenska)',
      scientific_name: 'Escherichia coli',
      type: 'Bacterium',
      type_sv: 'Bakterie',
      lecture_text: 'Common gut bacterium',
      lecture_text_sv: 'Vanlig tarmbakterie',
    }

    act(() => {
      eventHandler(microbe)
    })

    expect(screen.getByText('E. coli (svenska)')).toBeInTheDocument()
    expect(screen.getByText('Bakterie')).toBeInTheDocument()
    expect(screen.getByText('Vanlig tarmbakterie')).toBeInTheDocument()
    // scientific_name is language-independent
    expect(screen.getByText('Escherichia coli')).toBeInTheDocument()
    expect(screen.queryByText('E. coli')).not.toBeInTheDocument()
  })

  test('shows the Finnish fields when language is fi', () => {
    renderWithLanguage('fi')

    const microbe = {
      common_name: 'E. coli',
      common_name_fi: 'E. coli (suomi)',
      scientific_name: 'Escherichia coli',
      type: 'Bacterium',
      type_fi: 'Bakteeri',
      lecture_text: 'Common gut bacterium',
      lecture_text_fi: 'Yleinen suolistobakteeri',
    }

    act(() => {
      eventHandler(microbe)
    })

    expect(screen.getByText('E. coli (suomi)')).toBeInTheDocument()
    expect(screen.getByText('Bakteeri')).toBeInTheDocument()
    expect(screen.getByText('Yleinen suolistobakteeri')).toBeInTheDocument()
    expect(screen.getByText('Escherichia coli')).toBeInTheDocument()
    expect(screen.queryByText('E. coli')).not.toBeInTheDocument()
  })
})