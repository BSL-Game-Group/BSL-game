const ItemType = 'EQUIPMENT';

// The tabs, in display order. `stackable` allows 2+ equipped at once.
const CATEGORY_CONFIG = {
  eyewear: { id: 'eyewear', label: 'Eyewear', order: 0, stackable: false },
  masks:   { id: 'masks',   label: 'Masks',   order: 1, stackable: false },
  body:    { id: 'body',    label: 'Body',    order: 2, stackable: false },
  gloves:  { id: 'gloves',  label: 'Gloves',  order: 3, stackable: true  },
};

// Add new equipment here
const EQUIPMENT_CONFIG = {
  lab_coat: {
    id: 'lab_coat',
    category: 'body',
    inventorySrc: '/assets/equipment/equipment_in_inventory/lab_coat.png',
    equippedSrc: '/assets/equipment/equipment_on_character/lab_coat.png',
    equippedStyle: {
      position: 'absolute', top: '45px', left: '55px', width: '130px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  mask: {
    id: 'mask',
    category: 'masks',
    inventorySrc: '/assets/equipment/equipment_in_inventory/mask.png',
    equippedSrc: '/assets/equipment/equipment_on_character/mask.png',
    equippedStyle: {
      position: 'absolute', top: '49px', left: '79px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  glasses: {
    id: 'glasses',
    category: 'eyewear',
    inventorySrc: '/assets/equipment/equipment_in_inventory/glasses.png',
    equippedSrc: '/assets/equipment/equipment_on_character/glasses.png',
    equippedStyle: {
      position: 'absolute', top: '35px', left: '75px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  }
};

// Pure equip rule: returns a new equipped map with `itemId` on. For a
// non-stackable category, first clears any other item in that category (swap).
function applyEquip(equipped, itemId, equipmentConfig = EQUIPMENT_CONFIG, categoryConfig = CATEGORY_CONFIG) {
  const category = equipmentConfig[itemId].category;
  const next = { ...equipped };
  if (!categoryConfig[category].stackable) {
    for (const item of Object.values(equipmentConfig)) {
      if (item.category === category) {
        next[item.id] = false;
      }
    }
  }
  next[itemId] = true;
  return next;
}

export { ItemType, EQUIPMENT_CONFIG, CATEGORY_CONFIG, applyEquip };