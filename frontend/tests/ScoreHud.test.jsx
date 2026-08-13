import { render, screen } from './test-utils'
import '@testing-library/jest-dom'
import ScoreHud from '../src/components/ScoreHud'

test('the score and the microbes handled are both shown', () => {
  render(<ScoreHud score={3} answered={5} />)

  expect(screen.getByTestId('score-hud')).toHaveTextContent('Score: 3')
  expect(screen.getByTestId('score-hud')).toHaveTextContent('Microbes: 5')
})

test('a round with nothing right shows zero rather than nothing', () => {
  render(<ScoreHud score={0} answered={2} />)

  expect(screen.getByTestId('score-hud')).toHaveTextContent('Score: 0')
})
