import { createRooms } from '../src/game/scenes/rooms'

// rooms.js has no Phaser import — it only calls methods on the `scene` it is
// given and writes to window.__gameData. So we hand it a fake scene whose
// factory methods (add.rectangle/text/graphics/image/zone, physics, tweens)
// are jest mocks returning chainable display objects that remember the
// pointer handlers registered on them.
function makeFakeScene() {
  const created = { rectangles: [], texts: [], graphics: [], images: [], zones: [] }

  const makeObject = (bucket, args) => {
    const o = {
      args,
      handlers: {},
      setOrigin: jest.fn(() => o),
      setScale: jest.fn(() => o),
      setDisplaySize: jest.fn(() => o),
      setVisible: jest.fn(() => o),
      setDepth: jest.fn(() => o),
      setAlpha: jest.fn(() => o),
      setInteractive: jest.fn(() => o),
      fillStyle: jest.fn(() => o),
      fillCircle: jest.fn(() => o),
      lineStyle: jest.fn(() => o),
      strokeCircle: jest.fn(() => o),
      on: jest.fn((event, cb) => {
        o.handlers[event] = cb
        return o
      }),
    }
    bucket.push(o)
    return o
  }

  const scene = {
    add: {
      rectangle: jest.fn((x, y, w, h, color) =>
        makeObject(created.rectangles, { x, y, w, h, color })),
      text: jest.fn((x, y, text, style) =>
        makeObject(created.texts, { x, y, text, style })),
      graphics: jest.fn(() => makeObject(created.graphics, {})),
      image: jest.fn((x, y, key) => makeObject(created.images, { x, y, key })),
      zone: jest.fn((x, y, w, h) => makeObject(created.zones, { x, y, w, h })),
    },
    physics: { add: { existing: jest.fn() } },
    tweens: { add: jest.fn(() => ({ pause: jest.fn(), resume: jest.fn() })) },
    // Set by main_scene in the real game; rooms.js only reads it on hover.
    closetHint: { setVisible: jest.fn() },
  }
  scene.__created = created
  return scene
}

describe('createRooms', () => {
  test('returns a non-empty array of walls with physics bodies', () => {
    const scene = makeFakeScene()

    const walls = createRooms(scene)

    expect(Array.isArray(walls)).toBe(true)
    expect(walls.length).toBeGreaterThan(0)
    // Every wall segment gets a static physics body, and so do the 4 lecture-room
    // bookshelves (which live in their own group, not in `walls`).
    expect(scene.physics.add.existing).toHaveBeenCalledTimes(
      walls.length + scene.lectureShelves.length
    )
  })

  test('horizontal walls leave a gap at doorways', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    // The dressing-room door sits on the y=430 wall line, spanning x 315..375.
    const doorLineY = 430
    const doorMidX = 345
    const wallsOnDoorLine = scene.__created.rectangles.filter(
      (r) => r.args.y === doorLineY
    )

    // There are wall segments on that line...
    expect(wallsOnDoorLine.length).toBeGreaterThan(0)
    // ...but none of them covers the door opening.
    const coversDoor = wallsOnDoorLine.some((r) => {
      const halfW = r.args.w / 2
      return doorMidX > r.args.x - halfW && doorMidX < r.args.x + halfW
    })
    expect(coversDoor).toBe(false)
  })

  test('sets the lecture-room and dressing-room (ppe) zones', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.lectureRoomZone).toEqual({ x: 0, y: 0, width: 480, height: 290 })
    expect(scene.ppeRoomZone).toEqual({ x: 0, y: 430, width: 700, height: 290 })
  })

  test('sets four BSL room zones with the expected keys and coordinates', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.bslRoomZones).toHaveLength(4)
    expect(scene.bslRoomZones.map((z) => z.key)).toEqual([
      'BSL-1',
      'BSL-2',
      'BSL-3',
      'BSL-4',
    ])
    expect(scene.bslRoomZones).toContainEqual({
      key: 'BSL-3',
      x: 960,
      y: 470,
      width: 320,
      height: 250,
    })
  })

  test('publishes the room zones on window.__gameData', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(window.__gameData.lectureRoomZone).toEqual(scene.lectureRoomZone)
    expect(window.__gameData.ppeRoomZone).toEqual(scene.ppeRoomZone)
    expect(window.__gameData.bslRoomZones).toEqual(scene.bslRoomZones)
  })

  test('draws the room labels, centred', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    const labelTexts = scene.__created.texts.map((t) => t.args.text)
    expect(labelTexts).toEqual(
      expect.arrayContaining([
        'Corridor',
        'Dressing room',
        'BSL 1',
        'BSL 2',
      ])
    )
    // The lecture room is now shown via the pixel-art overlay, so it no longer
    // has a text label.
    expect(labelTexts).not.toContain('Lecture room')
    // Every label is centred on its coordinate.
    scene.__created.texts.forEach((t) =>
      expect(t.setOrigin).toHaveBeenCalledWith(0.5)
    )
  })
})

// The air-system cell (bottom-right of the airlock block) is filled by a machine
// image wall-to-wall, with a black 'AIR SYSTEMS' text label drawn on top.
describe('createRooms — air system', () => {
  test('fills the air-system cell with the machine image', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    expect(scene.add.image).toHaveBeenCalledWith(1110, 360, 'air_systems')
    const airImg = scene.__created.images.find((i) => i.args.key === 'air_systems')
    expect(airImg.setDisplaySize).toHaveBeenCalledWith(170, 110)
  })

  test('draws an AIR SYSTEMS label on top', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const labelTexts = scene.__created.texts.map((t) => t.args.text)
    expect(labelTexts).toContain('AIR SYSTEMS')
  })
})

// The dressing room (ppe zone) is filled wall-to-wall by its background image.
describe('createRooms — dressing room', () => {
  test('fills the dressing-room zone with its background image', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    expect(scene.add.image).toHaveBeenCalledWith(0, 430, 'dressing_room')
    const img = scene.__created.images.find((i) => i.args.key === 'dressing_room')
    expect(img.setDisplaySize).toHaveBeenCalledWith(700, 290)
  })

  test('adds invisible colliders over the furniture (deadzones)', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    // Left: only the top strip and the thin bench block. Right: the glass booth.
    expect(scene.add.rectangle).toHaveBeenCalledWith(209, 450, 212, 40)      // lockers strip (40 tall)
    expect(scene.add.rectangle).toHaveBeenCalledWith(162.5, 585, 155, 26)    // thin bench
    expect(scene.add.rectangle).toHaveBeenCalledWith(634.5, 631.5, 119, 147) // glass booth
  })
})

// The info desk sits in the corridor's top-left corner with a solid counter.
describe('createRooms — info desk', () => {
  test('draws the info desk and a solid counter in the corridor corner', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    expect(scene.add.image).toHaveBeenCalledWith(6, 294, 'info_desk')
    const img = scene.__created.images.find((i) => i.args.key === 'info_desk')
    expect(img.setDisplaySize).toHaveBeenCalledWith(150, 108)
    // counter: solidBox(6,300,156,402) -> centre 81,351 · 150x102
    expect(scene.add.rectangle).toHaveBeenCalledWith(81, 351, 150, 102)
  })
})

// The lecture room is drawn as a transparent pixel-art overlay (its floor comes
// from the game). The back wall is a real solid wall, and the bookshelves are
// solid too but live in their OWN named group (`scene.lectureShelves`) — the
// contract the future "shelves as buttons" feature builds on.
describe('createRooms — lecture room', () => {
  test('adds the transparent lecture-room overlay at the room origin', () => {
    const scene = makeFakeScene()
    createRooms(scene)
    expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'lecture_room')
  })

  test('adds a solid back-wall box (centre 240,30 · 480×60)', () => {
    const scene = makeFakeScene()
    createRooms(scene)
    expect(scene.add.rectangle).toHaveBeenCalledWith(240, 30, 480, 60)
  })

  test('exposes exactly 4 named bookshelves in their own group', () => {
    const scene = makeFakeScene()
    const walls = createRooms(scene)

    expect(Array.isArray(scene.lectureShelves)).toBe(true)
    expect(scene.lectureShelves).toHaveLength(4)
    expect(scene.lectureShelves.map((s) => s.name)).toEqual([
      'lecture-shelf-1', 'lecture-shelf-2', 'lecture-shelf-3', 'lecture-shelf-4',
    ])

    // shelves are NOT part of the walls array (they are their own collision group)
    scene.lectureShelves.forEach((shelf) => expect(walls).not.toContain(shelf))
  })
})

describe('setupCloset (via createRooms)', () => {
  test('creates the closet zone, a hidden glow and an interactive dresser', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.closetZone).toEqual({ x: 55, y: 440, width: 80, height: 80 })
    expect(window.__gameData.closetZone).toEqual(scene.closetZone)

    // The dresser sprite sits in the top-left corner and stays hidden (only a click
    // target); the green glow is the visible element.
    expect(scene.add.image).toHaveBeenCalledWith(90, 500, 'dresser')
    expect(scene.closetImage.setVisible).toHaveBeenCalledWith(false)
    expect(scene.closetImage.setInteractive).toHaveBeenCalled()
    // The glow is created hidden until the player is near.
    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(false)
  })

  test('clicking the dresser opens the closet popup when the player is inside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('closet-popup-opened', listener)
    scene.playerInsideDressingRoom = true

    scene.closetImage.handlers.pointerdown()

    window.removeEventListener('closet-popup-opened', listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('clicking the dresser does nothing when the player is outside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('closet-popup-opened', listener)
    scene.playerInsideDressingRoom = false

    scene.closetImage.handlers.pointerdown()

    window.removeEventListener('closet-popup-opened', listener)
    expect(listener).not.toHaveBeenCalled()
  })

  test('hovering the dresser toggles the hint only when inside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    // Inside: hover shows the hint, then pointerout hides it.
    scene.playerInsideDressingRoom = true
    scene.closetImage.handlers.pointerover()
    expect(scene.closetHint.setVisible).toHaveBeenCalledWith(true)

    scene.closetImage.handlers.pointerout()
    expect(scene.closetHint.setVisible).toHaveBeenCalledWith(false)

    // Outside: hover does not show the hint.
    scene.closetHint.setVisible.mockClear()
    scene.playerInsideDressingRoom = false
    scene.closetImage.handlers.pointerover()
    expect(scene.closetHint.setVisible).not.toHaveBeenCalledWith(true)
  })
})

describe('setupBslInteractables (via createRooms)', () => {
  test('creates one interactable entry per BSL room, starting outside', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.bslGlows).toHaveLength(4)
    expect(scene.bslGlows.map((g) => g.key)).toEqual([
      'BSL-1',
      'BSL-2',
      'BSL-3',
      'BSL-4',
    ])
    scene.bslGlows.forEach((g) => expect(g.playerInside).toBe(false))
  })

  test('positions the BSL-3 glow at top-centre and the others at top-left', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    const centreByKey = Object.fromEntries(
      scene.bslGlows.map((g) => [g.key, g.center])
    )
    // BSL-3 is centred horizontally within its 320-wide zone (x 960..1280).
    expect(centreByKey['BSL-3']).toEqual({ x: 1120, y: 530 })
    // BSL-1 is inset from the left edge of its zone (x 700).
    expect(centreByKey['BSL-1']).toEqual({ x: 735, y: 530 })
  })

  test('clicking a BSL glow opens the answer popup for that room, only when inside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const levels = []
    const listener = (e) => levels.push(e.detail.level)
    window.addEventListener('answer-popup-opened', listener)

    // Hit zones are created in the same order as bslGlows: BSL-1, BSL-2, BSL-3, BSL-4.
    const bsl2Zone = scene.__created.zones[1]

    // Outside the room → clicking does nothing.
    scene.bslGlows[1].playerInside = false
    bsl2Zone.handlers.pointerdown()
    expect(levels).toHaveLength(0)

    // Inside the room → the answer popup opens for BSL-2.
    scene.bslGlows[1].playerInside = true
    bsl2Zone.handlers.pointerdown()

    window.removeEventListener('answer-popup-opened', listener)
    expect(levels).toEqual(['BSL-2'])
  })
})
