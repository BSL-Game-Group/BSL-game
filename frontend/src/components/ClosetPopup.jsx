import { useState, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

const ItemType = 'EQUIPMENT'

// 1. Unchanged: Draggable item for the inventory
function DraggableItem({ src, type }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  return (
    <img
      ref={drag}
      src={src}
      width={80}
      alt={type}
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1
      }}
    />
  )
}

// 2. NEW: Draggable component specifically for items already on the character
function DraggableEquippedItem({ src, type, style }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }))

  return (
    <img
      ref={drag}
      src={src}
      alt={type}
      style={{
        ...style, // Keep all your absolute positioning and transforms
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        zIndex: 10 // Ensure it sits on top of the base character
      }}
    />
  )
}

function Character({ equipped, setEquipped }) {
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => {
      setEquipped(prev => ({
        ...prev,
        [item.type]: true
      }))
    }
  }))

  return (
    <div
      ref={drop}
      style={{
        position: 'relative',
        width: 250,
        height: 350,
      }}
    >
      <img 
        src="/assets/player/base.png" 
        alt="base" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
      />

      {/* Replaced static <img> with <DraggableEquippedItem> */}
      {equipped.lab_coat && (
        <DraggableEquippedItem
          type="lab_coat"
          src="/assets/equipment/equipment_on_character/lab_coat.png"
          style={{
            position: 'absolute',
            top: '45px',
            left: '55px',
            width: '130px',
            height: 'auto',
            transform: 'scale(1.1) rotate(1deg) translateY(5px)',
            transformOrigin: 'top center',
          }}
        />
      )}

      {equipped.mask && (
        <DraggableEquippedItem
          type="mask"
          src="/assets/equipment/equipment_on_character/mask.png"
          style={{
            position: 'absolute',
            top: '49px',
            left: '79px',
            width: '70px',
            height: 'auto',
            transform: 'scale(1.1) rotate(1deg) translateY(5px)',
            transformOrigin: 'top center',
          }}
        />
      )}

      {equipped.glasses && (
        <DraggableEquippedItem
          type="glasses"
          src="/assets/equipment/equipment_on_character/glasses.png"
          style={{
            position: 'absolute',
            top: '35px',
            left: '75px',
            width: '70px',
            height: 'auto',
            transform: 'scale(1.1) rotate(-2deg) translateY(5px)',
            transformOrigin: 'top center',
          }}
        />
      )}
    </div>
  )
}

// 3. NEW: Extracted the inventory into its own component so it can use `useDrop`
function InventoryPanel({ equipped, setEquipped }) {
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => {
      // Unequip the item when dropped back here
      setEquipped(prev => ({
        ...prev,
        [item.type]: false
      }))
    }
  }))

  return (
    <div
      ref={drop}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <h3 style={{ marginTop: 0 }}>Equipment</h3>

      {/* Conditionally render items only if they are NOT equipped */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!equipped.glasses && (
          <DraggableItem src="/assets/equipment/equipment_in_inventory/glasses.png" type="glasses" />
        )}
        {!equipped.mask && (
          <DraggableItem src="/assets/equipment/equipment_in_inventory/mask.png" type="mask" />
        )}
        {!equipped.lab_coat && (
          <DraggableItem src="/assets/equipment/equipment_in_inventory/lab_coat.png" type="lab_coat" />
        )}
      </div>
    </div>
  )
}

function ClosetPopup({ open, onClose }) {
  const [equipped, setEquipped] = useState({
    mask: false,
    lab_coat: false,
    glasses: false,
  })

  // NEW: Broadcast equipment changes to the global window object
  useEffect(() => {
    const event = new CustomEvent('equipment-changed', { 
      detail: equipped 
    });
    window.dispatchEvent(event);
  }, [equipped]);

  if (!open) { return null }

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      >
        {/* Modal Window */}
        <div
          style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '12px',
            width: '80%',
            maxWidth: '820px',
            minHeight: '520px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '8px 16px',
              backgroundColor: '#c51a1a',
              color: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            Close
          </button>

          {/* 50/50 Layout Container */}
          <div style={{ display: 'flex', gap: '40px', flex: 1, marginTop: '20px' }}>

            {/* LEFT: Character */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0 }}>Player</h3>

              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Character
                  equipped={equipped}
                  setEquipped={setEquipped}
                />
              </div>
            </div>

            {/* RIGHT: Inventory Drop Zone */}
            <InventoryPanel
              equipped={equipped}
              setEquipped={setEquipped}
            />

          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default ClosetPopup