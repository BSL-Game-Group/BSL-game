import { render, screen, act } from '@testing-library/react'
import Task from '../src/components/Task'
import { EventBus } from '../src/game/EventBus'

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
})