import axios from 'axios'
import microbeService from '../src/services/microbes'

jest.mock('axios')

describe('microbeService', () => {
  // 1. Fake the game session data before tests run
  beforeAll(() => {
    Object.defineProperty(window, '__gameData', {
      value: { sessionId: 'fake-test-session-123' },
      writable: true
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getRandom', () => {
    test('returns the microbe when the request succeeds', async () => {
      const microbe = {
        id: 1,
        common_name: 'E. coli',
        scientific_name: 'Escherichia coli',
        type: 'Bacterium',
      }

      axios.get.mockResolvedValue({
        data: microbe,
      })

      const result = await microbeService.getRandom()

      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledWith(
        '/api/microbes/random',
        {
          params: {
            lang: 'en',
            session_id: 'fake-test-session-123', // 2. Expect the fake session ID
          },
        }
      )
      expect(result).toEqual(microbe)
    })

    test('returns null when the request fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'))

      const result = await microbeService.getRandom()

      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledWith(
        '/api/microbes/random',
        {
          params: {
            lang: 'en',
            session_id: 'fake-test-session-123', // 3. Expect the fake session ID here too
          },
        }
      )
      expect(result).toBeNull()
    })
  })
})