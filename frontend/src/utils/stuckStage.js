// How long the player has been sitting on the same objective before the game
// starts nudging them, in milliseconds. A starting point, not a measured
// result — tune these after playtesting.
//
// 'subtle' draws nothing on its own; it only marks that the clock is running,
// and its threshold is what decides when 'verbal' starts counting.
export const STUCK_THRESHOLDS_MS = {
  subtle: 25_000,
  verbal: 45_000,
}

// Pure step function: given how long the current objective has been active
// (paused during popups, reset on objective or room change), returns which
// escalation stage the game is in right now.
export function stuckStage(elapsedMs, thresholds = STUCK_THRESHOLDS_MS) {
  if (elapsedMs >= thresholds.verbal) {
    return 'verbal'
  }
  if (elapsedMs >= thresholds.subtle) {
    return 'subtle'
  }
  return 'silent'
}
