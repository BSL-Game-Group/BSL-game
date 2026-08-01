import { useDrop } from 'react-dnd'
import { ItemType, EQUIPMENT_CONFIG } from './ItemConfig'
import DraggableItem from './DragFunctionality'

export default function Character({ equipped, onToggleEquip }) {
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, true) // True means we are equipping it
  }))

  // Determine which player image to show based on the equipment
  const getBaseImageSrc = () => {

      if (equipped.pressurized_suit) {
        return "/assets/player/head_only.png";
      }

      if (equipped.wow_helmet) {
        return "/assets/player/no_hair.png"; 
      }

      return "/assets/player/base.png";
    };

  return (
      <div ref={drop} style={{ position: 'relative', width: 250, height: 350 }}>
        {/* Call the function to get the current image source */}
        <img 
          src={getBaseImageSrc()} 
          alt="base" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />

        {Object.values(EQUIPMENT_CONFIG).map((config) => {
          if (!equipped[config.id]) {
            return null;
          }
          
          return (
            <DraggableItem
              key={`equipped-${config.id}`}
              id={config.id}
              src={config.equippedSrc}
              style={config.equippedStyle}
              label={config.label}
              isEquipped={true}
              onToggleEquip={onToggleEquip}
            />
          )
        })}
      </div>
    )
  }
