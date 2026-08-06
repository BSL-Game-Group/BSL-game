import MainScene, { playerIsInsideZone } from '../src/game/scenes/main_scene'
import Phaser from 'phaser'
import { SAVED_GAME_KEY, clearSavedGame } from '../src/state/savedGame'

// -----------------------------
// MOCKS
// -----------------------------
jest.mock('phaser', () => ({
  Scene: class {},
  Math: {
    Distance: {
      Between: jest.fn((x1, y1, x2, y2) =>
        Math.hypot(x2 - x1, y2 - y1)
      ),
    },
  },
  Input: {
    Keyboard: {
      JustDown: jest.fn(),
    },
  },
  Events: {
    EventEmitter: class {
      on = jest.fn()
      off = jest.fn()
      emit = jest.fn()
      once = jest.fn()
    }
  },
  Physics: {
    Arcade: {
      Sprite: class MockSprite {},
      Image: class MockImage {},
      StaticGroup: class MockStaticGroup {},
      Group: class MockGroup {}
    }
  }
}))

jest.mock('../src/game/scenes/rooms', () => ({
  createRooms: jest.fn(() => ({})),
}))

// -----------------------------
// SCENE FACTORY
// -----------------------------
function createScene(overrides = {}) {
  const scene = new MainScene()

  // Both keys exist in the real scene (create() registers them). They carry the
  // modifier flags Phaser copies off the keydown event; unmodified by default.
  scene.keyE = { isDown: true }
  scene.keyR = { isDown: true }

  scene.player = {
    x: 640,
    y: 500,
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
  }

  scene.player.body = {
    embedded: false,
    touching: { none: true, up: false, down: false, left: false, right: false },
    wasTouching: { none: true, up: false, down: false, left: false, right: false },
    velocity: { x: 0, y: 0 },
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
  };

  scene.cursors = {
    left: { isDown: false },
    right: { isDown: false },
    up: { isDown: false },
    down: { isDown: false },
  }

  scene.input = {
    activePointer: {
      x: 700,
      y: 500,
      isDown: false,
    },
  }

  scene.physics = {
    moveToObject: jest.fn(),
    overlap: jest.fn().mockReturnValue(false)
  }

  scene.playArea = {
    contains: jest.fn(() => true),
  }

  scene.pressEText = {
    setVisible: jest.fn(),
    setPosition: jest.fn(),
  }

  scene.doorHint = {
    setVisible: jest.fn(),
    setPosition: jest.fn(),
  };

  // UI SAFETY MOCKS
  scene.closetHint = {
    visible: false,
    setPosition: jest.fn(),
  }

  scene.closetHit = {
    setVisible: jest.fn(),
    setInteractive: jest.fn(),
    disableInteractive: jest.fn(),
  }

  scene.closetGlowTween = {
    resume: jest.fn(),
    pause: jest.fn(),
  }

  scene.closetGlow = {
    setVisible: jest.fn(),
  }

  scene.undressGlowTween = {
    resume: jest.fn(),
    pause: jest.fn(),
  }

  scene.undressGlow = {
    setVisible: jest.fn(),
  }

  scene.bsl4SuitGlowTween = {
    resume: jest.fn(),
    pause: jest.fn(),
  }

  scene.bsl4SuitGlow = {
    setVisible: jest.fn(),
  }

  scene.bsl4SuitHint = {
    setVisible: jest.fn(),
    setPosition: jest.fn(),
  }

  scene.undressHint = {
    setVisible: jest.fn(),
    setPosition: jest.fn(),
  }

  scene.lectureRoomZone = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }

  return Object.assign(scene, overrides)
}

// =====================================================
// MOVEMENT TESTS
// =====================================================
describe('Player movement', () => {
  test('moves left with keyboard', () => {
    const scene = createScene()
    scene.cursors.left.isDown = true
    scene.update()

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(-160)
  })

  test('moves right with keyboard', () => {
    const scene = createScene()
    scene.cursors.right.isDown = true
    scene.update()

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(160)
  })

  test('moves up with keyboard', () => {
    const scene = createScene()
    scene.cursors.up.isDown = true
    scene.update()

    expect(scene.player.setVelocityY).toHaveBeenCalledWith(-160)
  })

  test('moves down with keyboard', () => {
    const scene = createScene()
    scene.cursors.down.isDown = true
    scene.update()

    expect(scene.player.setVelocityY).toHaveBeenCalledWith(160)
  })

  test('moves toward mouse click', () => {
    const scene = createScene()
    scene.input.activePointer.isDown = true
    scene.update()

    expect(scene.physics.moveToObject).toHaveBeenCalledWith(
      scene.player,
      scene.input.activePointer,
      160
    )
  })

  test('does not move if mouse click is too close', () => {
    const scene = createScene()

    scene.input.activePointer.x = 645
    scene.input.activePointer.y = 505
    scene.input.activePointer.isDown = true

    scene.update()

    expect(scene.physics.moveToObject).not.toHaveBeenCalled()
  })
})

// =====================================================
// ASSETS
// =====================================================
test('preload loads all game assets', () => {
  const scene = new MainScene()

  scene.load = { image: jest.fn() }

  scene.preload()

  expect(scene.load.image).toHaveBeenCalledWith(
    'player_base',
    'assets/player/base.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'lab_coat',
    'assets/equipment/on_character/body/lab_coat_on.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'mask',
    'assets/equipment/on_character/masks/mask_on.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'glasses',
    'assets/equipment/on_character/eyewear/glasses_on.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'dresser',
    'assets/dresser.png'
  )
})

// =====================================================
// INTERACTION (E KEY / CLOSET)
// =====================================================
test('pressing E triggers closet popup event when inside dressing room', () => {
  const scene = createScene({
    ppeRoomZone: { x: 0, y: 0, width: 280, height: 250 },
  })

  scene.player.x = 50
  scene.player.y = 50

  Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

  const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

  scene.update()

  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'closet-popup-opened',
    })
  )

  dispatchSpy.mockRestore()
})

test('pressing R triggers quick-undress from anywhere in the dressing room', () => {
  const scene = createScene({
    ppeRoomZone: { x: 0, y: 0, width: 280, height: 250 },
  })

  scene.player.x = 50
  scene.player.y = 50

  Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

  const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

  scene.update()

  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'quick-undress',
    })
  )

  dispatchSpy.mockRestore()
})

test('pressing R outside the dressing room does not trigger quick-undress', () => {
  const scene = createScene({
    ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
  })

  scene.player.x = 500
  scene.player.y = 500

  Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

  const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

  scene.update()

  expect(dispatchSpy).not.toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'quick-undress',
    })
  )

  dispatchSpy.mockRestore()
})

// =====================================================
// AIRLOCK DECON DOOR (E integrates decontamination)
// =====================================================
describe('handleDoorInteraction', () => {
  function makeDoorZone() {
    const door = {
      x: 1110,
      y: 305,
      tryToChangeDoorState: jest.fn(() => true),
    }
    return { zone: { parentDoor: door }, door }
  }

  test('pressing E toggles the door and does not open the BSL4 suit station', () => {
    const scene = createScene()
    const { zone, door } = makeDoorZone()

    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-popup-opened' })
    )

    dispatchSpy.mockRestore()
  })

  test('does not toggle the door when E was not just pressed', () => {
    const scene = createScene()
    const { zone, door } = makeDoorZone()

    Phaser.Input.Keyboard.JustDown.mockReturnValue(false)

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
  })
})

describe('Airlock2 BSL4 suit station behavior', () => {
  const airlock2Zone = { x: 1110, y: 250, width: 170, height: 110 }

  test('shows the suit glow and asks to suit up as soon as an unsuited player enters airlock2', () => {
    const scene = createScene({ airlock2Zone })
    scene.player.x = 1150
    scene.player.y = 300

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(scene.bsl4SuitGlow.setVisible).toHaveBeenCalledWith(true)
    expect(scene.bsl4SuitGlowTween.resume).toHaveBeenCalled()
    expect(scene.playerInsideAirlock2).toBe(true)
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-entry-confirm-opened' })
    )

    dispatchSpy.mockRestore()
  })

  test('does not ask to suit up when the player is already suited', () => {
    const scene = createScene({ airlock2Zone })
    scene.player.x = 1150
    scene.player.y = 300
    window.__bsl4Suited = true

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-entry-confirm-opened' })
    )

    dispatchSpy.mockRestore()
    delete window.__bsl4Suited
  })

  test('does not re-fire the confirmation while the player stays inside airlock2', () => {
    const scene = createScene({ airlock2Zone, playerInsideAirlock2: true })
    scene.player.x = 1150
    scene.player.y = 300

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-entry-confirm-opened' })
    )

    dispatchSpy.mockRestore()
  })

  test('hides the suit glow when leaving airlock2', () => {
    const scene = createScene({ airlock2Zone, playerInsideAirlock2: true })
    scene.player.x = 500
    scene.player.y = 500 // outside airlock2

    scene.update()

    expect(scene.bsl4SuitGlow.setVisible).toHaveBeenCalledWith(false)
    expect(scene.bsl4SuitGlowTween.pause).toHaveBeenCalled()
    expect(scene.playerInsideAirlock2).toBe(false)
  })

  test('pressing R opens the BSL4 suit station from anywhere in airlock2', () => {
    const scene = createScene({ airlock2Zone })
    scene.player.x = 1150
    scene.player.y = 300

    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-popup-opened' })
    )

    dispatchSpy.mockRestore()
  })

  test('pressing R outside airlock2 does not open the suit station', () => {
    const scene = createScene({ airlock2Zone })
    scene.player.x = 500
    scene.player.y = 500

    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-popup-opened' })
    )

    dispatchSpy.mockRestore()
  })

  test('shows the suit station hint below the glow when close to the point', () => {
    const bsl4SuitPoint = { x: 1250, y: 335 }
    const scene = createScene({ airlock2Zone, bsl4SuitPoint })
    scene.player.x = 1250
    scene.player.y = 335

    scene.update()

    expect(scene.bsl4SuitHint.setVisible).toHaveBeenCalledWith(true)
    expect(scene.bsl4SuitHint.setPosition).toHaveBeenCalledWith(930, 365)
  })

  test('hides the suit station hint when far from the point', () => {
    const bsl4SuitPoint = { x: 1250, y: 335 }
    const scene = createScene({ airlock2Zone, bsl4SuitPoint })
    scene.player.x = 1120
    scene.player.y = 260

    scene.update()

    expect(scene.bsl4SuitHint.setVisible).toHaveBeenCalledWith(false)
  })
})

// =====================================================
// STATE LOGIC
// =====================================================
describe('Scene state logic', () => {
  test('popup state can be opened', () => {
    const scene = createScene()
    scene.isPopupOpen = true
    expect(scene.isPopupOpen).toBe(true)
  })

  test('movement is skipped when popup is open', () => {
    const scene = createScene({ isPopupOpen: true })
    scene.cursors.left.isDown = true

    scene.update()

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(0)
  })

  test('player inside zone returns true', () => {
    expect(
      playerIsInsideZone(
        { x: 50, y: 50 },
        { x: 0, y: 0, width: 100, height: 100 }
      )
    ).toBe(true)
  })

  test('player outside zone returns false', () => {
    expect(
      playerIsInsideZone(
        { x: 200, y: 200 },
        { x: 0, y: 0, width: 100, height: 100 }
      )
    ).toBe(false)
  })
})

// =====================================================
// CLOSET UI BEHAVIOR
// =====================================================
describe('Closet behavior', () => {
  test('shows closet when entering dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    })

    scene.player.x = 100
    scene.player.y = 100

    scene.update()

    // Entering shows the green glow. The click target is left alone — it is always
    // interactive, and its own handler checks playerInsideDressingRoom.
    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(true)
  })

  test('hides the glow when leaving the dressing room but keeps the click target hit-testable', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.update()

    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(false)
    // Hiding or disabling the target here is what broke clicking before: Phaser
    // skips input on anything that would not render, and nothing ever showed it
    // again, so the circle became permanently unclickable after the first exit.
    expect(scene.closetHit.setVisible).not.toHaveBeenCalledWith(false)
    expect(scene.closetHit.disableInteractive).not.toHaveBeenCalled()
  })

  test('hides press E hint when far from closet', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.update()

    expect(scene.pressEText.setVisible).toHaveBeenCalledWith(false)
  })

  test('shows press E hint at the closet when close enough to it', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
      closetZone: { x: 55, y: 40, width: 80, height: 80 },
    })

    // closetCenter = (55+35, 40+60) = (90, 100)
    scene.player.x = 90
    scene.player.y = 100

    scene.update()

    expect(scene.pressEText.setVisible).toHaveBeenCalledWith(true)
    expect(scene.pressEText.setPosition).toHaveBeenCalledWith(50, 20)
  })

  test('shows the wash-up hint when close enough to the quick-undress spot', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
      undressPoint: { x: 620, y: 650 },
    })

    scene.player.x = 620
    scene.player.y = 650

    scene.update()

    expect(scene.undressHint.setVisible).toHaveBeenCalledWith(true)
    expect(scene.undressHint.setPosition).toHaveBeenCalledWith(560, 560)
  })

  test('hides the wash-up hint when far from the quick-undress spot', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
      undressPoint: { x: 620, y: 650 },
    })

    scene.player.x = 10
    scene.player.y = 10

    scene.update()

    expect(scene.undressHint.setVisible).toHaveBeenCalledWith(false)
  })

  test('resumes closet glow animation when entering dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    })

    scene.player.x = 100
    scene.player.y = 100

    scene.update()

    expect(scene.closetGlowTween.resume).toHaveBeenCalled()
  })

  test('pauses closet glow animation when leaving dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.update()

    expect(scene.closetGlowTween.pause).toHaveBeenCalled()
  })

  test('shows and resumes the quick-undress glow when entering the dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    })

    scene.player.x = 100
    scene.player.y = 100

    scene.update()

    expect(scene.undressGlow.setVisible).toHaveBeenCalledWith(true)
    expect(scene.undressGlowTween.resume).toHaveBeenCalled()
  })

  test('hides and pauses the quick-undress glow when leaving the dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.closetImage = {
      setVisible: jest.fn(),
      disableInteractive: jest.fn(),
    }

    scene.update()

    expect(scene.undressGlow.setVisible).toHaveBeenCalledWith(false)
    expect(scene.undressGlowTween.pause).toHaveBeenCalled()
  })
})

// =====================================================
// EXTRA STATE EDGE CASES
// =====================================================
test('dispatches lecture-room-entered as soon as the player walks into the room', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    playerInsideLectureRoom: false,
  })

  scene.player.x = 20
  scene.player.y = 20

  const handler = jest.fn()
  window.addEventListener('lecture-room-entered', handler)
  scene.update()
  window.removeEventListener('lecture-room-entered', handler)

  expect(handler).toHaveBeenCalledTimes(1)
  expect(scene.playerInsideLectureRoom).toBe(true)
})

test('hides the lecture info-point glow and hint when player leaves the room', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 100, height: 100 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 500
  scene.player.y = 500

  scene.update()

  expect(scene.lectureGlow.setVisible).toHaveBeenCalledWith(false)
  expect(scene.lectureGlowTween.pause).toHaveBeenCalled()
})

test('shows the lecture info-point glow, and unlocks materials on E when close to it', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 55
  scene.player.y = 55
  Phaser.Input.Keyboard.JustDown.mockReturnValueOnce(true)

  const handler = jest.fn()
  window.addEventListener('lecture-materials-unlocked', handler)
  scene.update()
  window.removeEventListener('lecture-materials-unlocked', handler)

  expect(scene.lectureGlow.setVisible).toHaveBeenCalledWith(true)
  expect(scene.lectureGlowTween.resume).toHaveBeenCalled()
  expect(handler).toHaveBeenCalledTimes(1)
})

test('hides the press E hint when inside the lecture room but too far from the info point', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 400, height: 400 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 300
  scene.player.y = 300

  const handler = jest.fn()
  window.addEventListener('lecture-materials-unlocked', handler)
  scene.update()
  window.removeEventListener('lecture-materials-unlocked', handler)

  expect(scene.lectureGlow.setVisible).toHaveBeenCalledWith(true)
  expect(scene.pressEText.setVisible).toHaveBeenCalledWith(false)
  expect(handler).not.toHaveBeenCalled()
})
// =====================================================
// DRESSING-ROOM DEPTH SWITCH
// =====================================================
describe('Dressing-room depth switch', () => {
  test('room image is drawn in front of the player at the door (y < 465)', () => {
    const dressingImage = { setDepth: jest.fn() }
    const scene = createScene({ dressingImage })
    scene.player.y = 450

    scene.update()

    expect(dressingImage.setDepth).toHaveBeenCalledWith(20)
  })

  test('room image drops behind the player once inside (y >= 465)', () => {
    const dressingImage = { setDepth: jest.fn() }
    const scene = createScene({ dressingImage })
    scene.player.y = 600

    scene.update()

    expect(dressingImage.setDepth).toHaveBeenCalledWith(-5)
  })
})

// =====================================================
// INFO POINT (press E, only in the corridor)
// =====================================================
describe('Info point', () => {
  const infoScene = (overrides) => createScene({
    infoPoint: { x: 140, y: 360 },
    infoGlow: { setVisible: jest.fn() },
    infoGlowTween: { resume: jest.fn(), pause: jest.fn() },
    corridorZone: { x: 0, y: 290, width: 700, height: 140 },
    ...overrides,
  })

  test('pressing E in the corridor opens the info popup', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const scene = infoScene()
    scene.player.x = 140
    scene.player.y = 360 // inside the corridor

    const opened = []
    const listener = () => opened.push(true)
    window.addEventListener('info-popup-opened', listener)
    scene.update()
    window.removeEventListener('info-popup-opened', listener)
    expect(opened).toHaveLength(1)
  })

  test('does not open when the player is outside the corridor', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const scene = infoScene()
    scene.player.x = 600
    scene.player.y = 600 // outside the corridor

    const opened = []
    const listener = () => opened.push(true)
    window.addEventListener('info-popup-opened', listener)
    scene.update()
    window.removeEventListener('info-popup-opened', listener)
    expect(opened).toHaveLength(0)
  })

  test('shows the glow only while in the corridor', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(false)
    const scene = infoScene()
    scene.player.x = 140
    scene.player.y = 360
    scene.update()
    expect(scene.infoGlow.setVisible).toHaveBeenLastCalledWith(true)

    scene.player.y = 600
    scene.update()
    expect(scene.infoGlow.setVisible).toHaveBeenLastCalledWith(false)
  })
})

// =====================================================
// POSITION PERSISTENCE
// =====================================================
describe('position persistence', () => {
  beforeEach(() => {
    clearSavedGame()
    localStorage.clear()
  })

  test('update saves the player position', () => {
    const scene = createScene()
    scene.player.x = 900
    scene.player.y = 400

    scene.update()

    const saved = JSON.parse(localStorage.getItem(SAVED_GAME_KEY))
    expect(saved.player).toEqual({ x: 900, y: 400 })
  })
})

// =====================================================
// PRESENCE FLAGS AFTER A RELOAD
// =====================================================
describe('presence flags after a reload', () => {
  const airlock2Zone = { x: 1110, y: 250, width: 170, height: 110 }
  const bslZone = { key: 'BSL-1', x: 700, y: 470, width: 260, height: 250 }

  function fakeGlowEntry(zone) {
    return {
      key: zone.key,
      zone,
      center: { x: zone.x + 30, y: zone.y + 30 },
      glow: { setVisible: jest.fn() },
      tween: { resume: jest.fn(), pause: jest.fn() },
      playerInside: false,
    }
  }

  test('seeds the airlock2 flag so the suit-up confirmation is not re-fired on reload', () => {
    const scene = createScene({ airlock2Zone })
    scene.player.x = 1150
    scene.player.y = 300

    scene.seedPresenceFlags()

    expect(scene.playerInsideAirlock2).toBe(true)

    const spy = jest.spyOn(window, 'dispatchEvent')
    scene.update()

    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-entry-confirm-opened' })
    )

    spy.mockRestore()
  })

  test('seeds a BSL room flag so no duplicate room entry is recorded on reload', () => {
    const entry = fakeGlowEntry(bslZone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 800
    scene.player.y = 600
    scene.notifyRoomEntry = jest.fn()

    scene.seedPresenceFlags()

    expect(entry.playerInside).toBe(true)

    scene.update()

    expect(scene.notifyRoomEntry).not.toHaveBeenCalled()
  })

  test('a room the player is not standing in still records an entry when they walk in', () => {
    const entry = fakeGlowEntry(bslZone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 100
    scene.player.y = 100
    scene.notifyRoomEntry = jest.fn()

    scene.seedPresenceFlags()
    expect(entry.playerInside).toBe(false)

    scene.player.x = 800
    scene.player.y = 600
    scene.update()

    expect(scene.notifyRoomEntry).toHaveBeenCalledWith('BSL-1')
  })

  // The BSL4 entry confirmation now fires on airlock2 entry, not BSL-4 zone
  // entry — see "Airlock2 BSL4 suit station behavior" above.


  test('seeds the dressing room flag and shows its glows', () => {
    const ppeRoomZone = { x: 0, y: 430, width: 700, height: 290 }
    const scene = createScene({ ppeRoomZone })
    scene.player.x = 300
    scene.player.y = 600

    scene.seedPresenceFlags()

    expect(scene.playerInsideDressingRoom).toBe(true)
    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(true)
    expect(scene.closetGlowTween.resume).toHaveBeenCalled()
  })
})

// =====================================================
// BROWSER SHORTCUTS MUST NOT COUNT AS IN-GAME KEYPRESSES
// =====================================================
// Cmd+R / Ctrl+R reloads the page. Phaser sees the bare "R" keydown, so without
// a modifier guard the reload shortcut also triggered the dressing-room wash-up:
// it stripped all worn PPE and, while awaiting undress, handed out a new microbe.
describe('modified keypresses are ignored', () => {
  const dressingRoom = { x: 0, y: 0, width: 280, height: 250 }

  function sceneInDressingRoom(keyOverrides) {
    const scene = createScene({ ppeRoomZone: dressingRoom })
    scene.player.x = 50
    scene.player.y = 50
    scene.keyR = { ...scene.keyR, ...keyOverrides }
    scene.keyE = { ...scene.keyE, ...keyOverrides }
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    return scene
  }

  test.each([
    ['Ctrl (Windows/Linux reload)', { ctrlKey: true }],
    ['Cmd (macOS reload)', { metaKey: true }],
    ['Alt', { altKey: true }],
  ])('R held with %s does not trigger quick-undress', (_label, modifier) => {
    const scene = sceneInDressingRoom(modifier)
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quick-undress' })
    )

    dispatchSpy.mockRestore()
  })

  test('R with no modifier still triggers quick-undress', () => {
    const scene = sceneInDressingRoom({})
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quick-undress' })
    )

    dispatchSpy.mockRestore()
  })

  test('E held with Cmd does not open the closet', () => {
    const scene = sceneInDressingRoom({ metaKey: true })
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'closet-popup-opened' })
    )

    dispatchSpy.mockRestore()
  })
})
