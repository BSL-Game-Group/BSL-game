import HowToPlay from '../HowToPlay'
import { useModalDialog } from '../../hooks/useModalDialog'

function InfoPopup({ open, onClose }) {
  const dialogRef = useModalDialog(open, onClose)

  if (!open) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div className="popup-box" role="dialog" aria-modal="true" ref={dialogRef} tabIndex={-1}>
        <button className="popup-close-button" onClick={onClose}>
          Close
        </button>
        <HowToPlay />
      </div>
    </div>
  )
}

export default InfoPopup