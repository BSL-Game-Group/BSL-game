import axios from 'axios'
import microbeService from '../src/services/microbes'

jest.mock('axios')

describe('microbeService', () => {
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
          },
        }
      )
      expect(result).toBeNull()
    })
  })
})