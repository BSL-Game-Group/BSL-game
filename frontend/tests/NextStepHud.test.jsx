import { render, screen } from './test-utils'
import '@testing-library/jest-dom'
import NextStepHud from '../src/components/NextStepHud'

test('is hidden while silent or subtle', () => {
  render(<NextStepHud objective={{ id: 'suit-up' }} stage="silent" />)
  expect(screen.queryByTestId('next-step-hud')).not.toBeInTheDocument()
})

test('is hidden during the subtle stage too', () => {
  render(<NextStepHud objective={{ id: 'suit-up' }} stage="subtle" />)
  expect(screen.queryByTestId('next-step-hud')).not.toBeInTheDocument()
})

test('shows the objective text once verbal', () => {
  render(<NextStepHud objective={{ id: 'suit-up' }} stage="verbal" />)
  expect(screen.getByTestId('next-step-hud')).toHaveTextContent(
    'Next: put on your protective equipment'
  )
})

test('stays visible at the directional stage', () => {
  render(
    <NextStepHud
      objective={{ id: 'go-to-room', target: 'BSL-3' }}
      roomLabel="BSL-3"
      stage="directional"
    />
  )
  expect(screen.getByTestId('next-step-hud')).toHaveTextContent('Next: go to BSL-3')
})

test('renders nothing without an objective', () => {
  render(<NextStepHud objective={null} stage="verbal" />)
  expect(screen.queryByTestId('next-step-hud')).not.toBeInTheDocument()
})
