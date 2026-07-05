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
      setVisible: jest.fn(() => o),
      setDepth: jest.fn(() => o),
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
    // Every wall segment is given a static physics body.
    expect(scene.physics.add.existing).toHaveBeenCalledTimes(walls.length)
  })

  test('horizontal walls leave a gap at doorways', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    // The dressing-room door sits on the y=430 wall line, spanning x 300..390.
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
        'Lecture room',
        'Corridor',
        'Dressing room',
        'BSL 1',
        'BSL 2',
      ])
    )
    // Every label is centred on its coordinate.
    scene.__created.texts.forEach((t) =>
      expect(t.setOrigin).toHaveBeenCalledWith(0.5)
    )
  })
})

describe('setupCloset (via createRooms)', () => {
  test('creates the closet zone, a hidden glow and an interactive dresser', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.closetZone).toEqual({ x: 85, y: 440, width: 80, height: 80 })
    expect(window.__gameData.closetZone).toEqual(scene.closetZone)

    expect(scene.add.image).toHaveBeenCalledWith(120, 500, 'dresser')
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
})
