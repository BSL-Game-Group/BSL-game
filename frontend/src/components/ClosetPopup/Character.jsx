import { useDrop } from 'react-dnd'
import { ItemType, EQUIPMENT_CONFIG } from './ItemConfig'
import DraggableItem from './DragFunctionality'

export default function Character({ equipped, onToggleEquip }) {
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, true) // True means we are equipping it
  }))

  return (
    <div ref={drop} style={{ position: 'relative', width: 250, height: 350 }}>
      <img 
        src="/assets/player/base.png" 
        alt="base" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
      />

      {/* Dynamically render equipped items based on the configuration */}
      {Object.values(EQUIPMENT_CONFIG).map((config) => {
        if (!equipped[config.id]) {
          return null;}
        
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