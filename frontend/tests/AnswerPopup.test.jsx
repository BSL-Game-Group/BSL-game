import { render, screen, fireEvent } from './test-utils'
import '@testing-library/jest-dom'
import AnswerPopup from '../src/components/AnswerPopup/AnswerPopup'

// -----------------------------
// HELPERS
// -----------------------------
function renderPopup(props = {}) {
  const defaults = {
    open: true,
    onClose: jest.fn(),
    isCorrect: true,
    isLevelCorrect: true,
    isEquipmentCorrect: true,
    level: 'BSL-2',
  }
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

  // -----------------------------
  // MICROBE FEEDBACK TESTS
  // -----------------------------
  const microbe = {
    common_name: 'E. coli',
    bsl_level: 1,
    feedback_correct: 'Great, that organism belongs at this level.',
    feedback_incorrect: 'Careful, that organism belongs elsewhere.',
  }

  test('shows the backend correct feedback when correct with a microbe', () => {
    renderPopup({ isCorrect: true, microbe })

    expect(screen.getByText(/that organism belongs at this level/i)).toBeInTheDocument()
  })

  test('shows the backend incorrect feedback when wrong with a microbe', () => {
    renderPopup({ isCorrect: false, isLevelCorrect: false, microbe })

    expect(screen.getByText(/that organism belongs elsewhere/i)).toBeInTheDocument()
  })

  test('shows the true class of the microbe', () => {
    renderPopup({ isCorrect: false, isLevelCorrect: false, level: 'BSL-3', microbe })

    expect(screen.getByText(/E\. coli belongs to BSL-1/i)).toBeInTheDocument()
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
