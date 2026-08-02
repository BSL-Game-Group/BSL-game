const ItemType = 'EQUIPMENT';

// The tabs, in display order. `stackable` allows 2+ equipped at once.
const CATEGORY_CONFIG = {
  eyewear: { id: 'eyewear', label: 'Eyewear', order: 0, stackable: false },
  masks:   { id: 'masks',   label: 'Masks',   order: 1, stackable: false },
  body:    { id: 'body',    label: 'Body',    order: 2, stackable: false },
  gloves:  { id: 'gloves',  label: 'Gloves',  order: 3, stackable: true  },
};

// Image paths are derived from each item's id + category, so the asset tree is
// usage -> category -> file:
//   /assets/equipment/in_inventory/<category>/<id>.png
//   /assets/equipment/on_character/<category>/<id>_on.png
const INVENTORY_ROOT = '/assets/equipment/in_inventory';
const CHARACTER_ROOT = '/assets/equipment/on_character';

// Injects id + derived inventorySrc/equippedSrc into each item definition.
function buildEquipment(items) {
  const out = {};
  
  // Base dimensions of your character image
  const BASE_W = 250;
  const BASE_H = 350;

  // Helper function to convert px to % dynamically
  const pxToPercent = (val, base) => {
    if (typeof val === 'string' && val.endsWith('px')) {
      return `${(parseFloat(val) / base) * 100}%`;
    }
    return val;
  };

  for (const [id, item] of Object.entries(items)) {
    // Clone the style object so we can safely mutate it
    const style = { ...item.equippedStyle };
    
    // Convert fixed pixel coordinates/sizes to percentages
    style.top = pxToPercent(style.top, BASE_H);
    style.left = pxToPercent(style.left, BASE_W);
    style.width = pxToPercent(style.width, BASE_W);
    style.height = pxToPercent(style.height, BASE_H);

    out[id] = {
      ...item,
      id,
      equippedStyle: style, // Overwrite with responsive styles
      inventorySrc: `${INVENTORY_ROOT}/${item.category}/${id}.png`,
      equippedSrc: `${CHARACTER_ROOT}/${item.category}/${id}_on.png`,
    };
  }
  return out;
}

// Add new equipment here — only `category`, `label` + `equippedStyle` are
// needed; paths are derived from the key + category above. `label` is the
// item button's accessible name.
const EQUIPMENT_CONFIG = buildEquipment({
  lab_coat: {
    category: 'body',
    label: 'Lab coat',
    equippedStyle: {
      position: 'absolute', top: '45px', left: '52px', width: '130px', height: 'auto',
      transform: 'scale(1.63) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  closable_lab_coat: {
    category: 'body',
    label: 'Closable lab coat',
    equippedStyle: {
      position: 'absolute', top: '95px', left: '55px', width: '130px', height: 'auto',
      transform: 'scale(0.93) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  pressurized_suit: {
    category: 'body',
    label: 'Pressurized suit',
    equippedStyle: {
      position: 'absolute', top: '5px', left: '60px', width: '130px', height: 'auto',
      transform: 'scale(1.9) rotate(0deg) translateY(0px)', transformOrigin: 'top center',
    }
  },
  mask: {
    category: 'masks',
    label: 'Mask',
    equippedStyle: {
      position: 'absolute', top: '53px', left: '73px', width: '70px', height: 'auto',
      transform: 'scale(1.6) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  glasses: {
    category: 'eyewear',
    label: 'Glasses',
    equippedStyle: {
      position: 'absolute', top: '37px', left: '71px', width: '70px', height: 'auto',
      transform: 'scale(1.7) rotate(-1.5deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  sunglasses: {
    category: 'eyewear',
    label: 'Sunglasses',
    equippedStyle: {
      position: 'absolute', top: '29px', left: '68px', width: '106px', height: 'auto',
      transform: 'perspective(360px) rotateY(20deg) rotate(1deg) scale(1.6) translateY(5px)',
      transformOrigin: 'center center',
    }
  },
  wow_helmet: {
    category: 'eyewear',
    label: 'Fantasy helmet',
    equippedStyle: {
      position: 'absolute', top: '20px', left: '57px', width: '106px', height: 'auto',
      transform: 'perspective(360px) rotateY(20deg) rotate(0deg) scale(1.95) translateY(5px)',
      transformOrigin: 'center center',
    }
  },
  gloves: {
    category: 'gloves',
    label: 'Gloves',
    equippedStyle: {
      position: 'absolute', top: '160px', left: '84px', width: '59px', height: '35px',
      transform: 'scale(3.3) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  gloves_2: {
    category: 'gloves',
    label: 'Gloves 2',
    equippedStyle: {
      position: 'absolute', top: '189px', left: '87px', width: '60px', height: 'auto',
      transform: 'scale(3.5) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },

});

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

// Returns a new equipped map with every known item unequipped.
function unequipAll(equipmentConfig = EQUIPMENT_CONFIG) {
  const next = {};
  for (const id of Object.keys(equipmentConfig)) {
    next[id] = false;
  }
  return next;
}

export { ItemType, EQUIPMENT_CONFIG, CATEGORY_CONFIG, applyEquip, unequipAll };
