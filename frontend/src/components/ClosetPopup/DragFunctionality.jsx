import { ItemType } from './ItemConfig'
import { useDrag } from 'react-dnd'

// Unified Draggable Component
// Handles both inventory and equipped states based on the props passed to it.
export default function DraggableItem({ id, src, style, isEquipped }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  return (
    <img
      ref={drag}
      src={src}
      alt={id}
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        width: isEquipped ? undefined : 80, // Default width for inventory items
        zIndex: isEquipped ? 10 : undefined,
        willChange: 'transform', 
        transform: isEquipped ? style?.transform : 'translateZ(0)',
        ...style // Spreads any specific positioning for equipped items
      }}
    />
  )
}