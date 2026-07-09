import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import ClosetPopup from './components/ClosetPopup/ClosetPopup'
import SidebarPopup from './components/SidebarPopup'
import Task from './components/Task.jsx'
import AnswerPopup from './components/AnswerPopup/AnswerPopup'
import HowToPlay from './components/HowToPlay'
import InfoPopup from './components/InfoPopup/InfoPopup'
import LanguageSelector from './components/LanguageSelector'
import { EventBus } from './game/EventBus'
import { useTranslation } from './i18n/context'

function App() {
  const { t, language } = useTranslation()
  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)
  const [isPopupOpen, setPopupOpen] = useState(false)
  const [isLecturePopupOpen, setLecturePopupOpen] = useState(false)
  const [linksVisible, setLinksVisible] = useState(true)
  const [isPopupOpen, setPopupOpen] = useState(false);
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

  // Emit Phaser translations to the game scene whenever language changes
  useEffect(() => {
    const translations = {
      pressEToOpen: t('phaser.pressEToOpen'),
      openCloset: t('phaser.openCloset'),
      pressE: t('phaser.pressE')
    }

    // Save the latest translations so Phaser can read them
    window.__translations = translations

    EventBus.emit('translations-updated', translations)
  }, [language, t])

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
      <LanguageSelector />
      <h1 className="app-title">{t('app.title')}</h1>

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
            {t('startScreen.subtitle')}
          </p>

          <button className="start-button" onClick={() => setGameStarted(true)}>
            {t('startScreen.startButton')}
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
            {linksVisible && (
              <ul>
                <li>
                  <a
                    href="https://consteril.com/biosafety-levels-difference/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('lecturePanel.links.link1')}
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.ncbi.nlm.nih.gov/books/NBK535351/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('lecturePanel.links.link2')}
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.sciencedirect.com/science/chapter/monograph/pii/B9780128092316000119"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('lecturePanel.links.link3')}
                  </a>
                </li>
              </ul>
            )}
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
