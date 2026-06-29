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
}))

jest.mock('../src/game/scenes/rooms', () => ({
  createRooms: jest.fn(() => ({})),
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
  }

  scene.input = {
    keyboard: {
      createCursorKeys: jest.fn(() => ({})),
      addKey: jest.fn(() => ({})),
    },
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
    .toHaveBeenCalledWith(20, 20, 1240, 680)
})

test('create creates player sprite', () => {
  const scene = createScene()

  scene.create()

  expect(scene.physics.add.sprite)
    .toHaveBeenCalledWith(700, 300, 'player_base')
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