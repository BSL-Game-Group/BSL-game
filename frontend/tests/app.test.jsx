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

jest.mock('../game/main', () => jest.fn(() => ({ destroy: jest.fn() })))

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
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
  act(() => window.dispatchEvent(new Event('lecture-room-entered')))
  expect(screen.getByRole('heading')).toHaveTextContent('Luento-materiaali')
})