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
  // The single owner of worn PPE. Its shape comes from EQUIPMENT_CONFIG rather
  // than a hand-written literal, so it cannot drift from the real item list.
  const [equipped, setEquipped] = useState(restored?.equipped ?? unequipAll())
  const [awaitingUndress, setAwaitingUndress] = useState(
    restored?.progress.awaitingUndress ?? false
  )
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  // None of these are persisted, same as exitConfirmOpen — a reload should not
  // leave the player stuck mid-dialog.
  const [bsl4NotReadyOpen, setBsl4NotReadyOpen] = useState(false)
  // One popup for both directions — its title/message/buttons are picked at
  // render time from whether the suit is currently worn, so the same dialog
  // serves "put it on" (entering) and "take it off" (leaving).
  const [bsl4GearOpen, setBsl4GearOpen] = useState(false)
  const [bslDoorRequiredOpen, setBslDoorRequiredOpen] = useState(false)
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

  // BSL4 needs the suit, gloves and a live ventilation hookup before the
  // microbe can be handled — Phaser reads this global the same way it already
  // reads window.__lectureOpen. Computed early: several effects below (the
  // BSL4 door prompts) need it before they're declared.
  const bsl4Ready = Boolean(equipped.pressurized_suit) && Boolean(equipped.gloves) && ventilationConnected

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

  // Phaser reads this to decide whether the BSL4 door's E-press means "let me
  // in" or "let me out" once the player is already inside (handleBsl4DoorPress).
  useEffect(() => {
    window.__bsl4Suited = Boolean(equipped.pressurized_suit)
  }, [equipped.pressurized_suit])

  // Stepping into BSL-4 unsuited, or pressing the closed door back out while
  // still suited, both open the same gear popup — put it on, or take it off.
  useEffect(() => {
    const handler = () => setBsl4GearOpen(true)
    window.addEventListener('bsl4-suit-required', handler)
    window.addEventListener('bsl4-undress-required', handler)
    return () => {
      window.removeEventListener('bsl4-suit-required', handler)
      window.removeEventListener('bsl4-undress-required', handler)
    }
  }, [])

  // The suit cannot exist outside BSL-4 — Phaser fires this the instant the
  // player's position leaves the room while still suited (normally prevented
  // by the door, but this is the hard guarantee regardless of how they got out).
  useEffect(() => {
    const handler = () => {
      setEquipped((prev) => ({ ...prev, pressurized_suit: false }))
      setVentilationConnected(false)
      setBsl4GearOpen(false)
    }
    window.addEventListener('bsl4-suit-forced-off', handler)
    return () => window.removeEventListener('bsl4-suit-forced-off', handler)
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

  useEffect(() => { window.__bsl4Ready = bsl4Ready }, [bsl4Ready])
  useEffect(() => {
    const handler = () => setBsl4NotReadyOpen(true)
    window.addEventListener('bsl4-not-ready', handler)
    return () => window.removeEventListener('bsl4-not-ready', handler)
  }, [])
  // BSL3's airlock door must be closed too before handling a microbe there —
  // same idea as BSL4's door check, just without any suit/ventilation of its own.
  useEffect(() => {
    const handler = () => setBslDoorRequiredOpen(true)
    window.addEventListener('bsl-door-required', handler)
    return () => window.removeEventListener('bsl-door-required', handler)
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
    const translations = {
      pressEToOpen: t('phaser.pressEToOpen'),
      openCloset: t('phaser.openCloset'),
      pressE: t('phaser.pressE'),
      exitPrompt: t('phaser.exitPrompt'),
      washUp: t('phaser.washUp'),
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
    setEquipped(unequipAll())
    setAwaitingUndress(false)
    setVentilationConnected(false)
    setExitConfirmOpen(false)
    setBsl4NotReadyOpen(false)
    setBsl4GearOpen(false)
    setBslDoorRequiredOpen(false)
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

  // Taking the suit off also unplugs the ventilation — same as walking away
  // from it would mean physically. Note this does NOT hand out the next
  // microbe: BSL4 still requires a separate trip to the dressing room's
  // wash-up point afterward, same as everyone else.
  const handleToggleSuit = () => {
    if (equipped.pressurized_suit) {
      setEquipped((prev) => ({ ...prev, pressurized_suit: false }))
      setVentilationConnected(false)
    } else {
      setEquipped((prev) => ({ ...prev, pressurized_suit: true }))
    }
  }

  const handleToggleGloves = () => {
    setEquipped((prev) => ({ ...prev, gloves: !prev.gloves }))
  }

  const handleToggleVentilation = () => {
    window.dispatchEvent(new Event('ventilation-toggle-requested'))
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
      {bslDoorRequiredOpen && (
        <div className="popup-overlay">
          <div className="popup-box popup-box--incorrect">
            <button className="popup-close-button" onClick={() => setBslDoorRequiredOpen(false)}>
              {t('common.close')}
            </button>
            <h2>{t('bslDoorRequired.title')}</h2>
            <p>{t('bslDoorRequired.message')}</p>
          </div>
        </div>
      )}
      {bsl4GearOpen && (
        <div className="popup-overlay">
          <div className="popup-box popup-box--incorrect">
            <button className="popup-close-button" onClick={() => setBsl4GearOpen(false)}>
              {t('common.close')}
            </button>
            <h2>
              {equipped.pressurized_suit ? t('bsl4UndressRequired.title') : t('bsl4SuitRequired.title')}
            </h2>
            <p>
              {equipped.pressurized_suit ? t('bsl4UndressRequired.message') : t('bsl4SuitRequired.message')}
            </p>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-success" onClick={handleToggleSuit}>
                {equipped.pressurized_suit ? t('bsl4Gear.removeSuitButton') : t('bsl4Gear.wearSuitButton')}
              </button>
              <button className="btn btn-success" onClick={handleToggleGloves}>
                {equipped.gloves ? t('bsl4Gear.removeGlovesButton') : t('bsl4Gear.wearGlovesButton')}
              </button>
              {equipped.pressurized_suit && equipped.gloves && (
                <button className="btn btn-success" onClick={handleToggleVentilation}>
                  {ventilationConnected
                    ? t('bsl4Gear.disconnectVentilationButton')
                    : t('bsl4Gear.connectVentilationButton')}
                </button>
              )}
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