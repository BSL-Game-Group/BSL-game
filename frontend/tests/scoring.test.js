import { scoreAnswer, CATEGORY_POINTS } from '../src/utils/scoring'

const OK = { status: 'ok', missing: [], extra: [] }
const WRONG = { status: 'wrong', missing: ['mask'], extra: [] }
const STRAY = { status: 'wrong', missing: [], extra: ['mask'] }

function slots(overrides = {}) {
  return { eyewear: OK, masks: OK, body: OK, gloves: OK, footwear: OK, ...overrides }
}

test('a category is worth 12 at every level', () => {
  expect(CATEGORY_POINTS).toBe(12)
})

describe('first attempt', () => {
  test('all five categories and the room make 90', () => {
    const result = scoreAnswer({ roomCorrect: true, equipmentSlots: slots() })

    expect(result.room).toEqual({ points: 30, value: 30, state: 'earned' })
    expect(result.categories.eyewear).toEqual({ points: 12, value: 12, state: 'earned' })
    expect(result.total).toBe(90)
  })

  test('a wrong category is worth its value but earns nothing', () => {
    const result = scoreAnswer({ roomCorrect: true, equipmentSlots: slots({ masks: WRONG }) })

    expect(result.categories.masks).toEqual({ points: 0, value: 12, state: 'missed' })
    expect(result.total).toBe(78)
  })

  // A category the level does not ask for is `ok` while it is empty, so it pays out;
  // putting gear there is what makes it wrong and costs the 12.
  test('gear worn in a category the level does not ask for costs that category', () => {
    const result = scoreAnswer({ roomCorrect: true, equipmentSlots: slots({ masks: STRAY }) })

    expect(result.categories.masks.state).toBe('missed')
    expect(result.total).toBe(78)
  })

  test('the wrong room earns nothing', () => {
    const result = scoreAnswer({ roomCorrect: false, equipmentSlots: slots() })

    expect(result.room).toEqual({ points: 0, value: 30, state: 'missed' })
    expect(result.total).toBe(60)
  })
})

describe('retry attempt', () => {
  const allWrong = {
    roomCorrect: false,
    equipmentSlots: slots({
      eyewear: WRONG, masks: WRONG, body: WRONG, gloves: WRONG, footwear: WRONG,
    }),
  }

  test('a retry is worth half: 6 a category and 15 for the room', () => {
    const result = scoreAnswer({
      attempt: 2,
      roomCorrect: true,
      equipmentSlots: slots(),
      previous: allWrong,
    })

    expect(result.room.value).toBe(15)
    expect(result.categories.eyewear.value).toBe(6)
    expect(result.total).toBe(15 + 6 * 5)
  })

  test('what was already right on the first attempt is banked, not paid twice', () => {
    const result = scoreAnswer({
      attempt: 2,
      roomCorrect: true,
      equipmentSlots: slots(),
      previous: { roomCorrect: true, equipmentSlots: slots({ masks: WRONG }) },
    })

    expect(result.room).toEqual({ points: 0, value: 15, state: 'banked' })
    expect(result.categories.eyewear).toEqual({ points: 0, value: 6, state: 'banked' })
    expect(result.categories.masks).toEqual({ points: 6, value: 6, state: 'earned' })
    expect(result.total).toBe(6)
  })

  test('still wrong the second time earns nothing', () => {
    const result = scoreAnswer({
      attempt: 2,
      roomCorrect: false,
      equipmentSlots: slots({ masks: WRONG }),
      previous: allWrong,
    })

    expect(result.room.state).toBe('missed')
    expect(result.categories.masks).toEqual({ points: 0, value: 6, state: 'missed' })
    expect(result.total).toBe(6 * 4)
  })

  test('with no record of the first attempt nothing counts as banked', () => {
    const result = scoreAnswer({ attempt: 2, roomCorrect: true, equipmentSlots: slots() })

    expect(result.total).toBe(15 + 6 * 5)
  })
})

test('no slots means no equipment points', () => {
  const result = scoreAnswer({ roomCorrect: true })

  expect(result.total).toBe(30)
  expect(result.categories.body).toEqual({ points: 0, value: 12, state: 'missed' })
})
