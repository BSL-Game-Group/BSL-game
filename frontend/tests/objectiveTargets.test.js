import { targetWorldPoint } from '../src/game/managers/objectiveTargets'

describe('targetWorldPoint', () => {
  test('returns null for no target', () => {
    expect(targetWorldPoint({}, null)).toBeNull()
  })

  test('resolves the lecture room to lecturePoint', () => {
    const scene = { lecturePoint: { x: 10, y: 20 } }
    expect(targetWorldPoint(scene, 'lectureRoom')).toEqual({ x: 10, y: 20 })
  })

  test('resolves the dressing room to the closet center, offset from the zone', () => {
    const scene = { closetZone: { x: 55, y: 40, width: 80, height: 80 } }
    expect(targetWorldPoint(scene, 'dressingRoom')).toEqual({ x: 90, y: 100 })
  })

  test('resolves the shower room to undressPoint', () => {
    const scene = { undressPoint: { x: 620, y: 650 } }
    expect(targetWorldPoint(scene, 'showerRoom')).toEqual({ x: 620, y: 650 })
  })

  test('resolves a BSL room key to its glow center', () => {
    const scene = {
      bslGlows: [
        { key: 'BSL-1', center: { x: 730, y: 500 } },
        { key: 'BSL-3', center: { x: 1100, y: 600 } },
      ],
    }
    expect(targetWorldPoint(scene, 'BSL-3')).toEqual({ x: 1100, y: 600 })
  })

  test('returns null when the scene has no data for the target yet', () => {
    expect(targetWorldPoint({}, 'lectureRoom')).toBeNull()
    expect(targetWorldPoint({ bslGlows: [] }, 'BSL-4')).toBeNull()
  })

  test('returns null for an unrecognised target', () => {
    expect(targetWorldPoint({}, 'somewhere-else')).toBeNull()
  })
})
