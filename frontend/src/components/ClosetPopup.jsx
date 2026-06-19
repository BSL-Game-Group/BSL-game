function ClosetPopup({ open, onClose }) {
  if (!open) {return null}

  return (
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
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>

        <p>Choose equipment for BSL Laboratory</p>
      </div>
    </div>
  )
}

export default ClosetPopup