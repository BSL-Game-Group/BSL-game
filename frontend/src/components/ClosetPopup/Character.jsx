import { useDrop } from 'react-dnd'
import { ItemType, EQUIPMENT_CONFIG } from './ItemConfig'
import DraggableItem from './DragFunctionality'

export default function Character({ equipped, onToggleEquip }) {
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, true) // True means we are equipping it
  }))

  // Determine which base image to show
  const baseImageSrc = equipped.pressurized_suit 
    ? "/assets/player/head_only.png" 
    : "/assets/player/base.png";

  return (
      <div ref={drop} style={{ position: 'relative', width: 250, height: 350 }}>
        {/* UPDATE THIS: Use the dynamic variable instead of the hardcoded string */}
        <img 
          src={baseImageSrc} 
          alt="base" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />

        {/* Dynamically render equipped items based on the configuration */}
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
              isEquipped={true}
            />
          )
        })}
      </div>
    )
  }