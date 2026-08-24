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

test('fills the room name into the objective text', () => {
  render(
    <NextStepHud
      objective={{ id: 'go-to-room', target: 'BSL-3' }}
      roomLabel="BSL-3"
      stage="verbal"
    />
  )
  expect(screen.getByTestId('next-step-hud')).toHaveTextContent('Next: go to BSL-3')
})

test('renders nothing without an objective', () => {
  render(<NextStepHud objective={null} stage="verbal" />)
  expect(screen.queryByTestId('next-step-hud')).not.toBeInTheDocument()
})

test('has no skip button when onSkipGuide is not provided', () => {
  render(<NextStepHud objective={{ id: 'suit-up' }} stage="verbal" />)
  expect(screen.queryByTestId('next-step-hud-skip')).not.toBeInTheDocument()
})

test('clicking the skip button calls onSkipGuide', () => {
  const onSkipGuide = jest.fn()
  render(
    <NextStepHud objective={{ id: 'suit-up' }} stage="verbal" onSkipGuide={onSkipGuide} />
  )
  screen.getByTestId('next-step-hud-skip').click()
  expect(onSkipGuide).toHaveBeenCalledTimes(1)
})
