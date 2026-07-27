import axios from 'axios'
import bslMaterialService from '../src/services/bslMaterial'

jest.mock('axios')

describe('bslMaterialService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMaterial', () => {
    test('returns the material for the given language', async () => {
      const material = {
        intro: { heading: 'International development', paragraphs: [] },
        riskGroups: { heading: 'Risk groups', intro: '', factors: [] },
        bslLevels: [],
        organismTables: [],
        sources: [],
      }

      axios.get.mockResolvedValue({
        data: material,
      })

      const result = await bslMaterialService.getMaterial('fi')

      expect(axios.get).toHaveBeenCalledTimes(1)
      expect(axios.get).toHaveBeenCalledWith(
        '/api/bsl-material',
        {
          params: {
            lang: 'fi',
          },
        }
      )
      expect(result).toEqual(material)
    })

    test('rejects when the request fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'))

      await expect(bslMaterialService.getMaterial('en')).rejects.toThrow('Network error')
    })
  })
})
