import { useState, useEffect } from 'react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ItemType, EQUIPMENT_CONFIG } from './ItemConfig'
import Character from './Character'
import DraggableItem from './DragFunctionality'
import { useTranslation } from '../../i18n/context'

function InventoryPanel({ equipped, onToggleEquip }) {
  const { t } = useTranslation()
  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, false) // False means we are unequipping it
  }))

  return (
    <div ref={drop} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <h3 style={{ marginTop: 0 }}>{t('closet.equipmentLabel')}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Dynamically render unequipped items */}
        {Object.values(EQUIPMENT_CONFIG).map((config) => {
          if (equipped[config.id]) {
            return null;}

          return (
            <DraggableItem 
              key={`inventory-${config.id}`}
              id={config.id} 
              src={config.inventorySrc} 
              isEquipped={false}
            />
          )
        })}
      </div>
    </div>
  )
}

function ClosetPopup({ open, onClose, onEquipmentChange }) {
  const { t } = useTranslation()
  const [equipped, setEquipped] = useState({
    mask: false,
    lab_coat: false,
    glasses: false,
  })

  // Helper function to handle equip/unequip logic
  const handleToggleEquip = (itemId, isEquipped) => {
    setEquipped(prev => ({
      ...prev,
      [itemId]: isEquipped
    }))
  }

  // Effect to handle external broadcasts
  useEffect(() => {
    // If you are using a pure React app, favor the onEquipmentChange prop.
    // The window events are preserved here in case you are binding to a non-React engine.
    if (onEquipmentChange) {
      onEquipmentChange(equipped);}
    window.dispatchEvent(new CustomEvent('equipment-changed', { detail: equipped }));
  }, [equipped, onEquipmentChange]);

  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'));
  }, [open]);

  if (!open) {
    return null;}

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="popup-overlay">
        <div className="popup-box">
          <button
            onClick={onClose}
            className="popup-close-button"
          >
            {t('common.close')}
          </button>

          <div style={{ display: 'flex', gap: '40px', flex: 1, marginTop: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0 }}>{t('closet.player')}</h3>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Character equipped={equipped} onToggleEquip={handleToggleEquip} />
              </div>
            </div>

            <InventoryPanel equipped={equipped} onToggleEquip={handleToggleEquip} />
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default ClosetPopup