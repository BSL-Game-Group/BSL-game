const ItemType = 'EQUIPMENT';

// Add new equipment here
const EQUIPMENT_CONFIG = {
  lab_coat: {
    id: 'lab_coat',
    inventorySrc: '/assets/equipment/equipment_in_inventory/lab_coat.png',
    equippedSrc: '/assets/equipment/equipment_on_character/lab_coat.png',
    equippedStyle: {
      position: 'absolute', top: '45px', left: '55px', width: '130px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  mask: {
    id: 'mask',
    inventorySrc: '/assets/equipment/equipment_in_inventory/mask.png',
    equippedSrc: '/assets/equipment/equipment_on_character/mask.png',
    equippedStyle: {
      position: 'absolute', top: '49px', left: '79px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(1deg) translateY(5px)', transformOrigin: 'top center',
    }
  },
  glasses: {
    id: 'glasses',
    inventorySrc: '/assets/equipment/equipment_in_inventory/glasses.png',
    equippedSrc: '/assets/equipment/equipment_on_character/glasses.png',
    equippedStyle: {
      position: 'absolute', top: '35px', left: '75px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  },

  face_shield: {
    id: 'face_shield',
    inventorySrc: '/assets/equipment/equipment_in_inventory/face_shield_inventory.png',
    equippedSrc: '/assets/equipment/equipment_on_character/face_shield_on.png',
    equippedStyle: {
      position: 'absolute', top: '35px', left: '75px', width: '70px', height: 'auto',
      transform: 'scale(1.1) rotate(-2deg) translateY(5px)', transformOrigin: 'top center',
    }
  }
}

export { ItemType, EQUIPMENT_CONFIG };