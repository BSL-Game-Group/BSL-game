import { useCallback, useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import Game from './Game.jsx'
import ClosetPopup from './components/ClosetPopup/ClosetPopup'
import MicrobeInfoPopup from './components/MicrobeInfoPopup'
import AnswerPopup from './components/AnswerPopup/AnswerPopup'
import LectureMaterialPopup from './components/LectureMaterialPopup'
import HowToPlay from './components/HowToPlay'
import InfoPopup from './components/InfoPopup/InfoPopup'
import LanguageSelector from './components/LanguageSelector'
import ScoreHud from './components/ScoreHud'
import AuthStatus from './auth/AuthStatus'
import EndPopup from './components/EndPopup'
import YourRounds from './auth/YourRounds'
import Leaderboard from './auth/Leaderboard'
import { EventBus } from './game/EventBus'
import { useTranslation } from './i18n/context'
import { evaluateEquipmentSlots, getEquipmentRulesForBslLevel } from './utils/equipmentRules'
import { unequipAll } from './components/ClosetPopup/ItemConfig'
import { useAuth } from './auth/context'
import roundsService from './services/rounds'
import { loadSavedGame, patchSavedGame, flushSavedGame, clearSavedGame, MAX_ROUND_ANSWERS } from './state/savedGame'

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
  const { token } = useAuth()

  // Read once, before first paint: a valid snapshot means the game was already
  // started, so the start screen must never appear for a returning player.
  const [restored] = useState(() => loadSavedGame())

  const [gameStarted, setGameStarted] = useState(restored !== null)
  const [lectureOpen, setLectureOpen] = useState(restored?.progress.lectureVisited ?? false)
  const [isPopupOpen, setPopupOpen] = useState(restored?.popups.closet ?? false)
  const [LectureMaterialOpen, setLectureMaterialOpen] = useState(
    restored?.popups.lectureMaterial ?? false
  )
  const [answerOpen, setAnswerOpen] = useState(restored?.popups.answer ?? false)
  const [answerLevel, setAnswerLevel] = useState(restored?.popups.answerLevel ?? '')
  const [currentMicrobe, setCurrentMicrobe] = useState(restored?.microbe ?? null)
  const [infoOpen, setInfoOpen] = useState(restored?.popups.info ?? false)
  const [microbeInfoOpen, setMicrobeInfoOpen] = useState(restored?.popups.microbeInfo ?? false)
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

  const [roundAnswers, setRoundAnswers] = useState(restored?.round.answers ?? [])
  const [openRoundId, setOpenRoundId] = useState(restored?.round.openRoundId ?? null)
  const [roundResult, setRoundResult] = useState(null)


  // --- HOOKS (Preserved from original) ---
  useEffect(() => { fetch('/api/test') }, [])
  useEffect(() => {
    const handleMicrobeUpdate = (microbe) => setCurrentMicrobe({ ...microbe })
    EventBus.on('current-microbe-updated', handleMicrobeUpdate)
    return () => EventBus.off('current-microbe-updated', handleMicrobeUpdate)
  }, [])
  useEffect(() => {
    const handler = () => setLectureWarningOpen(true);
    window.addEventListener('lecture-required', handler);
    return () => window.removeEventListener('lecture-required', handler);
  }, [])
  useEffect(() => {
    const handler = () => setLectureOpen(true)
    window.addEventListener('lecture-room-entered', handler)
    return () => window.removeEventListener('lecture-room-entered', handler)
  }, [])

  // Phaser's BSL interactables gate on this (rooms.js + BslInteraction.js) and
  // can't read React state, so the lecture visit has to be mirrored onto window.
  useEffect(() => { window.__lectureOpen = lectureOpen }, [lectureOpen])

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

  // Lock movement while the gear popup is up — otherwise the player can walk
  // out of BSL-4 with the arrow keys while it's still open, mid-decision.
  useEffect(() => {
    window.dispatchEvent(new Event(bsl4GearOpen ? 'popup-opened' : 'popup-closed'))
  }, [bsl4GearOpen])

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
    const handleMicrobeInfoOpen = () => setMicrobeInfoOpen(true)
    window.addEventListener('microbe-info-popup-opened', handleMicrobeInfoOpen)
    return () => window.removeEventListener('microbe-info-popup-opened', handleMicrobeInfoOpen)
  }, [])
  useEffect(() => {
    const handleLectureMaterialOpen = () => setLectureMaterialOpen(true)
    window.addEventListener('lecture-material-popup-opened', handleLectureMaterialOpen)
    return () => window.removeEventListener('lecture-material-popup-opened', handleLectureMaterialOpen)
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
      closeTheDoorBehindYouFirst: t('phaser.closeTheDoorBehindYouFirst'),
      exitPrompt: t('phaser.exitPrompt'),
      washUp: t('phaser.washUp'),
      openMicrobeInfoHint: t('phaser.openmicrobeInfoHint'),
    }
    window.__translations = translations
    EventBus.emit('translations-updated', translations)
  }, [language, t])

  // TEMPORARY (for testing the saved-game work): throw away the snapshot and put
  // every piece of state back to its start-screen value. Dropping gameStarted
  // unmounts the Phaser game, so restarting builds a fresh scene.
  const resetGameState = useCallback(() => {
    clearSavedGame()
    setGameStarted(false)
    setPopupOpen(false)
    setMicrobeInfoOpen(false)
    setLectureMaterialOpen(false)
    setAnswerOpen(false)
    setAnswerLevel('')
    setCurrentMicrobe(null)
    setInfoOpen(false)
    setLectureWarningOpen(false)
    setEquipped(unequipAll())
    setAwaitingUndress(false)
    setVentilationConnected(false)
    setExitConfirmOpen(false)
    setRoundAnswers([])
    setOpenRoundId(null)
    setRoundResult(null)
    setBsl4NotReadyOpen(false)
    setBsl4GearOpen(false)
    setBslDoorRequiredOpen(false)
    window.dispatchEvent(new Event('popup-closed'))
  }, [])

  // Listen for account deletion reset event
  useEffect(() => {
    const handleGameResetEvent = () => {
      resetGameState()
    }
    window.addEventListener('game-reset-state', handleGameResetEvent)
    return () => window.removeEventListener('game-reset-state', handleGameResetEvent)
  }, [resetGameState])

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
        awaitingUndress,
        ventilationConnected,
      },
      popups: {
        closet: isPopupOpen,
        lectureMaterial: LectureMaterialOpen,
        info: infoOpen,
        microbeInfo: microbeInfoOpen,
        answer: answerOpen,
        answerLevel,
        lectureWarning: lectureWarningOpen,
      },
      round: {
        openRoundId,
        answers: roundAnswers,
      },
    })
  }, [
    gameStarted,
    equipped,
    currentMicrobe,
    awaitingUndress,
    ventilationConnected,
    isPopupOpen,
    LectureMaterialOpen,
    infoOpen,
    microbeInfoOpen,
    answerOpen,
    answerLevel,
    lectureWarningOpen,
    openRoundId,
    roundAnswers,
  ])

  // The scene's position writes are throttled, so make sure a pending one lands
  // before the page goes away.
  useEffect(() => {
    const flush = () => flushSavedGame()
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])

  // --- LOGIC ---
  const correctLevel = currentMicrobe?.bsl_level
  const chosenLevel = Number(String(answerLevel).replace('BSL-', ''))
  const isLevelCorrect = typeof correctLevel === 'number' && chosenLevel === correctLevel
  const equipmentRules = getEquipmentRulesForBslLevel(chosenLevel)
  const chosenEquipment = Object.keys(equipped).filter((item) => equipped[item])
  // One evaluation feeds both the verdict and the rows, so they cannot contradict.
  const equipmentEvaluation = evaluateEquipmentSlots(equipmentRules, chosenEquipment)
  const isEquipmentCorrect = equipmentEvaluation.wrongCount === 0
  const isCorrect = isLevelCorrect && isEquipmentCorrect

  const roundScore = roundAnswers.filter((answer) => answer.correct).length

  // Handling a microbe always requires a trip to the dressing room's wash-up
  // spot afterward — whether or not any PPE was actually worn — before the
  // next microbe is handed out.
  const handleAnswerClose = () => {
    if (Number.isInteger(currentMicrobe?.id) && Number.isInteger(chosenLevel)) {
      setRoundAnswers((answers) =>
        answers.length >= MAX_ROUND_ANSWERS
          ? answers
          : [
              ...answers,
              {
                microbe_id: currentMicrobe.id,
                chosen_level: chosenLevel,
                chosen_equipment: chosenEquipment,
                correct: isCorrect,
                attempt: 1,
              },
            ]
      )
    }

    setAnswerOpen(false)
    setAwaitingUndress(true)
    EventBus.emit('undress-required')
  }

  const saveRoundSoFar = useCallback(async () => {
    if (roundAnswers.length === 0) {
      return
    }

    try {
      const result = await roundsService.saveRound(roundAnswers, token, openRoundId)

      setOpenRoundId(result.id)
      setRoundResult(result)
    } catch {
      // A failed save must not keep the player at the door. The answers stay in
      // the buffer and the next visit to the exit tries again.
      setRoundResult(null)
    }
  }, [roundAnswers, token, openRoundId])

  useEffect(() => {
    const handleExitOpen = () => {
      setExitConfirmOpen(true)
      window.dispatchEvent(new Event('popup-opened'))
      saveRoundSoFar()
    }
    window.addEventListener('exit-popup-opened', handleExitOpen)
    return () => window.removeEventListener('exit-popup-opened', handleExitOpen)
  }, [saveRoundSoFar])

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
      {!gameStarted ? (
        <div className="start-screen">
          <h1 className="app-title">{t('app.title')}</h1>
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
          <Col xs={12} className="h-100 d-flex justify-content-center align-items-center">
            {/* MAIN GAME - CENTERED & FULLSCREEN */}
            <div className="game-wrapper-grid">
              {/* Only the game itself lives in the grid */}
              <Game />
            </div>
          </Col>
      )}

      </Row>

      {/* HUD: Score (left) and Auth/Login (center-left), top of page */}
      <div className="position-fixed top-0 start-0 p-3 z-3 d-flex gap-3 align-items-start">
        {gameStarted && <ScoreHud score={roundScore} answered={roundAnswers.length} />}
        <AuthStatus />
      </div>

      {/* Language selector, top right. */}
      <div className="position-fixed top-0 end-0 p-3 z-3">
        <LanguageSelector />
      </div>

      {/* --- ALL POPUPS RENDERED AT ROOT LEVEL (Outside of the grid) --- */}
      <ClosetPopup
        open={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        equipped={equipped}
        setEquipped={setEquipped}
        itemFilter={(id) => id !== 'pressurized_suit'}
      />
      <MicrobeInfoPopup
        open={microbeInfoOpen}
        onClose={() => setMicrobeInfoOpen(false)}
        microbe={currentMicrobe}
      />
      <LectureMaterialPopup
        open={LectureMaterialOpen}
        onClose={() => setLectureMaterialOpen(false)}
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
        equipmentSlots={equipmentEvaluation.slots}
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
      <EndPopup
        open={exitConfirmOpen}
        round={roundResult}
        onKeepPlaying={handleExitCancel}
        onExit={handleExitConfirm}
      />
      <YourRounds />
      <Leaderboard />
    </Container>
  )
}

export default App