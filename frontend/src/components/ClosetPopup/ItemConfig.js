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
  for (const [id, item] of Object.entries(items)) {
    out[id] = {
      ...item,
      id,
      inventorySrc: `${INVENTORY_ROOT}/${item.category}/${id}.png`,
      equippedSrc: `${CHARACTER_ROOT}/${item.category}/${id}_on.png`,
    };
  }
  return out;
}

// Add new equipment here — only `category` + `equippedStyle` are needed;
// paths are derived from the key + category above.
const EQUIPMENT_CONFIG = buildEquipment({
  lab_coat: {
    category: 'body',
    equippedStyle: {
      position: 'absolute', top: '45px', left: '55px', width: '130px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  mask: {
    category: 'masks',
    equippedStyle: {
      position: 'absolute', top: '49px', left: '79px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  glasses: {
    category: 'eyewear',
    equippedStyle: {
      position: 'absolute', top: '35px', left: '75px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  sunglasses: {
    category: 'eyewear',
    equippedStyle: {
      position: 'absolute', top: '9px', left: '66px', width: '106px', height: 'auto',
      transform: 'perspective(360px) rotateY(20deg) rotate(-2deg) scale(1.1) translateY(5px)',
      transformOrigin: 'center center',
    }
  },
  gloves: {
    category: 'gloves',
    equippedStyle: {
      position: 'absolute', top: '120px', left: '90px', width: '60px', height: 'auto',
      transform: 'scale(1.1) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  closable_lab_coat: {
    category: 'body',
    equippedStyle: {
      position: 'absolute', top: '45px', left: '55px', width: '130px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
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

export { ItemType, EQUIPMENT_CONFIG, CATEGORY_CONFIG, applyEquip };
