import MainScene, { playerIsInsideZone } from '../src/game/scenes/main_scene'
import Phaser from 'phaser'

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

  scene.keyE = { isDown: true }

  scene.player = {
    x: 640,
    y: 500,
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
  }

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
  }

  scene.playArea = {
    contains: jest.fn(() => true),
  }

  scene.pressEText = {
    setVisible: jest.fn(),
    setPosition: jest.fn(),
  }

  // UI SAFETY MOCKS
  scene.closetHint = {
    visible: false,
    setPosition: jest.fn(),
  }

  scene.closetImage = {
    setVisible: jest.fn(),
    setInteractive: jest.fn(),
    disableInteractive: jest.fn(), // ✅ FIX ADDED HERE
  }

  scene.closetGlowTween = {
    resume: jest.fn(),
    pause: jest.fn(),
  }

  scene.closetGlow = {
    setVisible: jest.fn(),
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
    'assets/equipment/equipment_on_character/lab_coat.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'mask',
    'assets/equipment/equipment_on_character/mask.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'glasses',
    'assets/equipment/equipment_on_character/glasses.png'
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

    // The dresser sprite stays hidden now; entering shows the green glow and
    // activates the (invisible) click target.
    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(true)
    expect(scene.closetImage.setInteractive).toHaveBeenCalled()
  })

  test('hides closet when leaving dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500
  
    scene.closetImage = {
      setVisible: jest.fn(),
      disableInteractive: jest.fn(), // ✅ FIX
    }

    scene.update()

    expect(scene.closetImage.setVisible).toHaveBeenCalledWith(false)
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
