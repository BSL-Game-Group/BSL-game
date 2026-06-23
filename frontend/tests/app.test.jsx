import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../src/App'

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
)

jest.mock('../src/Game', () => () => (
  <div data-testid="game-component">Game Loaded</div>
))

jest.mock('../game/main', () => jest.fn(() => ({ destroy: jest.fn() })))

/* -----------------------------
   START BUTTON TESTS
----------------------------- */

describe('Start button', () => {
  test('renders start button initially', () => {
    render(<App />)

    expect(
      screen.getByRole('button', { name: /start game/i })
    ).toBeInTheDocument()
  })

  test('clicking start button shows game and removes button', () => {
    render(<App />)

    const button = screen.getByRole('button', {
      name: /start game/i,
    })

    fireEvent.click(button)

    expect(screen.getByTestId('game-component')).toBeInTheDocument()

    expect(
      screen.queryByRole('button', { name: /start game/i })
    ).not.toBeInTheDocument()
  })
})

/* -----------------------------
   LECTURE PANEL TESTS
----------------------------- */

test('lecture panel is hidden before entering lecture room', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
  expect(screen.getByTestId('lecture-panel')).not.toBeVisible()
})

test('lecture-room-entered event shows the lecture panel', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
  act(() => window.dispatchEvent(new Event('lecture-room-entered')))
  expect(screen.getByTestId('lecture-panel')).toBeVisible()
})

test('lecture panel shows the title', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

  act(() => window.dispatchEvent(new Event('lecture-room-entered')))

  expect(screen.getByRole('heading', { level: 2 }))
    .toHaveTextContent('Lecture Materials')
})

test('lecture panel contains material links', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

  act(() => window.dispatchEvent(new Event('lecture-room-entered')))

  const links = screen.getAllByRole('link')

  expect(links).toHaveLength(3)

  expect(links[0]).toHaveAttribute(
    'href',
    'https://consteril.com/biosafety-levels-difference/'
  )
  expect(links[1]).toHaveAttribute(
    'href',
    'https://www.ncbi.nlm.nih.gov/books/NBK535351/'
  )
  expect(links[2]).toHaveAttribute(
    'href',
    'https://www.sciencedirect.com/science/chapter/monograph/pii/B9780128092316000119'
  )
})

/* -----------------------------
   CLOSET FEATURE TESTS (NEW)
----------------------------- */

test('closet popup opens when event is triggered', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

  act(() =>
    window.dispatchEvent(new Event('closet-popup-opened'))
  )

  expect(
    screen.getByText(/choose equipment for bsl laboratory/i)
  ).toBeInTheDocument()
})
/* -----------------------------
   HIGH-ORDER GAME LOGIC TESTS
----------------------------- */

test('pressing E logic results in closet popup opening (via event)', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
  
  act(() => {
    window.dispatchEvent(new Event('closet-popup-opened'))
  })

  expect(
    screen.getByText(/choose equipment for bsl laboratory/i)
  ).toBeInTheDocument()
})

test('no closet popup appears without event', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))

  expect(
    screen.queryByText(/choose equipment for bsl laboratory/i)
  ).not.toBeInTheDocument()
})
