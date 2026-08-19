import {
  CATEGORY_CONFIG,
  EQUIPMENT_CATEGORIES,
  CATEGORY_IDS,
} from '../src/utils/equipmentCategories'
import { EQUIPMENT_CONFIG } from '../src/components/ClosetPopup/ItemConfig'

test('the category map and the equipment config cannot drift apart', () => {
  expect(CATEGORY_IDS).toEqual(['eyewear', 'masks', 'body', 'gloves', 'footwear'])
  expect(Object.keys(EQUIPMENT_CATEGORIES).sort()).toEqual(Object.keys(EQUIPMENT_CONFIG).sort())

  for (const [id, category] of Object.entries(EQUIPMENT_CATEGORIES)) {
    expect(CATEGORY_IDS).toContain(category)
    expect(EQUIPMENT_CONFIG[id].category).toBe(category)
    expect(CATEGORY_CONFIG[category].labelKey).toBe(`equipment.categories.${category}`)
  }
})
