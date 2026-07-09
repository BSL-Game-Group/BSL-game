import { useEffect } from 'react'
import HowToPlay from '../HowToPlay'

// Info-desk popup: shows the same "How to play" steps as the start screen, for
// players who forgot how the game works. Uses the shared popup styling.
function InfoPopup({ open, onClose }) {
  // Lock player movement while the info panel is showing (Phaser listens for these).
  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px', padding: '8px 16px',
            backgroundColor: '#c51a1a', color: '#fff', border: '1px solid #ccc',
            borderRadius: '4px', cursor: 'pointer', zIndex: 10,
          }}
        >
          Close
        </button>

        <HowToPlay />
      </div>
    </div>
  )
}

export default InfoPopup
