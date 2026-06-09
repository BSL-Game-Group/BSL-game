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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', paddingTop: '24px' }}>
      <p>BSL-game frontend</p>

      {!gameStarted ? (
        <button onClick={() => setGameStarted(true)}>Start Game</button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            data-testid="lecture-panel"
            style={{ display: lectureOpen ? 'block' : 'none', width: 220 }}
          >
            <h2>Luento-materiaali</h2>
            <ul>
              <li><a href="https://consteril.com/biosafety-levels-difference/" target="_blank" rel="noreferrer">Biosafety Levels – Consteril</a></li>
              <li><a href="https://www.ncbi.nlm.nih.gov/books/NBK535351/" target="_blank" rel="noreferrer">Biosafety in Microbiological Laboratories – NCBI</a></li>
              <li><a href="https://www.sciencedirect.com/science/chapter/monograph/pii/B9780128092316000119" target="_blank" rel="noreferrer">Biosafety – ScienceDirect</a></li>
            </ul>
          </div>
          <Game />
        </div>
      )}
    </div>
  )
}

export default App
