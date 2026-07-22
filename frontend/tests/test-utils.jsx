/* eslint-disable react-refresh/only-export-components */

import { render } from '@testing-library/react'
import { TranslationContext } from '../src/i18n/context'

const translationValue = {
  language: 'en',
  setLanguage: jest.fn(),

  t: (key) => {
    const translations = {
      'howToPlay.title': 'How to play',
      'howToPlay.controls': 'Controls: Arrow keys / click to move',

      'task.title': 'The microbe you will handle',

      'answerPopup.correct': 'Correct!',
      'answerPopup.incorrect': 'Not quite',
      'answerPopup.correctFallback': "That's the right room.",
      'answerPopup.incorrectFallback': "That isn't the right room.",

      'answerPopup.chosenLevel': 'You chose {level}.',
      'answerPopup.belongs': '{name} belongs to BSL-{level}.',
      'answerPopup.equipmentCorrect': 'Your protective equipment matched the required setup.',
      'answerPopup.equipmentIncorrect': 'Your protective equipment did not fully match the required setup.',

      'common.close': 'Close',
    }

    return translations[key] ?? key
  },

  tList: (key) => {
    if (key === 'howToPlay.steps') {
      return [
        'Remember the BSL level',
        'Go to the lecture room',
        'Study the microbe details',
        'Choose protective equipment',
      ]
    }

    return []
  },
}

function Providers({ children }) {
  return (
    <TranslationContext.Provider value={translationValue}>
      {children}
    </TranslationContext.Provider>
  )
}

const customRender = (ui, options) =>
  render(ui, {
    wrapper: Providers,
    ...options,
  })

export * from '@testing-library/react'
export { customRender as render }