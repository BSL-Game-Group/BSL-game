import { render, screen, fireEvent } from '@testing-library/react'
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