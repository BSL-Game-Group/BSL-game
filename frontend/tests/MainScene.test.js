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

jest.mock('../src/game/EventBus', () => ({
  EventBus: {
    emit: jest.fn(),
  },
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
