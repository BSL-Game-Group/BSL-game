import { CATEGORY_IDS } from './equipmentCategories'

const ROOM_POINTS = 30
const EQUIPMENT_POINTS = 60

// Every level is graded on all five categories — the ones a level does not ask for
// come back `ok` as long as the player wears nothing in them, so they pay out too and
// stray gear is what costs. That makes a category worth the same everywhere, and makes
// every microbe worth the same 90. A retry is worth half. Mirrors
// calculateMultiRoundScore in backend/services/scoring.js.
export const CATEGORY_POINTS = EQUIPMENT_POINTS / CATEGORY_IDS.length

function award({ correct, previouslyCorrect, value }) {
  if (previouslyCorrect) { return { points: 0, value, state: 'banked' } }
  if (correct) { return { points: value, value, state: 'earned' } }
  return { points: 0, value, state: 'missed' }
}

export function scoreAnswer({ attempt = 1, roomCorrect = false, equipmentSlots, previous }) {
  const retry = attempt === 2
  const categoryValue = retry ? CATEGORY_POINTS / 2 : CATEGORY_POINTS

  const room = award({
    correct: roomCorrect,
    previouslyCorrect: retry && Boolean(previous?.roomCorrect),
    value: retry ? ROOM_POINTS / 2 : ROOM_POINTS,
  })

  const categories = Object.fromEntries(
    CATEGORY_IDS.map((id) => [
      id,
      award({
        correct: equipmentSlots?.[id]?.status === 'ok',
        previouslyCorrect: retry && previous?.equipmentSlots?.[id]?.status === 'ok',
        value: categoryValue,
      }),
    ])
  )

  const total =
    room.points + CATEGORY_IDS.reduce((sum, id) => sum + categories[id].points, 0)

  return { room, categories, total }
}
