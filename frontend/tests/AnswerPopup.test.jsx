import { render, screen, fireEvent } from './test-utils'
import { render as rtlRender } from '@testing-library/react'
import '@testing-library/jest-dom'
import AnswerPopup from '../src/components/AnswerPopup/AnswerPopup'
import { TranslationContext } from '../src/i18n/context'

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

function renderPopupWithLanguage(language, props = {}) {
  const defaults = { 
      open: true, 
      onClose: jest.fn(), 
      isCorrect: true, 
      isLevelCorrect: true, 
      isEquipmentCorrect: true, 
      level: 'BSL-2' 
    }
  const translations = {
    'answerPopup.correct': 'Correct!',
    'answerPopup.incorrect': 'Not quite',
    'answerPopup.correctFallback': 'The BSL room you chose was correct.',
    'answerPopup.incorrectFallback': 'The BSL room you chose was not correct.',
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
    renderPopup({ isCorrect: false, isLevelCorrect: false, microbe })

    expect(screen.getByText(/that organism belongs elsewhere/i)).toBeInTheDocument()
  })

  test('shows the true class of the microbe', () => {
    renderPopup({ isCorrect: false, isLevelCorrect: false, level: 'BSL-3', microbe })

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

describe('equipment breakdown', () => {
  const OK = { status: 'ok', missing: [], extra: [] }

  test('shows a verdict for all five categories, naming no items', () => {
    renderPopup({
      isCorrect: false,
      isEquipmentCorrect: false,
      equipmentSlots: {
        eyewear: OK,
        masks: { status: 'wrong', missing: ['mask'], extra: ['bsl3_respirator'] },
        body: OK,
        gloves: OK,
        footwear: OK,
      },
    })

    for (const label of ['Eyewear', 'Masks', 'Body', 'Gloves', 'Footwear']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }

    expect(screen.getByText('Masks').closest('li')).toHaveTextContent('incorrect')
    expect(screen.getAllByText('correct')).toHaveLength(4)
    expect(screen.getAllByText('incorrect')).toHaveLength(1)
    expect(screen.queryByText(/bsl3_respirator|missing/i)).not.toBeInTheDocument()
  })

  test('renders no breakdown when no slots are supplied', () => {
    renderPopup()

    expect(screen.queryByText('Eyewear')).not.toBeInTheDocument()
  })
})

describe('retry affordance', () => {
  test('offers a focused retry when the answer is wrong and a retry is left', () => {
    const onRetry = jest.fn()

    renderPopup({ isCorrect: false, attempt: 1, onRetry })

    const button = screen.getByRole('button', { name: /try again/i })

    expect(button).toHaveFocus()

    fireEvent.click(button)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('a re-render does not drag focus back off Close', () => {
    const props = { open: true, onClose: jest.fn(), isCorrect: false, isLevelCorrect: false,
      isEquipmentCorrect: true, level: 'BSL-2', attempt: 1, onRetry: jest.fn() }

    const { rerender } = render(<AnswerPopup {...props} />)

    const close = screen.getByRole('button', { name: /^close$/i })

    close.focus()
    rerender(<AnswerPopup {...props} />)

    expect(close).toHaveFocus()
  })

  test.each([
    ['no retry is left', { isCorrect: false, attempt: 2 }, true],
    ['the answer was correct', { isCorrect: true, attempt: 1 }, false],
  ])('offers no retry when %s', (_label, props, saysWhy) => {
    renderPopup(props)

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    expect(Boolean(screen.queryByText(/last try/i))).toBe(saysWhy)
  })
})

// Every microbe feedback string names the correct level, so the prose gives the
// answer away just as much as the "belongs to" line. Both have to wait until the
// player has nothing left to retry, or the retry is pointless.
describe('the answer is withheld while a retry is on offer', () => {
  const microbe = {
    common_name: 'E. coli',
    bsl_level: 1,
    feedback_correct: 'Great, that organism belongs at this level.',
    feedback_incorrect: 'Careful, that organism belongs elsewhere.',
  }

  test('a retry hides the microbe feedback and the true class', () => {
    renderPopup({
      isCorrect: false,
      isLevelCorrect: false,
      level: 'BSL-3',
      microbe,
      attempt: 1,
      onRetry: jest.fn(),
    })

    expect(screen.queryByText(/that organism belongs elsewhere/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/E\. coli belongs to BSL-1/i)).not.toBeInTheDocument()
    expect(screen.getByText(/the BSL room you chose was not correct/i)).toBeInTheDocument()
  })

  test('the last attempt reveals both', () => {
    renderPopup({
      isCorrect: false,
      isLevelCorrect: false,
      level: 'BSL-3',
      microbe,
      attempt: 2,
    })

    expect(screen.getByText(/that organism belongs elsewhere/i)).toBeInTheDocument()
    expect(screen.getByText(/E\. coli belongs to BSL-1/i)).toBeInTheDocument()
  })

  test('getting it right first try still reveals both', () => {
    renderPopup({ isCorrect: true, isLevelCorrect: true, level: 'BSL-1', microbe, attempt: 1 })

    expect(screen.getByText(/that organism belongs at this level/i)).toBeInTheDocument()
    expect(screen.getByText(/E\. coli belongs to BSL-1/i)).toBeInTheDocument()
  })

  // The withheld line describes the ROOM, so the right room with the wrong gear
  // must not be told it picked the wrong room.
  test('the right room with the wrong gear is not told the room was wrong', () => {
    renderPopup({
      isCorrect: false,
      isLevelCorrect: true,
      isEquipmentCorrect: false,
      level: 'BSL-1',
      microbe,
      attempt: 1,
      onRetry: jest.fn(),
    })

    expect(screen.getByText(/the BSL room you chose was correct/i)).toBeInTheDocument()
    expect(screen.queryByText(/the BSL room you chose was not correct/i)).not.toBeInTheDocument()
  })
})
