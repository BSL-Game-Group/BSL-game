import { unequipAll } from '../components/ClosetPopup/ItemConfig'

export const SAVED_GAME_KEY = 'bsl-game.saved-state.v1'
export const SAVED_GAME_VERSION = 1
export const MAX_AGE_MS = 2 * 60 * 60 * 1000
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000
export const THROTTLE_MS = 500

const WORLD_WIDTH = 1280
const WORLD_HEIGHT = 720
const SPAWN_X = 590
const SPAWN_Y = 150

// The snapshot being maintained this session, or null when nothing is saved.
// Keeping it here means App and MainScene patch a shared object instead of each
// doing read-modify-write on the key and clobbering the other's fields.
let current = null
let throttleTimer = null
let pendingWrite = false

export function defaultSnapshot() {
  return {
    version: SAVED_GAME_VERSION,
    savedAt: 0,
    sessionId: null,
    player: { x: SPAWN_X, y: SPAWN_Y },
    equipped: unequipAll(),
    microbe: null,
    progress: {
      lectureVisited: false,
      materialsUnlocked: false,
      awaitingUndress: false,
      ventilationConnected: false,
    },
    popups: {
      closet: false,
      lectureMaterials: false,
      info: false,
      answer: false,
      answerLevel: '',
      lectureWarning: false,
    },
  }
}

// Storage can throw: Safari private mode, quota, disabled cookies. A game that
// cannot persist must still be playable, so every access is swallowed.
function readRaw() {
  try {
    return window.localStorage.getItem(SAVED_GAME_KEY)
  } catch {
    return null
  }
}

function writeRaw(text) {
  try {
    window.localStorage.setItem(SAVED_GAME_KEY, text)
  } catch {
    // Unpersisted this session; the in-memory snapshot still drives the game.
  }
}

function removeRaw() {
  try {
    window.localStorage.removeItem(SAVED_GAME_KEY)
  } catch {
    // Nothing to do.
  }
}

function writeCurrent() {
  if (current) {
    writeRaw(JSON.stringify(current))
  }
}

// One level deep, so `{ progress: { lectureVisited: true } }` does not wipe the
// other progress flags. `microbe` is exempt: a replacement (or null) always wins.
function mergeSnapshot(base, partial) {
  const next = { ...base }

  for (const [key, value] of Object.entries(partial)) {
    const mergeable =
      key !== 'microbe' && value !== null && typeof value === 'object' && !Array.isArray(value)

    next[key] = mergeable ? { ...base[key], ...value } : value
  }

  return next
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

// Returns a normalized snapshot, or null when the stored value must be thrown
// away. Structural problems (version, clock, position) reject the whole
// snapshot; soft fields degrade to their defaults so one bad field does not
// cost the player their game.
function validate(raw, now) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  if (raw.version !== SAVED_GAME_VERSION) {
    return null
  }
  if (!isNumber(raw.savedAt)) {
    return null
  }
  if (now - raw.savedAt > MAX_AGE_MS) {
    return null
  }
  if (raw.savedAt - now > MAX_CLOCK_SKEW_MS) {
    return null
  }

  const player = raw.player
  if (!player || !isNumber(player.x) || !isNumber(player.y)) {
    return null
  }
  if (player.x < 0 || player.x > WORLD_WIDTH || player.y < 0 || player.y > WORLD_HEIGHT) {
    return null
  }

  const base = defaultSnapshot()
  const equipped = {}
  for (const id of Object.keys(base.equipped)) {
    equipped[id] = raw.equipped?.[id] === true
  }

  const microbe =
    raw.microbe && typeof raw.microbe === 'object' && isNumber(raw.microbe.bsl_level)
      ? raw.microbe
      : null

  return {
    version: SAVED_GAME_VERSION,
    savedAt: raw.savedAt,
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : null,
    player: { x: player.x, y: player.y },
    equipped,
    microbe,
    progress: {
      lectureVisited: raw.progress?.lectureVisited === true,
      materialsUnlocked: raw.progress?.materialsUnlocked === true,
      awaitingUndress: raw.progress?.awaitingUndress === true,
      ventilationConnected: raw.progress?.ventilationConnected === true,
    },
    popups: {
      closet: raw.popups?.closet === true,
      lectureMaterials: raw.popups?.lectureMaterials === true,
      info: raw.popups?.info === true,
      answer: raw.popups?.answer === true,
      answerLevel: typeof raw.popups?.answerLevel === 'string' ? raw.popups.answerLevel : '',
      lectureWarning: raw.popups?.lectureWarning === true,
    },
  }
}

export function loadSavedGame(now = Date.now()) {
  const text = readRaw()

  if (text === null) {
    current = null
    return null
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    removeRaw()
    current = null
    return null
  }

  const snapshot = validate(parsed, now)

  if (snapshot === null) {
    removeRaw()
    current = null
    return null
  }

  current = snapshot
  return current
}

export function patchSavedGame(partial, now = Date.now()) {
  current = mergeSnapshot(current ?? defaultSnapshot(), partial)
  current.savedAt = now
  writeCurrent()
  return current
}

// Leading write plus one trailing write per window: the player sees their
// position saved instantly, and a burst of frames collapses into one extra write.
export function patchSavedGameThrottled(partial, now = Date.now()) {
  current = mergeSnapshot(current ?? defaultSnapshot(), partial)
  current.savedAt = now

  if (throttleTimer !== null) {
    pendingWrite = true
    return current
  }

  writeCurrent()

  throttleTimer = setTimeout(() => {
    throttleTimer = null
    if (pendingWrite) {
      pendingWrite = false
      writeCurrent()
    }
  }, THROTTLE_MS)

  return current
}

// Called every frame from MainScene.update(). Writing unconditionally would
// re-stamp savedAt forever on an idle open tab, and a snapshot that never goes
// stale can never expire — so an unchanged position is a no-op.
export function savePlayerPosition(x, y, now = Date.now()) {
  const nextX = Math.round(x)
  const nextY = Math.round(y)
  const previous = current?.player

  if (previous && Math.round(previous.x) === nextX && Math.round(previous.y) === nextY) {
    return current
  }

  return patchSavedGameThrottled({ player: { x: nextX, y: nextY } }, now)
}

export function flushSavedGame() {
  if (throttleTimer !== null) {
    clearTimeout(throttleTimer)
    throttleTimer = null
  }
  if (pendingWrite) {
    pendingWrite = false
    writeCurrent()
  }
}

export function clearSavedGame() {
  if (throttleTimer !== null) {
    clearTimeout(throttleTimer)
    throttleTimer = null
  }
  pendingWrite = false
  current = null
  removeRaw()
}
