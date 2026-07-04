import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import ClosetPopup from './components/ClosetPopup/ClosetPopup'
import AnswerPopup from './components/AnswerPopup/AnswerPopup'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false)
  const [answerLevel, setAnswerLevel] = useState('')

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

  useEffect(() => {
    const handleAnswerOpen = (e) => {
      setAnswerLevel(e?.detail?.level ?? '')
      setAnswerOpen(true)
    }
    window.addEventListener('answer-popup-opened', handleAnswerOpen)
    return () => window.removeEventListener('answer-popup-opened', handleAnswerOpen)
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
            <ClosetPopup
              open={isPopupOpen}
              onClose={() => setPopupOpen(false)}
            />

            <AnswerPopup
              open={answerOpen}
              onClose={() => setAnswerOpen(false)}
              isCorrect={true}
              level={answerLevel}
            />

            <Game />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
