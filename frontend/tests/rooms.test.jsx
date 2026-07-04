// Unit tests for the room-layout builder, focused on the lecture-room overlay and its
// bookshelf collision group — the contract the future "shelves as buttons" feature builds on.
// rooms.js has no imports, so no module mocks are needed; we just pass a fake Phaser scene.
import { createRooms } from '../src/game/scenes/rooms'

// A permissive chainable stub: every Phaser game-object method returns the same object,
// so call chains like scene.add.image(...).setOrigin().setDisplaySize().setDepth() work.
function chainable() {
  const o = {}
  const methods = [
    'setOrigin', 'setScale', 'setVisible', 'setInteractive', 'disableInteractive',
    'setDepth', 'setDisplaySize', 'setAlpha', 'on',
    'fillStyle', 'fillCircle', 'lineStyle', 'strokeCircle',
  ]
  for (const m of methods) { o[m] = jest.fn().mockReturnThis() }
  return o
}

function createScene() {
  return {
    add: {
      rectangle: jest.fn(() => chainable()),
      text: jest.fn(() => chainable()),
      image: jest.fn(() => chainable()),
      graphics: jest.fn(() => chainable()),
      zone: jest.fn(() => chainable()),
    },
    physics: { add: { existing: jest.fn() } },
    tweens: { add: jest.fn(() => ({ pause: jest.fn(), resume: jest.fn() })) },
  }
}

describe('createRooms — lecture room', () => {
  test('adds the transparent lecture-room overlay at the room origin', () => {
    const scene = createScene()
    createRooms(scene)
    expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'lecture_room')
  })

  test('adds a solid back-wall box (centre 240,30 · 480×60)', () => {
    const scene = createScene()
    createRooms(scene)
    expect(scene.add.rectangle).toHaveBeenCalledWith(240, 30, 480, 60)
  })

  test('exposes exactly 4 named bookshelves in their own group', () => {
    const scene = createScene()
    const walls = createRooms(scene)

    expect(Array.isArray(scene.lectureShelves)).toBe(true)
    expect(scene.lectureShelves).toHaveLength(4)
    expect(scene.lectureShelves.map((s) => s.name)).toEqual([
      'lecture-shelf-1', 'lecture-shelf-2', 'lecture-shelf-3', 'lecture-shelf-4',
    ])

    // shelves are NOT part of the walls array (they are their own collision group)
    scene.lectureShelves.forEach((shelf) => expect(walls).not.toContain(shelf))
  })

  test('returns a non-empty walls array', () => {
    const scene = createScene()
    const walls = createRooms(scene)
    expect(Array.isArray(walls)).toBe(true)
    expect(walls.length).toBeGreaterThan(0)
  })

  test('sets the lecture room zone to the full top-left room', () => {
    const scene = createScene()
    createRooms(scene)
    expect(scene.lectureRoomZone).toEqual({ x: 0, y: 0, width: 480, height: 290 })
  })
})
