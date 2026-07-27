import { useState, useEffect, useRef } from 'react'
import { DndProvider, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ItemType, EQUIPMENT_CONFIG, CATEGORY_CONFIG, applyEquip } from './ItemConfig'
import Character from './Character'
import DraggableItem from './DragFunctionality'
import { useTranslation } from '../../i18n/context'

// Tabs in display order, derived from the category registry.
const CATEGORIES = Object.values(CATEGORY_CONFIG).sort((a, b) => a.order - b.order)

function InventoryPanel({ equipped, onToggleEquip }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id)

  const [, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item) => onToggleEquip(item.id, false) // False means we are unequipping it
  }))

  const itemsInTab = Object.values(EQUIPMENT_CONFIG).filter((c) => c.category === activeTab)
  const available = itemsInTab.filter((c) => !equipped[c.id])

  return (
    <div ref={drop} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <h3 style={{ marginTop: 0 }}>{t('closet.equipmentLabel')}</h3>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`gear-tab${activeTab === cat.id ? ' active' : ''}`}
            onClick={() => setActiveTab(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {available.map((config) => (
          <DraggableItem
            key={`inventory-${config.id}`}
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
    lab_coat: false,
    glasses: false,
    sunglasses: false,
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

  if (!open) {
    return null;}

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="popup-overlay">
        <div
          className="popup-box"
          role="dialog"
          aria-modal="true"
          aria-label={t('closet.title')}
          ref={dialogRef}
          tabIndex={-1}
        >
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