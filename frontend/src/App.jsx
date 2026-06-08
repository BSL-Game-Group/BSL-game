import { useEffect, useState } from 'react'
import Game from './Game.jsx'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)

  useEffect(() => {
    fetch('/api/test')
      .then((res) => res.json())
      .catch((err) => console.error('API error:', err))
  }, [])

  useEffect(() => {
    const handler = () => setLectureOpen(true)
    window.addEventListener('lecture-room-entered', handler)
    return () => window.removeEventListener('lecture-room-entered', handler)
  }, [])

  return (
    <div style={{ display: 'flex'}}>
      <div
        data-testid="lecture-panel"
        style={{ display: lectureOpen ? 'block' : 'none', width: 220, alignItems: 'flex-start'  }}
      >
        <h2>Luento-materiaali</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', paddingTop: '24px' }}>
      <p>BSL-game frontend</p>

      {!gameStarted ? (
        <button onClick={() => setGameStarted(true)}>
          Start Game
        </button>
      ) : (
        <Game />
      )}
    </div>
    </div>
  )
}

export default App
