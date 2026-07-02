import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AnswerPopup from '../src/components/AnswerPopup/AnswerPopup'

// -----------------------------
// HELPERS
// -----------------------------
function renderPopup(props = {}) {
  const defaults = { open: true, onClose: jest.fn(), isCorrect: true, level: 'BSL-2' }
  return render(<AnswerPopup {...defaults} {...props} />)
}

describe('AnswerPopup component', () => {
  test('does not render when closed', () => {
    renderPopup({ open: false })

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  test('renders "Correct!" when the answer is correct', () => {
    renderPopup({ isCorrect: true })

    expect(screen.getByText(/correct!/i)).toBeInTheDocument()
  })

  test('renders "Not quite" when the answer is incorrect', () => {
    renderPopup({ isCorrect: false })

    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
  })

  test('shows the level in the message', () => {
    renderPopup({ level: 'BSL-3' })

    expect(screen.getByText(/BSL-3/)).toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()

    renderPopup({ onClose })

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // -----------------------------
  // EVENT TESTS (movement lock)
  // -----------------------------

  test('dispatches popup-opened event when mounted open', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    renderPopup({ open: true })

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'popup-opened' })
    )

    spy.mockRestore()
  })

  test('dispatches popup-closed event when closed via rerender', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    const { rerender } = renderPopup({ open: true })

    rerender(<AnswerPopup open={false} onClose={jest.fn()} isCorrect level="BSL-2" />)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'popup-closed' })
    )

    spy.mockRestore()
  })
})
