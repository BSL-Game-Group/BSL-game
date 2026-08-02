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
      // Phaser state the input system reads (see pointerHits below).
      visible: true,
      interactive: false,
      setOrigin: jest.fn(() => o),
      setScale: jest.fn(() => o),
      setDisplaySize: jest.fn(() => o),
      setVisible: jest.fn((v) => {
        o.visible = v
        return o
      }),
      setDepth: jest.fn(() => o),
      setAlpha: jest.fn(() => o),
      setInteractive: jest.fn(() => {
        o.interactive = true
        return o
      }),
      disableInteractive: jest.fn(() => {
        o.interactive = false
        return o
      }),
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
    undressHint: { setVisible: jest.fn() },
  }
  scene.__created = created
  return scene
}

// Mirrors Phaser's own hit-test gate (InputManager#inputCandidate): a Game Object
// only receives pointer events when its input is enabled AND it would render.
// A permanently hidden object is therefore never clickable, however large its
// bounds are — which is why the click target must be a zone, not a hidden sprite.
function pointerHits(target, x, y) {
  if (!target || !target.interactive || !target.visible) {
    return false
  }
  const { x: cx, y: cy, w, h } = target.args
  return Math.abs(x - cx) <= w / 2 && Math.abs(y - cy) <= h / 2
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

  test('clicking the info point opens the info popup', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const opened = []
    const listener = () => opened.push(true)
    window.addEventListener('info-popup-opened', listener)

    const infoZone = scene.__created.zones.find(
      (z) => z.args.x === 140 && z.args.y === 360
    )
    infoZone.handlers.pointerdown()

    window.removeEventListener('info-popup-opened', listener)
    expect(opened).toHaveLength(1)
  })
})

// The lecture room is drawn as a transparent pixel-art overlay (its floor comes
// from the game). The back wall, front ledge and both workstations are solid.
describe('createRooms — lecture room', () => {
  test('adds the transparent lecture-room overlay at the room origin', () => {
    const scene = makeFakeScene()
    createRooms(scene)
    expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'lecture_room')
  })

  test('adds the lecture room collision boxes', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    // Back wall
    expect(scene.add.rectangle).toHaveBeenCalledWith(240, 30, 480, 60)

    // Front ledge
    expect(scene.add.rectangle).toHaveBeenCalledWith(240, 85, 480, 50)

    // Left workstation
    expect(scene.add.rectangle).toHaveBeenCalledWith(127, 184, 174, 104)

    // Right workstation
    expect(scene.add.rectangle).toHaveBeenCalledWith(353, 184, 174, 104)
  })

  test('does not expose bookshelf colliders anymore', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    expect(Array.isArray(scene.lectureShelves)).toBe(true)
    expect(scene.lectureShelves).toHaveLength(0)
  })

  test('creates the info-point glow and exposes its scene refs', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    expect(scene.lecturePoint).toEqual({ x: 300, y: 240 })
    expect(scene.lectureGlow).toBeDefined()
    expect(scene.lectureGlowTween).toBeDefined()

    const glow = scene.__created.graphics.find((g) => g === scene.lectureGlow)
    expect(glow.fillCircle).toHaveBeenCalledWith(300, 240, 35)
  })

  test('clicking the info point unlocks the lecture materials', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const handler = jest.fn()
    window.addEventListener('lecture-materials-unlocked', handler)

    const lectureZone = scene.__created.zones.find(
      (z) => z.args.x === 300 && z.args.y === 240
    )
    lectureZone.handlers.pointerdown()

    window.removeEventListener('lecture-materials-unlocked', handler)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('setupCloset (via createRooms)', () => {
  // The green glow circle: centre (90, 500), radius 55.
  const CIRCLE = { x: 90, y: 500, radius: 55 }

  test('creates the closet zone, a hidden glow and a hit-testable click target', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.closetZone).toEqual({ x: 55, y: 440, width: 80, height: 80 })
    expect(window.__gameData.closetZone).toEqual(scene.closetZone)

    // The click target is an invisible zone covering the glow circle — NOT a hidden
    // sprite, which Phaser would never hit-test.
    expect(scene.add.zone).toHaveBeenCalledWith(
      CIRCLE.x, CIRCLE.y, CIRCLE.radius * 2, CIRCLE.radius * 2
    )
    expect(scene.closetHit.interactive).toBe(true)
    expect(scene.closetHit.visible).toBe(true)
    // The glow is created hidden until the player is near.
    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(false)
  })

  test('the click target covers the whole glow circle', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    // Centre plus each edge of the circle. The bottom edge is the telling one: it
    // falls outside the old 40x60-at-1.5-scale dresser sprite bounds (y 455..545).
    const onCircle = [
      { x: CIRCLE.x, y: CIRCLE.y, where: 'centre' },
      { x: CIRCLE.x, y: CIRCLE.y + 48, where: 'bottom edge' },
      { x: CIRCLE.x, y: CIRCLE.y - 48, where: 'top edge' },
      { x: CIRCLE.x - 48, y: CIRCLE.y, where: 'left edge' },
      { x: CIRCLE.x + 48, y: CIRCLE.y, where: 'right edge' },
    ]

    for (const point of onCircle) {
      expect(pointerHits(scene.closetHit, point.x, point.y)).toBe(true)
    }
  })

  test('clicking the circle opens the closet popup when the player is inside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('closet-popup-opened', listener)
    scene.playerInsideDressingRoom = true

    scene.closetHit.handlers.pointerdown()

    window.removeEventListener('closet-popup-opened', listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('clicking the circle does nothing when the player is outside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('closet-popup-opened', listener)
    scene.playerInsideDressingRoom = false

    scene.closetHit.handlers.pointerdown()

    window.removeEventListener('closet-popup-opened', listener)
    expect(listener).not.toHaveBeenCalled()
  })

  test('hovering the circle toggles the hint only when inside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    // Inside: hover shows the hint, then pointerout hides it.
    scene.playerInsideDressingRoom = true
    scene.closetHit.handlers.pointerover()
    expect(scene.closetHint.setVisible).toHaveBeenCalledWith(true)

    scene.closetHit.handlers.pointerout()
    expect(scene.closetHint.setVisible).toHaveBeenCalledWith(false)

    // Outside: hover does not show the hint.
    scene.closetHint.setVisible.mockClear()
    scene.playerInsideDressingRoom = false
    scene.closetHit.handlers.pointerover()
    expect(scene.closetHint.setVisible).not.toHaveBeenCalledWith(true)
  })
})

describe('setupUndressPoint (via createRooms)', () => {
  test('creates a hidden glow at the dressing-room quick-undress spot', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.undressPoint).toEqual({ x: 620, y: 650 })
    expect(scene.undressGlow.setVisible).toHaveBeenCalledWith(false)
    expect(scene.undressZone.setInteractive).toHaveBeenCalled()
  })


  test('clicking the quick-undress spot fires quick-undress when the player is inside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('quick-undress', listener)
    scene.playerInsideDressingRoom = true

    scene.undressZone.handlers.pointerdown()

    window.removeEventListener('quick-undress', listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('clicking the quick-undress spot does nothing when the player is outside', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('quick-undress', listener)
    scene.playerInsideDressingRoom = false

    scene.undressZone.handlers.pointerdown()

    window.removeEventListener('quick-undress', listener)
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('setupAirlockWashPoint (via createRooms)', () => {
  test('creates a hidden glow in the bottom-right corner of airlock2', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.airlockWashPoint).toEqual({ x: 1250, y: 335 })
    expect(scene.airlock2Zone).toEqual({ x: 1110, y: 250, width: 170, height: 110 })
    expect(scene.airlockWashGlow.setVisible).toHaveBeenCalledWith(false)
    expect(scene.airlockWashZone.setInteractive).toHaveBeenCalled()
  })

  test('clicking it while inside airlock2 fires airlock-decon', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('airlock-decon', listener)
    scene.playerInsideAirlock2 = true

    scene.airlockWashZone.handlers.pointerdown()

    window.removeEventListener('airlock-decon', listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('clicking it does nothing when the player is not inside airlock2', () => {
    const scene = makeFakeScene()
    createRooms(scene)

    const listener = jest.fn()
    window.addEventListener('airlock-decon', listener)
    scene.playerInsideAirlock2 = false

    scene.airlockWashZone.handlers.pointerdown()

    window.removeEventListener('airlock-decon', listener)
    expect(listener).not.toHaveBeenCalled()
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
    window.__lectureOpen = true

    const levels = []
    const listener = (e) => levels.push(e.detail.level)
    window.addEventListener('answer-popup-opened', listener)

    // Each BSL hit zone sits on its glow's centre (matched by position rather than
    // creation order, which other interactables' zones also share).
    const bsl2Center = scene.bslGlows[1].center
    const bsl2Zone = scene.__created.zones.find(
      (z) => z.args.x === bsl2Center.x && z.args.y === bsl2Center.y
    )

    // Outside the room → clicking does nothing.
    scene.bslGlows[1].playerInside = false
    bsl2Zone.handlers.pointerdown()
    expect(levels).toHaveLength(0)

    // Inside the room → the answer popup opens for BSL-2.
    scene.bslGlows[1].playerInside = true
    bsl2Zone.handlers.pointerdown()

    window.removeEventListener('answer-popup-opened', listener)
    expect(levels).toEqual(['BSL-2'])
    delete window.__lectureOpen
  })

  test('clicking a BSL glow asks the player to visit the lecture room first when it has not been unlocked yet', () => {
    const scene = makeFakeScene()
    createRooms(scene)
    window.__lectureOpen = false

    const answerListener = jest.fn()
    const requiredListener = jest.fn()
    window.addEventListener('answer-popup-opened', answerListener)
    window.addEventListener('lecture-required', requiredListener)

    // Matched by position rather than creation order, which other interactables'
    // zones also share (see the sibling test above).
    const bsl2Center = scene.bslGlows[1].center
    const bsl2Zone = scene.__created.zones.find(
      (z) => z.args.x === bsl2Center.x && z.args.y === bsl2Center.y
    )
    scene.bslGlows[1].playerInside = true
    bsl2Zone.handlers.pointerdown()

    window.removeEventListener('answer-popup-opened', answerListener)
    window.removeEventListener('lecture-required', requiredListener)
    expect(answerListener).not.toHaveBeenCalled()
    expect(requiredListener).toHaveBeenCalledTimes(1)
    delete window.__lectureOpen
  })

  describe('createRooms — exit area', () => {
  test('adds the exit area background image', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.add.image).toHaveBeenCalledWith(480, 0, 'exit_area')
  })

  test('creates the exit room back wall collider', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.add.rectangle).toHaveBeenCalledWith(590, 30, 220, 60)
  })

  test('creates the exit zone', () => {
    const scene = makeFakeScene()

    createRooms(scene)

    expect(scene.exitZone).toEqual({
      x: 480,
      y: 0,
      width: 220,
      height: 290,
    })
  })
})
})

