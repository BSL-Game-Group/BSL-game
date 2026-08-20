import { resolveObjective, bslRoomFor, missingEquipment } from '../src/utils/resolveObjective'
import { unequipAll } from '../src/components/ClosetPopup/ItemConfig'

function baseState(overrides = {}) {
  return {
    progress: {
      lectureVisited: true,
      awaitingUndress: false,
      ventilationConnected: false,
    },
    equipped: unequipAll(),
    microbe: { id: 1, bsl_level: 1 },
    room: null,
    ...overrides,
  }
}

describe('resolveObjective', () => {
  test('sends the player to the lecture room first, before anything else', () => {
    const state = baseState({
      progress: { lectureVisited: false, awaitingUndress: false },
      microbe: null,
    })

    expect(resolveObjective(state)).toEqual({ id: 'visit-lecture', target: 'lectureRoom' })
  })

  test('waits for a microbe once the lecture has been visited', () => {
    const state = baseState({ microbe: null })

    expect(resolveObjective(state)).toEqual({ id: 'await-microbe', target: null })
  })

  test('sends the player to wash up when awaitingUndress is set', () => {
    const state = baseState({
      progress: { lectureVisited: true, awaitingUndress: true },
    })

    expect(resolveObjective(state)).toEqual({ id: 'wash-up', target: 'showerRoom' })
  })

  test('sends the player to suit up when required equipment is missing', () => {
    const state = baseState({ microbe: { id: 1, bsl_level: 1 } })

    const result = resolveObjective(state)

    expect(result.id).toBe('suit-up')
    expect(result.target).toBe('dressingRoom')
    expect(result.missing).toEqual(
      expect.arrayContaining(['lab_coat', 'glasses', 'gloves'])
    )
  })

  test('sends the player to the matching BSL room once fully equipped', () => {
    const state = baseState({
      microbe: { id: 1, bsl_level: 1 },
      equipped: { ...unequipAll(), lab_coat: true, glasses: true, gloves: true, indoor_shoes: true },
      room: null,
    })

    expect(resolveObjective(state)).toEqual({ id: 'go-to-room', target: 'BSL-1' })
  })

  test('resolves to handling the microbe once in the correct BSL room, fully equipped', () => {
    const state = baseState({
      microbe: { id: 1, bsl_level: 1 },
      equipped: { ...unequipAll(), lab_coat: true, glasses: true, gloves: true, indoor_shoes: true },
      room: 'BSL-1',
    })

    expect(resolveObjective(state)).toEqual({ id: 'handle-microbe', target: 'BSL-1' })
  })

  test('is deterministic: the same state always returns the same objective', () => {
    const state = baseState()

    expect(resolveObjective(state)).toEqual(resolveObjective(state))
  })
})

describe('bslRoomFor', () => {
  test('builds the room key from the microbe bsl_level', () => {
    expect(bslRoomFor({ bsl_level: 3 })).toBe('BSL-3')
  })
})

describe('missingEquipment', () => {
  test('returns nothing when a valid outfit for the level is fully worn', () => {
    const equipped = {
      ...unequipAll(),
      lab_coat: true,
      glasses: true,
      gloves: true,
      indoor_shoes: true,
    }

    expect(missingEquipment(1, equipped)).toEqual([])
  })

  test('lists the required items for BSL-4 when nothing is worn', () => {
    expect(missingEquipment(4, unequipAll())).toEqual(
      expect.arrayContaining(['pressurized_suit', 'gloves'])
    )
  })
})
