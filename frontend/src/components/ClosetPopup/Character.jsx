import { useDrop } from 'react-dnd'
import { ItemType, EQUIPMENT_CONFIG } from './ItemConfig'
import DraggableItem from './DragFunctionality'

export default function Character({ equipped, onToggleEquip }) {
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, true)
  }))

  const getBaseImageSrc = () => {
      if (equipped.pressurized_suit || equipped.disposable_overall) {
        return "/assets/player/head_only.png";
      }

      if (equipped.wow_helmet) {
        return "/assets/player/no_hair.png"; 
      }

      return "/assets/player/base.png";
    };

  return (
    // 1. OUTER CONTAINER: Fills the Bootstrap column entirely.
    // Setting `containerType: 'size'` here lets us measure the exact available space using `cqw` and `cqh`.
    <div className="pt-2 d-flex align-items-center justify-content-center" style={{ 
      width: '100%', 
      height: '100%', 
      containerType: 'size' 
    }}>
      
      {/* 
        2. INNER CONTAINER: The actual drop zone.
        Using `min()` math forces this box to strictly lock to a 250/350 ratio 
        whether the window is squeezed horizontally or vertically.
      */}
      <div ref={drop} style={{
        position: 'relative',
        containerType: 'size', // Creates a new context so the equipment correctly reads THIS box's height for transforms
        width: 'min(100cqw, calc(100cqh * 250 / 350))',
        height: 'min(100cqh, calc(100cqw * 350 / 250))',
      }}>
        <img 
          src={getBaseImageSrc()} 
          alt="base"
          style={{ display: 'block', height: '100%', width: '100%', objectFit: 'contain' }}
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
    </div>
  )
}