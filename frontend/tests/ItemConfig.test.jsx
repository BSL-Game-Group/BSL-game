import { applyEquip, EQUIPMENT_CONFIG } from '../src/components/ClosetPopup/ItemConfig'
import fs from 'fs'
import path from 'path'

// Injected mock configs — the real items each sit in their own category,
// so swap/stack behavior can only be exercised with a config we control.
const CATS = {
  hats:   { id: 'hats',   label: 'Hats',   order: 0, stackable: false },
  gloves: { id: 'gloves', label: 'Gloves', order: 1, stackable: true },
}
const ITEMS = {
  hat_a:   { id: 'hat_a',   category: 'hats' },
  hat_b:   { id: 'hat_b',   category: 'hats' },
  glove_l: { id: 'glove_l', category: 'gloves' },
  glove_r: { id: 'glove_r', category: 'gloves' },
}

describe('applyEquip', () => {
  test('equipping into an empty exclusive category adds the item', () => {
    const next = applyEquip({}, 'hat_a', ITEMS, CATS)
    expect(next.hat_a).toBe(true)
  })

  test('exclusive category swaps out the previously equipped item', () => {
    const next = applyEquip({ hat_a: true }, 'hat_b', ITEMS, CATS)
    expect(next.hat_b).toBe(true)
    expect(next.hat_a).toBe(false)
  })

  test('stackable category keeps both items equipped', () => {
    const next = applyEquip({ glove_l: true }, 'glove_r', ITEMS, CATS)
    expect(next.glove_l).toBe(true)
    expect(next.glove_r).toBe(true)
  })

  test('does not mutate the input object', () => {
    const prev = { hat_a: true }
    applyEquip(prev, 'hat_b', ITEMS, CATS)
    expect(prev).toEqual({ hat_a: true })
  })
})

describe('EQUIPMENT_CONFIG derived paths', () => {
  test('id is set from the config key on every entry', () => {
    for (const [key, config] of Object.entries(EQUIPMENT_CONFIG)) {
      expect(config.id).toBe(key)
    }
  })

  test('derives the correct inventory + character paths for each committed item', () => {
    expect(EQUIPMENT_CONFIG.glasses.inventorySrc).toBe('/assets/equipment/in_inventory/eyewear/glasses.png')
    expect(EQUIPMENT_CONFIG.glasses.equippedSrc).toBe('/assets/equipment/on_character/eyewear/glasses_on.png')

    expect(EQUIPMENT_CONFIG.mask.inventorySrc).toBe('/assets/equipment/in_inventory/masks/mask.png')
    expect(EQUIPMENT_CONFIG.mask.equippedSrc).toBe('/assets/equipment/on_character/masks/mask_on.png')

    expect(EQUIPMENT_CONFIG.lab_coat.inventorySrc).toBe('/assets/equipment/in_inventory/body/lab_coat.png')
    expect(EQUIPMENT_CONFIG.lab_coat.equippedSrc).toBe('/assets/equipment/on_character/body/lab_coat_on.png')
  })

  test('every derived asset file exists on disk', () => {
    const publicDir = path.join(__dirname, '..', 'public')
    for (const config of Object.values(EQUIPMENT_CONFIG)) {
      expect(fs.existsSync(path.join(publicDir, config.inventorySrc))).toBe(true)
      expect(fs.existsSync(path.join(publicDir, config.equippedSrc))).toBe(true)
    }
  })
})
