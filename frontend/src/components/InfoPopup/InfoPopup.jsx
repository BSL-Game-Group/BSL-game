import { useEffect } from 'react'
import HowToPlay from '../HowToPlay'

function InfoPopup({ open, onClose }) {
  useEffect(() => {
    window.dispatchEvent(
      new Event(open ? 'popup-opened' : 'popup-closed')
    )
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button className="popup-close-button" onClick={onClose}>
          Close
        </button>
        <HowToPlay />
      </div>
    </div>
  )
}

export default InfoPopup