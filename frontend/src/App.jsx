import { useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
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
import { evaluateEquipmentRules, getEquipmentRulesForBslLevel } from './utils/equipmentRules'

function App() {
  const { t, language } = useTranslation()

  const [gameStarted, setGameStarted] = useState(false)
  const [lectureOpen, setLectureOpen] = useState(false)
  const [isPopupOpen, setPopupOpen] = useState(false)
  const [isLecturePopupOpen, setLecturePopupOpen] = useState(false)
  const [materialsUnlocked, setMaterialsUnlocked] = useState(false)
  const [answerOpen, setAnswerOpen] = useState(false)
  const [answerLevel, setAnswerLevel] = useState('')
  const [currentMicrobe, setCurrentMicrobe] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [lectureWarningOpen, setLectureWarningOpen] = useState(false);
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

  // --- HOOKS (Preserved from original) ---
  useEffect(() => { fetch('/api/test') }, [])
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
  useEffect(() => { window.__lectureOpen = lectureOpen }, [lectureOpen])
  useEffect(() => {
    const handler = () => setLectureWarningOpen(true);
    window.addEventListener('lecture-required', handler);
    return () => window.removeEventListener('lecture-required', handler);
  }, []);
  useEffect(() => {
    const handleUnlock = () => setMaterialsUnlocked(true);
    window.addEventListener('lecture-materials-unlocked', handleUnlock);
    return () => window.removeEventListener('lecture-materials-unlocked', handleUnlock);
  }, []);
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
  useEffect(() => {
    const translations = {
      pressEToOpen: t('phaser.pressEToOpen'),
      openCloset: t('phaser.openCloset'),
      pressE: t('phaser.pressE'),
    }
    window.__translations = translations
    EventBus.emit('translations-updated', translations)
  }, [language, t])

  // --- LOGIC ---
  const correctLevel = currentMicrobe?.bsl_level
  const chosenLevel = Number(String(answerLevel).replace('BSL-', ''))
  const isLevelCorrect = typeof correctLevel === 'number' && chosenLevel === correctLevel
  const equipmentRules = getEquipmentRulesForBslLevel(chosenLevel)
  const chosenEquipment = Object.keys(PlayerEquipment).filter((item) => PlayerEquipment[item])
  const isEquipmentCorrect = evaluateEquipmentRules(equipmentRules, chosenEquipment)
  const isCorrect = isLevelCorrect && isEquipmentCorrect

  const handleAnswerClose = () => {
    setAnswerOpen(false)
    EventBus.emit('request-new-microbe')
  }

  return (
    <Container fluid className="h-100">
      <Row className="h-100">
      <Col xs={3}>
      <h1 className="app-title">{t('app.title')}</h1>
      <LanguageSelector />
                  {/* SIDEBAR */}
          {lectureOpen && (
            <Col lg={3} md={4} xs={12} className="mb-3 w-100">
              <div className="lecture-panel">
                <Task />
                {materialsUnlocked && (
                  <div className="d-flex flex-column align-items-start gap-1 mt-2">
                    <h2 className="h5">{t('lecturePanel.title')}</h2>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => setLecturePopupOpen((open) => !open)}
                    >
                      {isLecturePopupOpen ? t('lecturePanel.hideButton') : t('lecturePanel.showButton')}
                    </button>
                  </div>
                )}
              </div>
            </Col>
          )}
      </Col>

      {!gameStarted ? (
        <div className="start-screen">
          <div className="microbe-field" aria-hidden="true">
            {[...Array(9)].map((_, i) => <span key={i} className="microbe"></span>)}
          </div>
          <p className="start-screen__subtitle">{t('startScreen.subtitle')}</p>
          <button className="start-button" onClick={() => setGameStarted(true)}>
            {t('startScreen.startButton')}
          </button>
          <HowToPlay />
        </div>
      ) : (
          <Col xs={9} className="h-100">
            {/* MAIN GAME */}
            <div className="game-wrapper-grid">
              {/* Only the game itself lives in the grid */}
              <Game />
            </div>
          </Col>
      )}

      </Row>

      {/* --- ALL POPUPS RENDERED AT ROOT LEVEL (Outside of the grid) --- */}
      <ClosetPopup
        open={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onEquipmentChange={setPlayerEquipment}
      />
      <SidebarPopup
        open={isLecturePopupOpen}
        onClose={() => setLecturePopupOpen(false)}
      />
      <InfoPopup
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
      <AnswerPopup
        open={answerOpen}
        onClose={handleAnswerClose}
        isCorrect={isCorrect}
        level={answerLevel}
        microbe={currentMicrobe}
        isLevelCorrect={isLevelCorrect}
        isEquipmentCorrect={isEquipmentCorrect}
        equipment={PlayerEquipment}
      />

      {lectureWarningOpen && (
        <div className="popup-overlay">
          <div className="popup-box popup-box--incorrect">
            <button className="popup-close-button" onClick={() => setLectureWarningOpen(false)}>
              {t('common.close')}
            </button>
            <h2>{t('lectureRequired.title')}</h2>
            <p>{t('lectureRequired.message')}</p>
          </div>
        </div>
      )}
    </Container>
  )
}

export default App