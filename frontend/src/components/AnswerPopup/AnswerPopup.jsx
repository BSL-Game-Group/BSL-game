import { useEffect } from 'react'

function AnswerPopup({ open, onClose, isCorrect, level }) {
  // Lock player movement while the verdict is showing (Phaser listens for these).
  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  if (!open) {
    return null
  }

  const headline = isCorrect ? 'Correct!' : 'Not quite'
  const headlineColor = isCorrect ? '#1a8a34' : '#c51a1a'
  const message = isCorrect
    ? `Your equipment is correct for ${level}.`
    : `Your equipment isn't right for ${level} yet.`

  return (
    <div
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#fff', padding: '32px', borderRadius: '12px',
          width: '80%', maxWidth: '480px', minHeight: '220px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.25)', position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          textAlign: 'center',
        }}
      >
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

        <h2 style={{ margin: '0 0 12px', color: headlineColor }}>{headline}</h2>
        <p style={{ margin: 0, fontSize: '1.05rem' }}>{message}</p>
      </div>
    </div>
  )
}

export default AnswerPopup
