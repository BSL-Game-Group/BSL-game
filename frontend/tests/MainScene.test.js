import MainScene from '../src/game/scenes/main_scene'
import microbeService from '../src/services/microbes'
import { EventBus } from '../src/game/EventBus'
import DoorGroup from '../src/game/groups/DoorGroup.js'

jest.mock('phaser', () => ({
  Physics: {
    Arcade: {
      Sprite: class MockSprite {},
      Image: class MockImage {},
      StaticGroup: class MockStaticGroup {},
      Group: class MockGroup {},
    },
  },
  Input: {
    Keyboard: {
      JustDown: jest.fn(),
    },
  },
  Scene: class {},
}))

jest.mock('../src/services/microbes', () => ({
  __esModule: true,
  default: {
    getRandom: jest.fn(),
  },
}))

jest.mock('../src/game/EventBus', () => {
  const handlers = {}
  return {
    EventBus: {
      on: jest.fn((event, cb) => {
        ;(handlers[event] = handlers[event] || []).push(cb)
      }),
      off: jest.fn((event, cb) => {
        handlers[event] = (handlers[event] || []).filter((h) => h !== cb)
      }),
      emit: jest.fn((event, ...args) => {
        ;(handlers[event] || []).forEach((h) => h(...args))
      }),
    },
  }
})

jest.mock('../src/game/groups/DoorGroup.js', () => {
  return jest.fn().mockImplementation(() => ({
    solidSprites: ['door1-solid', 'door2-solid'],
    addDoor: jest.fn(),
  }))
})

jest.mock('../src/game/config/constants', () => ({
  PLAYER_CONFIG: {},
  DOORS_CONFIG: [
    {
      id: 1,
      x: 10,
      y: 20,
      type: 'doorA',
      scale: 1,
      physics: {},
      links: [2],
    },
    {
      id: 2,
      x: 30,
      y: 40,
      type: 'doorB',
      scale: 2,
      physics: {},
      links: [1],
    },
  ],
}))

describe('replaceCurrentMicrobeRandomly', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('updates currentMicrobe and emits an event when a microbe is returned', async () => {
    const microbe = {
      id: 1,
      common_name: 'E. coli',
      scientific_name: 'Escherichia coli',
      type: 'Bacterium',
    }

    microbeService.getRandom.mockResolvedValue(microbe)

    const scene = new MainScene()

    await scene.replaceCurrentMicrobeRandomly()

    expect(microbeService.getRandom).toHaveBeenCalledTimes(1)
    expect(scene.currentMicrobe).toEqual(microbe)
    expect(EventBus.emit).toHaveBeenCalledWith(
      'current-microbe-updated',
      microbe
    )
  })

  test('does nothing when no microbe is returned', async () => {
    microbeService.getRandom.mockResolvedValue(null)

    const scene = new MainScene()
    scene.currentMicrobe = { old: 'microbe' }

    await scene.replaceCurrentMicrobeRandomly()

    expect(microbeService.getRandom).toHaveBeenCalledTimes(1)
    expect(scene.currentMicrobe).toEqual({ old: 'microbe' })
    expect(EventBus.emit).not.toHaveBeenCalled()
  })
})

describe('request-new-microbe listener', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('emitting request-new-microbe calls replaceCurrentMicrobeRandomly', () => {
    const scene = new MainScene()
    const spy = jest
      .spyOn(scene, 'replaceCurrentMicrobeRandomly')
      .mockResolvedValue(undefined)

    scene.registerEventBusListeners()
    EventBus.emit('request-new-microbe')

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('initializeDoors', () => {
  let scene
  let player

  beforeEach(() => {
    jest.clearAllMocks()

    player =
      {
        id: 'player',
      }

    scene = new MainScene()

    scene.physics = {
      add: {
        collider: jest.fn(),
      },
    }
  })

  test('creates all doors, links airlocks, sets special doors and returns the group', () => {
    const door1 = {
      addAirlockDoorPair: jest.fn(),
      setScale: jest.fn().mockReturnThis(),
    }

    const door2 = {
      addAirlockDoorPair: jest.fn(),
      setScale: jest.fn().mockReturnThis(),
    }

    const mockGroup = {
      solidSprites: ['door1-solid', 'door2-solid'],
      addDoor: jest
        .fn()
        .mockReturnValueOnce(door1)
        .mockReturnValueOnce(door2),
    }

    DoorGroup.mockImplementation(() => mockGroup)

    const result = scene.initializeDoors(player)

    expect(DoorGroup).toHaveBeenCalledWith(scene)

    expect(mockGroup.addDoor).toHaveBeenNthCalledWith(
      1,
      10,
      20,
      'doorA',
      {}
    )

    expect(mockGroup.addDoor).toHaveBeenNthCalledWith(
      2,
      30,
      40,
      'doorB',
      {}
    )

    expect(door1.setScale).toHaveBeenCalledWith(1)
    expect(door2.setScale).toHaveBeenCalledWith(2)

    expect(scene.physics.add.collider).toHaveBeenCalledWith(
      player,
      mockGroup.solidSprites
    )

    expect(door1.addAirlockDoorPair).toHaveBeenCalledWith(door2)
    expect(door2.addAirlockDoorPair).toHaveBeenCalledWith(door1)

    expect(scene.bsl4Door).toBe(door1)
    expect(scene.bsl3Door).toBe(door2)

    expect(result).toBe(mockGroup)
  })
})

describe('handleDoorInteraction', () => {
  let scene
  let player
  let door
  let zone
  let Phaser

  beforeEach(() => {
    Phaser = require('phaser')

    Phaser.Input.Keyboard.JustDown.mockReset()

    player = {}

    door = {
      tryToChangeDoorState: jest.fn(),
    }

    zone = {
      parentDoor: door,
    }

    scene = {
      hintManager: {
        showDoorHint: jest.fn(),
        showDoorFeedback: jest.fn(),
      },
      keyE: {
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      },
      bsl4Door: null,
      handleBsl4DoorPress: jest.fn(),
    }
  })

  test('shows the door hint when player is near a door', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(false)

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(scene.hintManager.showDoorHint)
      .toHaveBeenCalledWith(door)
  })

  test('does nothing if E is not pressed', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(false)

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
    expect(scene.handleBsl4DoorPress).not.toHaveBeenCalled()
  })

  test('changes door state when E is pressed', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    door.tryToChangeDoorState.mockReturnValue(true)

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(door.tryToChangeDoorState).toHaveBeenCalledTimes(1)
    expect(scene.hintManager.showDoorFeedback).not.toHaveBeenCalled()
  })

  test('shows feedback when the door cannot be opened', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    door.tryToChangeDoorState.mockReturnValue(false)

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(scene.hintManager.showDoorFeedback)
      .toHaveBeenCalledWith(door)
  })

  test('delegates BSL4 doors to handleBsl4DoorPress', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    scene.bsl4Door = door

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(scene.handleBsl4DoorPress)
      .toHaveBeenCalledWith(door)

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
  })

  test('ignores Ctrl+E', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    scene.keyE.ctrlKey = true

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
  })

  test('ignores Meta+E', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    scene.keyE.metaKey = true

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
  })

  test('ignores Alt+E', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    scene.keyE.altKey = true

    MainScene.prototype.handleDoorInteraction.call(
      scene,
      player,
      zone
    )

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
  })
})
