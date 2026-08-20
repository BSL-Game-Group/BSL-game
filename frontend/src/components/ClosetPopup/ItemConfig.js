import { CATEGORY_CONFIG, EQUIPMENT_CATEGORIES } from '../../utils/equipmentCategories';

const ItemType = 'EQUIPMENT';

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

    // NEW: Convert any remaining fixed 'px' inside the CSS transforms 
    // (like translateY or perspective) into container height percentages (cqh)
    if (style.transform) {
      style.transform = style.transform.replace(/([-0-9.]+)px/g, (match, val) => {
        const percentageOfHeight = (parseFloat(val) / BASE_H) * 100;
        return `${percentageOfHeight}cqh`;
      });
    }

    const category = EQUIPMENT_CATEGORIES[id];

    out[id] = {
      ...item,
      id,
      category,
      equippedStyle: style, // Overwrite with responsive styles
      inventorySrc: `${INVENTORY_ROOT}/${category}/${id}.png`,
      equippedSrc: `${CHARACTER_ROOT}/${category}/${id}_on.png`,
    };
  }
  return out;
}

// Add new equipment here — only `label` + `equippedStyle` are needed; the category comes
// from EQUIPMENT_CATEGORIES and the paths are derived from the key + category above.
// `label` is the item button's accessible name.
const EQUIPMENT_CONFIG = buildEquipment({
  lab_coat: {
    label: 'Lab coat',
    equippedStyle: {
      position: 'absolute', top: '43px', left: '54px', width: '130px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  closable_lab_coat: {
    label: 'Closable lab coat',
    equippedStyle: {
      position: 'absolute', top: '95px', left: '55px', width: '130px', height: 'auto',
      transform: 'scale(0.93) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  pressurized_suit: {
    label: 'Pressurized suit',
    equippedStyle: {
      position: 'absolute', top: '1px', left: '60px', width: '130px', height: 'auto',
      transform: 'scale(1.3) rotate(0deg) translateY(0px)', transformOrigin: 'top center',
    }
  },
  mask: {
    label: 'Mask',
    equippedStyle: {
      position: 'absolute', top: '45px', left: '77px', width: '70px', height: 'auto',
      transform: 'scale(1.2) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  glasses: {
    label: 'Glasses',
    equippedStyle: {
      position: 'absolute', top: '30px', left: '77px', width: '70px', height: 'auto',
      transform: 'scale(1.3) rotate(-1.5deg) translateY(5px)', transformOrigin: 'top center',
    }
  },

  bsl3_respirator: {
    label: 'BSL3 respirator',
    equippedStyle: {
      position: 'absolute', top: '6px', left: '80px', width: '70px', height: 'auto',
      transform: 'scale(2.05) rotate(-1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  sunglasses: {
    label: 'Sunglasses',
    equippedStyle: {
      position: 'absolute', top: '10px', left: '68px', width: '106px', height: 'auto',
      transform: 'perspective(360px) rotateY(20deg) rotate(1deg) scale(1.2) translateY(5px)',
      transformOrigin: 'center center',
    }
  },
  disposable_overall: {
    label: 'Disposable overall',
    equippedStyle: {
      position: 'absolute', top: '-12px', left: '64px', width: '130px', height: 'auto',
      transform: 'scale(1.35) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },

  face_shield: {
    label: 'Face shield',    
    equippedStyle: {
      position: 'absolute', top: '10px', left: '76px', width: '82px', height: 'auto',
      transform: 'scale(1.4) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  
  wow_helmet: {
    label: 'Fantasy helmet',
    equippedStyle: {
      position: 'absolute', top: '-3px', left: '61px', width: '106px', height: 'auto',
      transform: 'perspective(360px) rotateY(20deg) rotate(0deg) scale(1.32) translateY(5px)',
      transformOrigin: 'center center',
    }
  },
  gloves: {
    label: 'Gloves',
    equippedStyle: {
      position: 'absolute', top: '171px', left: '89px', width: '59px', height: '35px',
      transform: 'scale(2.25) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  gloves_2: {
    label: 'Gloves 2',
    equippedStyle: {
      position: 'absolute', top: '183px', left: '90px', width: '60px', height: 'auto',
      transform: 'scale(2.4) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  indoor_shoes: {
    label: 'Indoor shoes',
    equippedStyle: {
      position: 'absolute', top: '299px', left: '86px', width: '60px', height: 'auto',
      transform: 'scale(2.1) rotate(-1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  disposable_foot_covers: {
    label: 'Disposable foot covers',
    equippedStyle: {
      position: 'absolute', top: '279px', left: '86px', width: '60px', height: 'auto',
      transform: 'scale(2.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
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