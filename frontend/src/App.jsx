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
  const [answerOpen, setAnswerOpen] = useState(false)
  const [answerLevel, setAnswerLevel] = useState('')
  const [currentMicrobe, setCurrentMicrobe] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [PlayerEquipment, setPlayerEquipment] = useState({
    mask: false,
    gloves: false,
    closable_lab_coat: false,
    disposable_overall: false,
    respirator: false,
    face_shield: false,
    lab_coat: false,
    glasses: false,
    sunglasses: false,
    pressurized_suit: false,
  })

  useEffect(() => {
    fetch('/api/test')
  }, [])

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

  // Emit Phaser translations whenever language changes
  useEffect(() => {
    const translations = {
      pressEToOpen: t('phaser.pressEToOpen'),
      openCloset: t('phaser.openCloset'),
      pressE: t('phaser.pressE'),
    }

    window.__translations = translations
    EventBus.emit('translations-updated', translations)
  }, [language, t])

  const correctLevel = currentMicrobe?.bsl_level
  const chosenLevel = Number(String(answerLevel).replace('BSL-', ''))
  const isCorrect =
    typeof correctLevel === 'number' && chosenLevel === correctLevel

  const handleAnswerClose = () => {
    setAnswerOpen(false)
    EventBus.emit('request-new-microbe')
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        paddingTop: '24px',
      }}
    >
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

          <button
            className="start-button"
            onClick={() => setGameStarted(true)}
          >
            {t('startScreen.startButton')}
          </button>

          <HowToPlay />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            data-testid="lecture-panel"
            style={{
              display: lectureOpen ? 'block' : 'none',
              width: 220,
            }}
          >
            <Task />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ margin: 0 }}>
                {t('lecturePanel.title')}
              </h2>

              <button
                onClick={() => setLecturePopupOpen((open) => !open)}
                style={{
                  marginLeft: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {isLecturePopupOpen
                  ? t('lecturePanel.hideButton')
                  : t('lecturePanel.showButton')}
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <ClosetPopup
              open={isPopupOpen}
              onClose={() => setPopupOpen(false)}
              onEquipmentChange={(newEquipment) => setPlayerEquipment(newEquipment)}
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
              equipment={PlayerEquipment}
            />

            <InfoPopup
              open={infoOpen}
              onClose={() => setInfoOpen(false)}
            />

            <Game />
          </div>
        </div>
      )}
    </div>
  )
}

export default App