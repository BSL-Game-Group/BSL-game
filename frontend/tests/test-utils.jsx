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
      'task.undressRequired': 'Go to the dressing room and wash up before you get the next microbe.',


      'answerPopup.correct': 'Correct!',
      'answerPopup.incorrect': 'Not quite',
      'answerPopup.correctFallback': 'The BSL room you chose was correct.',
      'answerPopup.incorrectFallback': 'The BSL room you chose was not correct.',

      'answerPopup.chosenLevel': 'You chose {level}.',
      'answerPopup.belongs': '{name} belongs to BSL-{level}.',
      'answerPopup.equipmentCorrect': 'Your protective equipment matched the required setup.',
      'answerPopup.equipmentIncorrect': 'Your protective equipment did not fully match the required setup.',
      'answerPopup.slotCorrect': 'correct',
      'answerPopup.slotIncorrect': 'incorrect',
      'answerPopup.pointsRoom': 'Room',
      'answerPopup.pointsTotal': 'Points from this microbe',
      'answerPopup.pointsBanked': 'already earned',
      'answerPopup.tryAgain': 'Try again',
      'answerPopup.lastAttempt': 'That was your last try for this microbe.',

      'closet.title': 'Closet',
      'closet.nothingAvailable': 'Nothing available',

      'equipment.categories.eyewear': 'Eyewear',
      'equipment.categories.masks': 'Masks',
      'equipment.categories.body': 'Body',
      'equipment.categories.gloves': 'Gloves',
      'equipment.categories.footwear': 'Footwear',

      'common.close': 'Close',
      'microbeInfoPopup.title': 'Microbe Information',
      'microbeInfoPopup.commonName': 'Common name',
      'microbeInfoPopup.scientificName': 'Scientific name',
      'microbeInfoPopup.type': 'Type',
      'microbeInfoPopup.description': 'Description',

      'hud.score': 'Score: {score}',
      'hud.microbes': 'Microbes: {count}',

      'auth.guest': 'Playing as a guest',
      'auth.signedInAs': 'Signed in as {username}',
      'auth.loginButton': 'Log in',
      'auth.logoutButton': 'Log out',
      'auth.cancel': 'Cancel',
      'auth.usernameLabel': 'Username',
      'auth.passwordLabel': 'Password',
      'auth.submitLogin': 'Log in',
      'auth.submitRegister': 'Create account',
      'auth.switchToRegister': 'No account yet? Create one',
      'auth.switchToLogin': 'Already have an account? Log in',
      'auth.noRecovery': 'There is no password recovery — write it down somewhere safe.',
      'auth.working': 'Working…',
      'auth.errors.invalid_credentials': 'Wrong username or password.',
      'auth.errors.username_taken': 'That username is taken.',
      'auth.errors.network': 'Could not reach the server. Try again.',
      'auth.rounds.title': 'Your rounds',
      'auth.rounds.empty': 'No rounds.',
      'auth.rounds.openButton': 'My rounds',
      'auth.leaderboard.title': 'Leaderboard',
      'auth.leaderboard.empty': 'No rounds played.',
      'auth.leaderboard.openButton': 'Leaderboard',
      'auth.claim.title': 'Round finished',
      'auth.claim.scoreLine': 'You scored {score} points.',
      'auth.claim.guestWarning': 'This score only lives in this browser until you keep it.',
      'auth.claim.keepScore': 'Keep my score',
      'auth.claim.savedToAccount': 'Saved to your account.',
      'auth.claim.roundsSaved': 'Rounds saved to your account: {count}',
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