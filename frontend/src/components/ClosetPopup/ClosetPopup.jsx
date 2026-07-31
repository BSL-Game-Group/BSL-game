import { useState, useEffect } from 'react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ItemType, EQUIPMENT_CONFIG, CATEGORY_CONFIG, applyEquip } from './ItemConfig'
import Character from './Character'
import DraggableItem from './DragFunctionality'
import { useTranslation } from '../../i18n/context'

const CATEGORIES = Object.values(CATEGORY_CONFIG).sort((a, b) => a.order - b.order)

function InventoryPanel({ equipped, onToggleEquip }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id)

  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, false)
  }))

  const available = Object.values(EQUIPMENT_CONFIG).filter((c) => c.category === activeTab && !equipped[c.id])

  return (
    <div ref={drop} className="d-flex flex-column h-100 w-100">
      <div className="d-flex flex-row flex-wrap gap-2 p-2 border-bottom">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`btn btn-sm ${activeTab === cat.id ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-grow-1 p-3 overflow-auto">
        {available.map((config) => (
          <DraggableItem
            key={config.id}
            id={config.id}
            src={config.inventorySrc}
            isEquipped={false}
            onToggleEquip={onToggleEquip}
          />
        ))}
      </div>
    </div>
  )
}

function ClosetPopup({ open, onClose, onEquipmentChange }) {
  const { t } = useTranslation()
  const [equipped, setEquipped] = useState({
    mask: false, gloves: false, gloves_2: false, closable_lab_coat: false,
    disposable_overall: false, respirator: false, face_shield: false,
    lab_coat: false, glasses: false, sunglasses: false, pressurized_suit: false,
  })

  const handleToggleEquip = (itemId, isEquipped) => {
    setEquipped((prev) => isEquipped ? applyEquip(prev, itemId) : { ...prev, [itemId]: false })
  }

  useEffect(() => {
    if (onEquipmentChange) onEquipmentChange(equipped);
    window.dispatchEvent(new CustomEvent('equipment-changed', { detail: equipped }));
  }, [equipped, onEquipmentChange]);

  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'));
  }, [open]);

  if (!open) return null

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="popup-overlay d-flex align-items-center justify-content-center">
        <div className="popup-box bg-white p-4 h-100 w-100 d-flex flex-column">
          <button className="btn btn-danger align-self-end mb-3" onClick={onClose}>{t('common.close')}</button>
          <div className="row flex-grow-1 overflow-hidden">
            <div className="col-4 border-end h-100 align-items-start justify-content-center overflow-hidden">
               <Character equipped={equipped} onToggleEquip={handleToggleEquip} />
            </div>
            <div className="col-8">
               <InventoryPanel
                  equipped={equipped}
                  onToggleEquip={handleToggleEquip}
               />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

export default ClosetPopup