import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import ClosetPopup from './components/ClosetPopup/ClosetPopup'
import SidebarPopup from './components/SidebarPopup'
import Task from './components/Task.jsx'
import AnswerPopup from './components/AnswerPopup/AnswerPopup'
import HowToPlay from './components/HowToPlay'
import InfoPopup from './components/InfoPopup/InfoPopup'
import { EventBus } from './game/EventBus'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)
  const [isPopupOpen, setPopupOpen] = useState(false)
  const [isLecturePopupOpen, setLecturePopupOpen] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [answerOpen, setAnswerOpen] = useState(false)
  const [answerLevel, setAnswerLevel] = useState('')
  const [currentMicrobe, setCurrentMicrobe] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    fetch('/api/test')
  }, [])

  // The Phaser scene owns the current microbe and broadcasts it here; we need it
  // to judge whether the room the player entered matches the microbe's class.
  useEffect(() => {
    const handleMicrobeUpdate = (microbe) => setCurrentMicrobe({ ...microbe })
    EventBus.on('current-microbe-updated', handleMicrobeUpdate)
    return () => EventBus.off('current-microbe-updated', handleMicrobeUpdate)
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
    const handleInfoOpen = () => setInfoOpen(true)
    window.addEventListener('info-popup-opened', handleInfoOpen)
    return () => window.removeEventListener('info-popup-opened', handleInfoOpen)
  }, [])

  useEffect(() => {
    const handleAnswerOpen = (e) => {
      setAnswerLevel(e?.detail?.level ?? '')
      setAnswerOpen(true)
    }
    window.addEventListener('answer-popup-opened', handleAnswerOpen)
    return () => window.removeEventListener('answer-popup-opened', handleAnswerOpen)
  }, [])

  // The room is a string ('BSL-3'); the microbe's class is a plain number (3).
  // Strip the 'BSL-' prefix and compare numbers.
  const correctLevel = currentMicrobe?.bsl_level
  const chosenLevel = Number(String(answerLevel).replace('BSL-', ''))
  const isCorrect = typeof correctLevel === 'number' && chosenLevel === correctLevel

  const handleAnswerClose = () => {
    setAnswerOpen(false)
    // Advance to a new microbe after every answer (no immediate retry).
    EventBus.emit('request-new-microbe')
  }

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

          <HowToPlay />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            data-testid="lecture-panel"
            style={{ display: lectureOpen ? 'block' : 'none', width: 220 }}
          >
            <Task />
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

            <AnswerPopup
              open={answerOpen}
              onClose={handleAnswerClose}
              isCorrect={isCorrect}
              level={answerLevel}
              microbe={currentMicrobe}
            />

            <InfoPopup open={infoOpen} onClose={() => setInfoOpen(false)} />

            <Game />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
