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
    <div className="pt-2" ref={drop} style={{
      position: 'relative',
      width: '100%',
      maxHeight: '100%',
      aspectRatio: '250 / 350',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <img 
        src={getBaseImageSrc()} 
        alt="base"
        className="img-fluid"
        style={{ height: '100%', width: '100%', objectFit: 'contain' }}
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
