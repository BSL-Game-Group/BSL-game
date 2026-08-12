jest.mock('phaser', () => ({
  Scene: class {},
  Geom: {
    Rectangle: jest.fn(),
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        E: 'E',
      },
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

jest.mock('../src/services/microbes', () => ({
  __esModule: true,
  default: {
    getRandom: jest.fn().mockResolvedValue({
      id: 1,
      common_name: 'Test Microbe',
      scientific_name: 'Microbius',
      type: 'Fungus',
      lecture_text: 'Lorem',
    }),
  },
}))

import MainScene from '../src/game/scenes/main_scene'
import microbeService from '../src/services/microbes'
import { EventBus } from '../src/game/EventBus'
import {
  SAVED_GAME_KEY,
  defaultSnapshot,
  clearSavedGame,
} from '../src/state/savedGame'
import { resetSessionIdCache } from '../src/state/session'

// create() reads the session id, so without this a snapshot written by one
// test would have the next test restoring a saved game it never asked for.
// session.js caches the id in module state, which localStorage.clear() cannot
// reach — reset it too or the first minted id leaks into every later test.
beforeEach(() => {
  clearSavedGame()
  localStorage.clear()
  resetSessionIdCache()
  window.__gameData = undefined
})

function fakeSprite() {
  return {
    setScale: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setCollideWorldBounds: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    disableInteractive: jest.fn().mockReturnThis(),
    // Restoring saved PPE swaps the player's base texture.
    setTexture: jest.fn().mockReturnThis(),
    setAngle: jest.fn().mockReturnThis(),
    body: {
      setSize: jest.fn(),
      setOffset: jest.fn(),
    },
  }
}

// NEW: mock Phaser Text object
function fakeText() {
  return {
    setText: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
  }
}

function createScene() {
  const scene = new MainScene()
  scene.scale = {
    width: 1280,
    height: 720
  };

  scene.physics = {
    world: {
      setBounds: jest.fn(),
    },
    add: {
      sprite: jest.fn(() => fakeSprite()),
      collider: jest.fn(),
    },
  }

  scene.load = {
    image: jest.fn(),
  }

  scene.add = {
    sprite: jest.fn(() => fakeSprite()),

    // CHANGED: return a text object instead of a sprite
    text: jest.fn(() => fakeText()),

    tileSprite: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
    })),
  }

  scene.input = {
    keyboard: {
      createCursorKeys: jest.fn(() => ({})),
      addKey: jest.fn(() => ({})),
    },
  }

  scene.textures = {
    exists: jest.fn(() => false),
    get: jest.fn(() => ({
      getSourceImage: jest.fn(() => ({
        naturalWidth: 1254,
        naturalHeight: 1254,
      })),
    })),
    createCanvas: jest.fn(() => ({
      getContext: jest.fn(() => ({
        drawImage: jest.fn(),
      })),
      refresh: jest.fn(),
    })),
  }

  scene.make = {
    tilemap: jest.fn(() => ({
      addTilesetImage: jest.fn(() => ({})),
      createBlankLayer: jest.fn(() => ({
        fill: jest.fn(),
        setDepth: jest.fn(),
      })),
    })),
  }

  scene.events = {
    on: jest.fn(),
  }

  scene.initializeDoors = jest.fn()

  return scene
}

test('create sets world bounds', () => {
  const scene = createScene()

  scene.create()

  expect(scene.physics.world.setBounds)
    .toHaveBeenCalledWith(0, 0, 1280, 720)
})

test('create tiles the whole map with the stone floor', () => {
  const scene = createScene()

  scene.create()

  expect(scene.add.tileSprite)
    .toHaveBeenCalledWith(0, 0, 1280, 720, 'labs_floor')
})

test('create creates player sprite', () => {
  const scene = createScene()

  scene.create()

  expect(scene.physics.add.sprite)
    .toHaveBeenCalledWith(590, 150, 'player_base')
})

test('create shrinks the player collision body', () => {
  const scene = createScene()

  scene.create()

  expect(scene.player.body.setSize).toHaveBeenCalledWith(60, 205)
  expect(scene.player.body.setOffset).toHaveBeenCalledWith(23, 6)
})

test('create creates equipment sprites', () => {
  const scene = createScene()

  scene.create()

  expect(scene.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'lab_coat')

  expect(scene.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'mask')

  expect(scene.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'glasses')

  expect(scene.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'sunglasses')
  
  expect(scene.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'face_shield')

  expect(scene.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'bsl3_respirator')
})

test('preload registers the respirator asset with the correct key', () => {
  const scene = createScene()

  scene.preload()

  expect(scene.load.image).toHaveBeenCalledWith('face_shield', 'assets/equipment/on_character/eyewear/face_shield_on.png')
  expect(scene.load.image).toHaveBeenCalledWith('bsl3_respirator', 'assets/equipment/on_character/masks/bsl3_respirator_on.png')
})

test('create initializes keyboard controls', () => {
  const scene = createScene()

  scene.create()

  expect(scene.input.keyboard.createCursorKeys).toHaveBeenCalled()
  expect(scene.input.keyboard.addKey).toHaveBeenCalled()
})

test('create adds collider', () => {
  const scene = createScene()

  scene.create()

  expect(scene.physics.add.collider).toHaveBeenCalled()
})

test('create registers window event listeners', () => {
  const spy = jest.spyOn(window, 'addEventListener')

  const scene = createScene()

  scene.create()

  expect(spy).toHaveBeenCalledWith(
    'equipment-changed',
    expect.any(Function)
  )

  expect(spy).toHaveBeenCalledWith(
    'popup-opened',
    expect.any(Function)
  )

  expect(spy).toHaveBeenCalledWith(
    'popup-closed',
    expect.any(Function)
  )

  spy.mockRestore()
})

test('create registers shutdown handler', () => {
  const scene = createScene()

  scene.create()

  expect(scene.events.on).toHaveBeenCalledWith(
    'shutdown',
    expect.any(Function)
  )
})

// -----------------------------
// RESTORING A SAVED GAME
// -----------------------------
// EventBus is a Phaser EventEmitter, and this file's phaser mock already makes
// its on/off/emit jest.fn()s, so no extra mock is needed to assert on it.
function seedSavedGame(overrides = {}) {
  const snapshot = {
    ...defaultSnapshot(),
    savedAt: Date.now(),
    ...overrides,
  }
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(snapshot))
  return snapshot
}

describe('restoring a saved game', () => {
  beforeEach(() => {
    clearSavedGame()
    localStorage.clear()
    window.__gameData = undefined
    jest.clearAllMocks()
  })

  test('spawns the player at the saved position instead of the corridor', () => {
    seedSavedGame({ player: { x: 1040, y: 600 } })

    const scene = createScene()
    scene.create()

    expect(scene.physics.add.sprite).toHaveBeenCalledWith(1040, 600, 'player_base')
  })

  test('spawns in the corridor when there is no saved game', () => {
    const scene = createScene()
    scene.create()

    expect(scene.physics.add.sprite).toHaveBeenCalledWith(590, 150, 'player_base')
  })

  test('adopts the stored session id instead of minting a new one', () => {
    localStorage.setItem('bsl-game.session.v1', 'stored-session-id')

    const scene = createScene()
    scene.create()

    expect(window.__gameData.sessionId).toBe('stored-session-id')
  })

  test('mints a uuid session id when the browser has none', () => {
    const scene = createScene()
    scene.create()

    expect(window.__gameData.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  test('adopts the saved microbe without asking the API for a new one', () => {
    const microbe = { id: 7, common_name: 'Saved Microbe', bsl_level: 3 }
    seedSavedGame({ microbe })

    const scene = createScene()
    scene.create()

    expect(microbeService.getRandom).not.toHaveBeenCalled()
    expect(scene.currentMicrobe).toEqual(microbe)
    expect(EventBus.emit).toHaveBeenCalledWith('current-microbe-updated', microbe)
  })

  test('rerolls a microbe when the saved game has none', () => {
    seedSavedGame({ microbe: null })

    const scene = createScene()
    scene.create()

    expect(microbeService.getRandom).toHaveBeenCalled()
  })

  test('restores worn PPE onto the character', () => {
    seedSavedGame({ equipped: { ...defaultSnapshot().equipped, mask: true } })

    const scene = createScene()
    scene.create()

    expect(scene.equipment.mask.setVisible).toHaveBeenCalledWith(true)
    expect(scene.equipment.lab_coat.setVisible).toHaveBeenCalledWith(false)
  })

  test('locks movement when the closet was open before the reload', () => {
    seedSavedGame({ popups: { ...defaultSnapshot().popups, closet: true } })

    const scene = createScene()
    scene.create()

    // popup-opened fired long before the scene existed, so create() cannot wait
    // to be told: it has to read the saved popup state itself.
    expect(scene.isPopupOpen).toBe(true)
  })

  test('movement is unlocked when no popup was open', () => {
    seedSavedGame()

    const scene = createScene()
    scene.create()

    expect(scene.isPopupOpen).toBe(false)
  })
})
