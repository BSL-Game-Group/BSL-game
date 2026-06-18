import { useEffect, useState } from 'react'
import Game from './Game.jsx'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [isPopupOpen, setPopupOpen] = useState(false);

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
              <button onClick={() => setLinksVisible(!linksVisible)} style={{ marginLeft: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                {linksVisible ? 'Hide' : 'Show'}
              </button>
            </div>
            {linksVisible && (
              <ul>
                <li><a href="https://consteril.com/biosafety-levels-difference/" target="_blank" rel="noreferrer">Biosafety Levels – Consteril</a></li>
                <li><a href="https://www.ncbi.nlm.nih.gov/books/NBK535351/" target="_blank" rel="noreferrer">Biosafety in Microbiological Laboratories – NCBI</a></li>
                <li><a href="https://www.sciencedirect.com/science/chapter/monograph/pii/B9780128092316000119" target="_blank" rel="noreferrer">Biosafety – ScienceDirect</a></li>
              </ul>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            {isPopupOpen && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}>
                <div style={{
                  background: '#fff',
                  padding: '32px',
                  borderRadius: '12px',
                  width: '80%',
                  maxWidth: '820px',
                  minHeight: '520px',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                }}>
                  <button onClick={() => setPopupOpen(false)} style={{ position: 'absolute', top: '12px', right: '12px', padding: '8px 16px', backgroundColor: '#c51a1a', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                    Close
                  </button>
                  <p>Choose equipment for BSL Laboratory</p>
                </div>
              </div>
            )}
            <Game />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
