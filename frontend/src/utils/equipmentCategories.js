// Adding a closet item means adding it here AND in EQUIPMENT_CONFIG; the
// equipmentCategories test fails if only one of the two is done.
export const CATEGORY_CONFIG = {
  eyewear: { id: 'eyewear', labelKey: 'equipment.categories.eyewear', order: 0, stackable: false },
  masks: { id: 'masks', labelKey: 'equipment.categories.masks', order: 1, stackable: false },
  body: { id: 'body', labelKey: 'equipment.categories.body', order: 2, stackable: false },
  gloves: { id: 'gloves', labelKey: 'equipment.categories.gloves', order: 3, stackable: true },
  footwear: {
    id: 'footwear',
    labelKey: 'equipment.categories.footwear',
    order: 4,
    stackable: false,
  },
}

export const EQUIPMENT_CATEGORIES = {
  lab_coat: 'body',
  closable_lab_coat: 'body',
  pressurized_suit: 'body',
  disposable_overall: 'body',
  mask: 'masks',
  bsl3_respirator: 'masks',
  glasses: 'eyewear',
  sunglasses: 'eyewear',
  face_shield: 'eyewear',
  wow_helmet: 'eyewear',
  gloves: 'gloves',
  gloves_2: 'gloves',
  indoor_shoes: 'footwear',
  disposable_foot_covers: 'footwear',
}

export const CATEGORY_IDS = Object.values(CATEGORY_CONFIG)
  .sort((a, b) => a.order - b.order)
  .map((category) => category.id)
