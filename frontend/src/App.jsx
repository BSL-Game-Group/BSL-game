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
import { unequipAll } from './components/ClosetPopup/ItemConfig'
import { loadSavedGame, patchSavedGame, flushSavedGame, clearSavedGame } from './state/savedGame'

const initialEquipment = {
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
}

function App() {
  const { t, language } = useTranslation()

  // Read once, before first paint: a valid snapshot means the game was already
  // started, so the start screen must never appear for a returning player.
  const [restored] = useState(() => loadSavedGame())

  const [gameStarted, setGameStarted] = useState(restored !== null)
  const [lectureOpen, setLectureOpen] = useState(restored?.progress.lectureVisited ?? false)
  const [isPopupOpen, setPopupOpen] = useState(restored?.popups.closet ?? false)
  const [isLecturePopupOpen, setLecturePopupOpen] = useState(
    restored?.popups.lectureMaterials ?? false
  )
  const [materialsUnlocked, setMaterialsUnlocked] = useState(
    restored?.progress.materialsUnlocked ?? false
  )
  const [answerOpen, setAnswerOpen] = useState(restored?.popups.answer ?? false)
  const [answerLevel, setAnswerLevel] = useState(restored?.popups.answerLevel ?? '')
  const [currentMicrobe, setCurrentMicrobe] = useState(restored?.microbe ?? null)
  const [infoOpen, setInfoOpen] = useState(restored?.popups.info ?? false)
  const [lectureWarningOpen, setLectureWarningOpen] = useState(
    restored?.popups.lectureWarning ?? false
  );
  const [airlockWashWarningOpen, setAirlockWashWarningOpen] = useState(
    restored?.popups.airlockWarning ?? false
  );
  // The single owner of worn PPE. Its shape comes from EQUIPMENT_CONFIG rather
  // than a hand-written literal, so it cannot drift from the real item list.
  const [equipped, setEquipped] = useState(restored?.equipped ?? unequipAll())
  const [awaitingUndress, setAwaitingUndress] = useState(
    restored?.progress.awaitingUndress ?? false
  )
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  // Neither is persisted, same as exitConfirmOpen — a reload should not leave
  // the player stuck mid-confirmation or mid-suiting-up.
  const [bsl4ConfirmOpen, setBsl4ConfirmOpen] = useState(false)
  const [bsl4SuitOpen, setBsl4SuitOpen] = useState(false)
  const [bsl4NotReadyOpen, setBsl4NotReadyOpen] = useState(false)
  const [ventilationConnected, setVentilationConnected] = useState(
    restored?.progress.ventilationConnected ?? false
  )


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

  // Soft reminder only — shown as soon as the player steps into airlock2
  // (coming out of BSL4), nudging them to decon before continuing. It doesn't
  // block movement or gate anything.
  useEffect(() => {
    const handler = () => setAirlockWashWarningOpen(true);

    window.addEventListener('airlock-wash-reminder', handler);

    return () =>
      window.removeEventListener('airlock-wash-reminder', handler);
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

  // App owns the worn-PPE state, so it is also what tells Phaser to redraw the
  // character.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('equipment-changed', { detail: equipped }))
  }, [equipped])

  // The quick-undress interactable lives in the dressing room (Phaser), so this
  // must work whether or not the closet is currently open.
  useEffect(() => {
    const handler = () => setEquipped(unequipAll())
    window.addEventListener('quick-undress', handler)
    return () => window.removeEventListener('quick-undress', handler)
  }, [])

  // The BSL4 airlock decon point resets worn PPE too, but on its own event —
  // unlike quick-undress, it must NOT satisfy App's "go wash up at the
  // dressing room" requirement, so it's kept separate from quick-undress. It
  // also unplugs the ventilation hookup, mirroring taking the suit off.
  useEffect(() => {
    const handler = () => {
      setEquipped(unequipAll())
      setVentilationConnected(false)
    }
    window.addEventListener('airlock-decon', handler)
    return () => window.removeEventListener('airlock-decon', handler)
  }, [])

  // Connecting requires the pressurized suit already worn; pressing the spot
  // again always disconnects. Depends on `equipped` so the handler always
  // sees the current suit state.
  useEffect(() => {
    const handler = () => {
      setVentilationConnected((connected) => {
        if (connected) {
          return false
        }
        return Boolean(equipped.pressurized_suit)
      })
    }
    window.addEventListener('ventilation-toggle-requested', handler)
    return () => window.removeEventListener('ventilation-toggle-requested', handler)
  }, [equipped])

  // BSL4 needs the suit, gloves and a live ventilation hookup before the
  // microbe can be handled — Phaser reads this global the same way it already
  // reads window.__lectureOpen.
  const bsl4Ready = Boolean(equipped.pressurized_suit) && Boolean(equipped.gloves) && ventilationConnected
  useEffect(() => { window.__bsl4Ready = bsl4Ready }, [bsl4Ready])
  useEffect(() => {
    const handler = () => setBsl4NotReadyOpen(true)
    window.addEventListener('bsl4-not-ready', handler)
    return () => window.removeEventListener('bsl4-not-ready', handler)
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
    const handleExitOpen = () => {
      setExitConfirmOpen(true)
      window.dispatchEvent(new Event('popup-opened'))
    }
    window.addEventListener('exit-popup-opened', handleExitOpen)
    return () => window.removeEventListener('exit-popup-opened', handleExitOpen)
  }, [])
  useEffect(() => {
    const handleBsl4EntryConfirm = () => {
      setBsl4ConfirmOpen(true)
      window.dispatchEvent(new Event('popup-opened'))
    }
    window.addEventListener('bsl4-entry-confirm-opened', handleBsl4EntryConfirm)
    return () =>
      window.removeEventListener('bsl4-entry-confirm-opened', handleBsl4EntryConfirm)
  }, [])
  useEffect(() => {
    const translations = {
      pressEToOpen: t('phaser.pressEToOpen'),
      openCloset: t('phaser.openCloset'),
      pressE: t('phaser.pressE'),
      exitPrompt: t('phaser.exitPrompt'),
      washUp: t('phaser.washUp'),
      airlockWash: t('phaser.airlockWash'),
    }
    window.__translations = translations
    EventBus.emit('translations-updated', translations)
  }, [language, t])

  // One writer for all of App's persisted state. Gated on gameStarted: a valid
  // snapshot means "started", so writing one while a first-time visitor sits on
  // the start screen would make the start screen unreachable forever.
  useEffect(() => {
    if (!gameStarted) {
      return
    }
    patchSavedGame({
      equipped,
      microbe: currentMicrobe,
      progress: {
        lectureVisited: lectureOpen,
        materialsUnlocked,
        awaitingUndress,
        ventilationConnected,
      },
      popups: {
        closet: isPopupOpen,
        lectureMaterials: isLecturePopupOpen,
        info: infoOpen,
        answer: answerOpen,
        answerLevel,
        lectureWarning: lectureWarningOpen,
        airlockWarning: airlockWashWarningOpen,
      },
    })
  }, [
    gameStarted,
    equipped,
    currentMicrobe,
    lectureOpen,
    materialsUnlocked,
    awaitingUndress,
    ventilationConnected,
    isPopupOpen,
    isLecturePopupOpen,
    infoOpen,
    answerOpen,
    answerLevel,
    lectureWarningOpen,
    airlockWashWarningOpen,
  ])

  // The scene's position writes are throttled, so make sure a pending one lands
  // before the page goes away.
  useEffect(() => {
    const flush = () => flushSavedGame()
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  // TEMPORARY (for testing the saved-game work): throw away the snapshot and put
  // every piece of state back to its start-screen value. Dropping gameStarted
  // unmounts the Phaser game, so restarting builds a fresh scene.
  const resetGameState = () => {
    clearSavedGame()
    setGameStarted(false)
    setLectureOpen(false)
    setPopupOpen(false)
    setLecturePopupOpen(false)
    setMaterialsUnlocked(false)
    setAnswerOpen(false)
    setAnswerLevel('')
    setCurrentMicrobe(null)
    setInfoOpen(false)
    setLectureWarningOpen(false)
    setAirlockWashWarningOpen(false)
    setEquipped(unequipAll())
    setAwaitingUndress(false)
    setVentilationConnected(false)
    setExitConfirmOpen(false)
    setBsl4ConfirmOpen(false)
    setBsl4SuitOpen(false)
    setBsl4NotReadyOpen(false)
    window.dispatchEvent(new Event('popup-closed'))
  }

  // --- LOGIC ---
  const correctLevel = currentMicrobe?.bsl_level
  const chosenLevel = Number(String(answerLevel).replace('BSL-', ''))
  const isLevelCorrect = typeof correctLevel === 'number' && chosenLevel === correctLevel
  const equipmentRules = getEquipmentRulesForBslLevel(chosenLevel)
  const chosenEquipment = Object.keys(equipped).filter((item) => equipped[item])
  const isEquipmentCorrect = evaluateEquipmentRules(equipmentRules, chosenEquipment)
  const isCorrect = isLevelCorrect && isEquipmentCorrect

  // Handling a microbe always requires a trip to the dressing room's wash-up
  // spot afterward — whether or not any PPE was actually worn — before the
  // next microbe is handed out.
  const handleAnswerClose = () => {
    setAnswerOpen(false)
    setAwaitingUndress(true)
    EventBus.emit('undress-required')
  }

  const handleExitCancel = () => {
    setExitConfirmOpen(false)
    window.dispatchEvent(new Event('popup-closed'))
  }

  const handleExitConfirm = () => {
    resetGameState()
  }

  const handleBsl4ConfirmNo = () => {
    setBsl4ConfirmOpen(false)
    window.dispatchEvent(new Event('popup-closed'))
  }

  // Movement stays locked straight through into the suiting station — no
  // popup-closed in between, since a modal is about to take over again.
  const handleBsl4ConfirmYes = () => {
    setBsl4ConfirmOpen(false)
    setBsl4SuitOpen(true)
  }

  useEffect(() => {
    const handleWashUp = () => {
      if (awaitingUndress) {
        setAwaitingUndress(false)
        EventBus.emit('request-new-microbe')
      }
    }
    window.addEventListener('quick-undress', handleWashUp)
    return () => window.removeEventListener('quick-undress', handleWashUp)
  }, [awaitingUndress])

  return (
    <Container fluid className="h-100">
      <Row className="h-100">
      <Col xs={3}>
      <h1 className="app-title">{t('app.title')}</h1>
      <LanguageSelector />
                  {/* SIDEBAR */}
          {lectureOpen && (
            <Col lg={3} md={4} xs={12} className="mb-3 w-100">
              <div
                  className="lecture-panel"
                  data-testid="lecture-panel"
              >
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
        equipped={equipped}
        setEquipped={setEquipped}
        itemFilter={(id) => id !== 'pressurized_suit'}
      />
      <ClosetPopup
        open={bsl4SuitOpen}
        onClose={() => setBsl4SuitOpen(false)}
        equipped={equipped}
        setEquipped={setEquipped}
        itemFilter={(id) => id === 'pressurized_suit' || id === 'gloves'}
        title={t('bsl4Suit.title')}
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
        equipment={equipped}
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
      {airlockWashWarningOpen && (
        <div className="popup-overlay">
          <div className="popup-box popup-box--incorrect">
            <button className="popup-close-button" onClick={() => setAirlockWashWarningOpen(false)}>
              {t('common.close')}
            </button>
            <h2>{t('airlockWashRequired.title')}</h2>
            <p>{t('airlockWashRequired.message')}</p>
          </div>
        </div>
      )}
      {bsl4NotReadyOpen && (
        <div className="popup-overlay">
          <div className="popup-box popup-box--incorrect">
            <button className="popup-close-button" onClick={() => setBsl4NotReadyOpen(false)}>
              {t('common.close')}
            </button>
            <h2>{t('bsl4NotReady.title')}</h2>
            <p>{t('bsl4NotReady.message')}</p>
          </div>
        </div>
      )}
      {bsl4ConfirmOpen && (
        <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="bsl4-entry-confirm-title">
          <div className="popup-box popup-box--incorrect">
            <h2 id="bsl4-entry-confirm-title">{t('bsl4EntryConfirm.title')}</h2>
            <p>{t('bsl4EntryConfirm.message')}</p>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={handleBsl4ConfirmNo}>
                {t('bsl4EntryConfirm.no')}
              </button>
              <button className="btn btn-danger" onClick={handleBsl4ConfirmYes}>
                {t('bsl4EntryConfirm.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
      {exitConfirmOpen && (
        <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="exit-confirm-title">
          <div className="popup-box popup-box--incorrect">
            <h2 id="exit-confirm-title">{t('exitConfirm.title')}</h2>
            <p>{t('exitConfirm.message')}</p>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-secondary" onClick={handleExitCancel}>
                {t('exitConfirm.no')}
              </button>
              <button className="btn btn-danger" onClick={handleExitConfirm}>
                {t('exitConfirm.yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export default App