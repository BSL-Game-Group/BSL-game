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

function fakeSprite() {
  return {
    setScale: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setCollideWorldBounds: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    disableInteractive: jest.fn().mockReturnThis(),
    body: { setSize: jest.fn(), setOffset: jest.fn() },
  }
}

function createScene() {
  const scene = new MainScene()

  scene.physics = {
    world: {
      setBounds: jest.fn(),
    },
    add: {
      sprite: jest.fn(() => fakeSprite()),
      collider: jest.fn(),
    },
  }

  scene.add = {
    sprite: jest.fn(() => fakeSprite()),
    text: jest.fn(() => fakeSprite()),
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
      addTilesetImage: jest.fn(() => ({ })),
      createBlankLayer: jest.fn(() => ({
        fill: jest.fn(),
        setDepth: jest.fn(),
      })),
    })),
  }

  scene.events = {
    on: jest.fn(),
  }

  return scene
}

test('create sets world bounds', () => {
  const scene = createScene()

  scene.create()

  expect(scene.physics.world.setBounds)
    .toHaveBeenCalledWith(0, 0, 1280, 720)
})

test('create tiles the labs side with the lab floor', () => {
  const scene = createScene()

  scene.create()

  expect(scene.add.tileSprite)
    .toHaveBeenCalledWith(700, 0, 580, 720, 'labs_floor')
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
})

test('create initializes keyboard controls', () => {
  const scene = createScene()

  scene.create()

  expect(scene.input.keyboard.createCursorKeys)
    .toHaveBeenCalled()

  expect(scene.input.keyboard.addKey)
    .toHaveBeenCalled()
})

test('create adds collider', () => {
  const scene = createScene()

  scene.create()

  expect(scene.physics.add.collider)
    .toHaveBeenCalled()
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

test('create wires a separate collider for the lecture shelves when present', () => {
  // createRooms is mocked; make it expose a lectureShelves group like the real one does.
  const rooms = require('../src/game/scenes/rooms')
  const shelves = [{ name: 'lecture-shelf-1' }]
  rooms.createRooms.mockImplementationOnce((scene) => {
    scene.lectureShelves = shelves
    return []
  })

  const scene = createScene()

  scene.create()

  expect(scene.physics.add.collider)
    .toHaveBeenCalledWith(scene.player, shelves)
})