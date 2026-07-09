import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import ClosetPopup from './components/ClosetPopup/ClosetPopup'
import SidebarPopup from './components/SidebarPopup'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)
  const [isPopupOpen, setPopupOpen] = useState(false)
  const [isLecturePopupOpen, setLecturePopupOpen] = useState(false)

  useEffect(() => {
    fetch('/api/test')
  }, [])

  useEffect(() => {
    const handler = () => setLectureOpen(true)
    window.addEventListener('lecture-room-entered', handler)
    return () => window.removeEventListener('lecture-room-entered', handler)
  }, [])

  useEffect(() => {
    const handleClosetClick = () => setPopupOpen(true)
    window.addEventListener('closet-popup-opened', handleClosetClick)
    return () => window.removeEventListener('closet-popup-opened', handleClosetClick)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', paddingTop: '24px' }}>
      <h1>BSL-game</h1>

      {!gameStarted ? (
        <button onClick={() => setGameStarted(true)} style={{ cursor: 'pointer' }}>Start Game</button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            data-testid="lecture-panel"
            style={{ display: lectureOpen ? 'block' : 'none', width: 220 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Lecture Materials</h2>
              <button
                onClick={() => setLecturePopupOpen((open) => !open)}
                style={{ marginLeft: '8px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {isLecturePopupOpen ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <ClosetPopup
              open={isPopupOpen}
              onClose={() => setPopupOpen(false)}
            />
            <SidebarPopup
              open={isLecturePopupOpen}
              onClose={() => setLecturePopupOpen(false)}
            />

            <Game />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
