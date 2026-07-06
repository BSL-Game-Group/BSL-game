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
      <h1 className="app-title">BSL-game</h1>

      {!gameStarted ? (
        <div className="start-screen">
          <div className="microbe-field" aria-hidden="true">
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
            <span className="microbe"></span>
          </div>

          <p className="start-screen__subtitle">
            Handle microbes safely — choose the right protective gear and the right laboratory.
          </p>

          <button className="start-button" onClick={() => setGameStarted(true)}>
            Start Game
          </button>

          <section className="game-instructions">
            <h2>How to play</h2>
            <ol className="instruction-steps">
              <li>A microbe is assigned to you at random.</li>
              <li>Go to the lecture room to read the microbe&apos;s details and its BSL level.</li>
              <li>In the lecture room you can also study the materials to learn about different microbes and BSL classes (1–4).</li>
              <li>Remember the BSL level — it decides everything.</li>
              <li>Go to the dressing room and open the closet (press <kbd>E</kbd>).</li>
              <li>Put on the protective equipment the level requires (lab coat, mask, glasses…).</li>
              <li>Go to the matching BSL room (1–4).</li>
              <li>Press <kbd>E</kbd> at the dark green ring to handle the microbe.</li>
              <li>The game checks your work — were the equipment and room correct for this microbe?</li>
              <li>Wash up at the shower or eyewash station to decontaminate before leaving.</li>
              <li>A new microbe is drawn — try again!</li>
              <li>After several rounds, see your summary: score, correct vs. wrong, and the levels you mastered.</li>
              <li>You can leave any time through the Exit — the game shuts down.</li>
            </ol>
            <p className="game-instructions__controls">
              <strong>Controls:</strong> Arrow keys / click to move · <kbd>E</kbd> or click to interact · <strong>Close</strong> button to close windows
            </p>
          </section>
        </div>
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
