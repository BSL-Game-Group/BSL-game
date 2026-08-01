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

describe('notifyRoomEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    delete window.__gameData
  })

  test('sends room entry notification when sessionId is present', async () => {
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) }
    global.fetch.mockResolvedValue(mockResponse)
    window.__gameData = { sessionId: 'test-session-123' }

    const scene = new MainScene()
    await scene.notifyRoomEntry('bsl-2')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms/enter'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_key: 'bsl-2',
          session_id: 'test-session-123',
        }),
      })
    )
    expect(mockResponse.json).toHaveBeenCalled()
  })

  test('does nothing when sessionId is not present', async () => {
    const scene = new MainScene()
    await scene.notifyRoomEntry('bsl-2')

    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('does nothing when fetch response is not ok', async () => {
    const mockResponse = { ok: false, json: jest.fn() }
    global.fetch.mockResolvedValue(mockResponse)
    window.__gameData = { sessionId: 'test-session-123' }

    const scene = new MainScene()
    await scene.notifyRoomEntry('bsl-2')

    expect(global.fetch).toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
  })

  test('silently fails on fetch error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))
    window.__gameData = { sessionId: 'test-session-123' }

    const scene = new MainScene()
    // Should not throw
    await expect(scene.notifyRoomEntry('bsl-2')).resolves.not.toThrow()
  })
})

describe('getBackendUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.VITE_API_URL
  })

  test('returns VITE_API_URL when set', () => {
    process.env.VITE_API_URL = 'https://custom-api.example.com'
    const scene = new MainScene()

    expect(scene.getBackendUrl()).toBe('https://custom-api.example.com')
  })

  test('uses current window location for URL detection', () => {
    delete process.env.VITE_API_URL
    const scene = new MainScene()

    // Should return a backend URL based on environment
    const url = scene.getBackendUrl()
    expect(url).toMatch(/localhost:3001|backend:3001/)
  })
})

describe('generateSessionId', () => {
  test('generates unique session IDs', () => {
    const scene = new MainScene()
    const id1 = scene.generateSessionId()
    const id2 = scene.generateSessionId()

    expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/)
    expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/)
    expect(id1).not.toEqual(id2)
  })
})
