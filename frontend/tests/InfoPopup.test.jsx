import { render, screen, fireEvent } from './test-utils'
import '@testing-library/jest-dom'
import InfoPopup from '../src/components/InfoPopup/InfoPopup'

test('renders nothing when closed', () => {
  const { container } = render(<InfoPopup open={false} onClose={() => {}} />)
  expect(container).toBeEmptyDOMElement()
})

test('shows the how-to-play steps when open', () => {
  render(<InfoPopup open={true} onClose={() => {}} />)

  expect(
    screen.getByRole('heading', { name: /how to play/i })
  ).toBeInTheDocument()
  expect(screen.getByText(/remember the bsl level/i)).toBeInTheDocument()
})

test('close button calls onClose', () => {
  const onClose = jest.fn()
  render(<InfoPopup open={true} onClose={onClose} />)

  fireEvent.click(screen.getByRole('button', { name: /close/i }))

  expect(onClose).toHaveBeenCalledTimes(1)
})
