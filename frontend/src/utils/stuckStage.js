// How long the player has been sitting on the same objective before the game
// starts nudging them, in milliseconds. A starting point, not a measured
// result — tune these after playtesting.
export const STUCK_THRESHOLDS_MS = {
  subtle: 25_000,
  verbal: 60_000,
  directional: 120_000,
}

// Same escalation, shorter fuse — used only for the player's first round
// (see App.jsx's isGuidedFirstRound). The 'subtle' stage is skipped entirely:
// its only effect elsewhere is gating when 'verbal' text starts counting, so
// setting it to 0 makes the verbal hint available immediately.
export const FIRST_ROUND_STUCK_THRESHOLDS_MS = {
  subtle: 0,
  verbal: 0,
  directional: 8_000,
}

// Pure step function: given how long the current objective has been active
// (paused during popups, reset on objective or room change), returns which
// escalation stage the game is in right now.
export function stuckStage(elapsedMs, thresholds = STUCK_THRESHOLDS_MS) {
  if (elapsedMs >= thresholds.directional) {
    return 'directional'
  }
  if (elapsedMs >= thresholds.verbal) {
    return 'verbal'
  }
  if (elapsedMs >= thresholds.subtle) {
    return 'subtle'
  }
  return 'silent'
}
