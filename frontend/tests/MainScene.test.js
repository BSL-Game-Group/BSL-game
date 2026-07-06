import MainScene from '../src/game/scenes/main_scene'
import microbeService from '../src/services/microbes'
import { EventBus } from '../src/game/EventBus'

jest.mock('phaser', () => ({
  Scene: class {}
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
