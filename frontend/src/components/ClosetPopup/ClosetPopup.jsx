import { useState, useEffect, useRef } from 'react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ItemType, EQUIPMENT_CONFIG, CATEGORY_CONFIG, applyEquip, unequipAll } from './ItemConfig'
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

  const itemsInTab = Object.values(EQUIPMENT_CONFIG).filter((c) => c.category === activeTab)
  const available = itemsInTab.filter((c) => !equipped[c.id])

  return (
    <div ref={drop} className="d-flex flex-column h-100 w-100">
      <div className="d-flex flex-row flex-wrap gap-2 p-2 border-bottom">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`btn btn-sm gear-tab ${activeTab === cat.id ? 'btn-primary' : 'btn-outline-secondary'}`}
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
            label={config.label}
            isEquipped={false}
            onToggleEquip={onToggleEquip}
          />
        ))}

        {available.length === 0 && (
          <p style={{ color: '#888', fontStyle: 'italic', margin: 0 }}>
            {itemsInTab.length === 0
              ? `No ${CATEGORY_CONFIG[activeTab].label.toLowerCase()} available yet`
              : 'All equipped.'}
          </p>
        )}
      </div>
    </div>
  )
}

function ClosetPopup({ open, onClose, onEquipmentChange }) {
  const { t } = useTranslation()
  const [equipped, setEquipped] = useState({
    mask: false,
    gloves: false,
    gloves_2: false,
    closable_lab_coat: false,
    disposable_overall: false,
    respirator: false,
    face_shield: false,
    lab_coat: false,
    glasses: false,
    wow_helmet: false,
    sunglasses: false,
    pressurized_suit: false,
  })
  const dialogRef = useRef(null)

  const pendingFocusRef = useRef(null)

  // Helper function to handle equip/unequip logic
  const handleToggleEquip = (itemId, isEquipped) => {
    setEquipped((prev) =>
      isEquipped ? applyEquip(prev, itemId) : { ...prev, [itemId]: false }
    )
    pendingFocusRef.current = itemId
  }

  // The quick-undress interactable lives in the dressing room (Phaser), not in
  // this popup, so it must work whether or not the popup is currently open.
  useEffect(() => {
    const handleQuickUndress = () => setEquipped(unequipAll())
    window.addEventListener('quick-undress', handleQuickUndress)
    return () => window.removeEventListener('quick-undress', handleQuickUndress)
  }, [])

  // Effect to handle external broadcasts
  useEffect(() => {
    if (onEquipmentChange) {onEquipmentChange(equipped);}
    window.dispatchEvent(new CustomEvent('equipment-changed', { detail: equipped }));
  }, [equipped, onEquipmentChange]);

  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'));
  }, [open]);

  // Escape closes the closet. Declared before the early return to respect the
  // rules of hooks; only active while the popup is open.
  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus()
    }
  }, [open])

  // Keep Tab inside the modal. Every focusable child is a plain <button>, so
  // one selector covers them all; the list is read on each keypress because
  // items come and go as they are equipped.
  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') {
        return
      }
      const dialog = dialogRef.current
      if (!dialog) {
        return
      }
      const focusable = [...dialog.querySelectorAll('button:not([disabled])')]
      if (focusable.length === 0) {
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      const outside = !dialog.contains(active)
      if (e.shiftKey && (active === first || active === dialog || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    const itemId = pendingFocusRef.current
    if (!itemId) {
      return
    }
    pendingFocusRef.current = null
    dialogRef.current?.querySelector(`[data-item-id="${itemId}"]`)?.focus()
  }, [equipped])

  if (!open) {return;}

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="popup-overlay d-flex align-items-center justify-content-center">
        <div
          className="popup-box bg-white p-4 h-100 w-100 d-flex flex-column"
          role="dialog"
          aria-modal="true"
          aria-label={t('closet.title')}
          ref={dialogRef}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>{t('closet.title')}</h2>
            <button className="btn btn-danger" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>

          {/* Main Grid Content */}
          <div className="row flex-grow-1 overflow-hidden">
            {/* Player Side */}
            <div className="col-4 border-end h-100 d-flex flex-column align-items-center justify-content-center overflow-hidden">
              <Character equipped={equipped} onToggleEquip={handleToggleEquip} />
            </div>

            {/* Inventory Side */}
            <div className="col-8 h-100">
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