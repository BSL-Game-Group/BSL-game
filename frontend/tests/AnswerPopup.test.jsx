import { render, screen, fireEvent } from './test-utils'
import { render as rtlRender } from '@testing-library/react'
import '@testing-library/jest-dom'
import AnswerPopup from '../src/components/AnswerPopup/AnswerPopup'
import { TranslationContext } from '../src/i18n/context'

// -----------------------------
// HELPERS
// -----------------------------
function renderPopup(props = {}) {
  const defaults = { open: true, onClose: jest.fn(), isCorrect: true, level: 'BSL-2' }
  return render(<AnswerPopup {...defaults} {...props} />)
}

function renderPopupWithLanguage(language, props = {}) {
  const defaults = { open: true, onClose: jest.fn(), isCorrect: true, level: 'BSL-2' }
  const translations = {
    'answerPopup.correct': 'Correct!',
    'answerPopup.incorrect': 'Not quite',
    'answerPopup.correctFallback': "That's the right room.",
    'answerPopup.incorrectFallback': "That isn't the right room.",
    'answerPopup.chosenLevel': 'You chose {level}.',
    'answerPopup.belongs': '{name} belongs to BSL-{level}.',
    'common.close': 'Close',
  }
  const value = {
    language,
    setLanguage: jest.fn(),
    t: (k) => translations[k] ?? k,
    tList: () => [],
  }
  return rtlRender(
    <TranslationContext.Provider value={value}>
      <AnswerPopup {...defaults} {...props} />
    </TranslationContext.Provider>
  )
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
    renderPopup({ isCorrect: false, microbe })

    expect(screen.getByText(/that organism belongs elsewhere/i)).toBeInTheDocument()
  })

  test('shows the true class of the microbe', () => {
    renderPopup({ isCorrect: false, level: 'BSL-3', microbe })

    expect(screen.getByText(/E\. coli belongs to BSL-1/i)).toBeInTheDocument()
  })

  test('shows Swedish feedback and name when language is sv', () => {
    const svMicrobe = {
      common_name: 'E. coli',
      common_name_sv: 'E. coli (svenska)',
      bsl_level: 1,
      feedback_correct: 'Great, that organism belongs at this level.',
      feedback_correct_sv: 'Bra, den organismen hör hemma på denna nivå.',
      feedback_incorrect: 'Careful, that organism belongs elsewhere.',
      feedback_incorrect_sv: 'Varning, den organismen hör hemma någon annanstans.',
    }

    renderPopupWithLanguage('sv', { isCorrect: true, microbe: svMicrobe })

    expect(screen.getByText('Bra, den organismen hör hemma på denna nivå.')).toBeInTheDocument()
    expect(screen.getByText(/E\. coli \(svenska\)/)).toBeInTheDocument()
  })

  test('shows Finnish feedback and name when language is fi', () => {
    const fiMicrobe = {
      common_name: 'E. coli',
      common_name_fi: 'E. coli (suomi)',
      bsl_level: 1,
      feedback_correct: 'Great, that organism belongs at this level.',
      feedback_correct_fi: 'Hyvä, tämä organismi kuuluu tälle tasolle.',
      feedback_incorrect: 'Careful, that organism belongs elsewhere.',
      feedback_incorrect_fi: 'Varo, tämä organismi kuuluu muualle.',
    }

    renderPopupWithLanguage('fi', { isCorrect: true, microbe: fiMicrobe })

    expect(screen.getByText('Hyvä, tämä organismi kuuluu tälle tasolle.')).toBeInTheDocument()
    expect(screen.getByText(/E\. coli \(suomi\)/)).toBeInTheDocument()
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
