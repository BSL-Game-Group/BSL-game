import { ItemType } from './ItemConfig'
import { useDrag } from 'react-dnd'


export default function DraggableItem({ id, src, label, style, isEquipped, onToggleEquip }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  return (
    <button
      ref={drag}
      type="button"
      className="equipment-item"
      data-item-id={id}
      aria-label={label}
      aria-pressed={isEquipped}
      onClick={() => onToggleEquip(id, !isEquipped)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        width: isEquipped ? undefined : 80,
        zIndex: isEquipped ? 10 : undefined,
        willChange: 'transform',
        transform: isEquipped ? style?.transform : 'translateZ(0)',
        ...style
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </button>
  )
}
