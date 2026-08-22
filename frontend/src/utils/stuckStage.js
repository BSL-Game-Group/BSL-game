// How long the player has been sitting on the same objective before the game
// starts nudging them, in milliseconds. A starting point, not a measured
// result — tune these after playtesting.
//
// Only 'verbal' currently changes anything on screen. 'directional' used to
// add an arrow pointing at the target, which was dropped as too much
// hand-holding; the stage is kept because it is the natural place for a
// stronger nudge if one is ever wanted, and removing it would mean rewriting
// both threshold tables and every caller for no behavioural gain.
export const STUCK_THRESHOLDS_MS = {
  subtle: 25_000,
  verbal: 60_000,
  directional: 120_000,
}

// Same escalation, shorter fuse — used only for the player's first round
// (see App.jsx's isGuidedFirstRound). 'subtle' starts immediately, but
// 'verbal' must not: NextStepHud renders from 'verbal' onward, so a zero
// threshold made the row appear on the first frame and never leave. The
// timer resets to zero on every objective change, which put it straight
// back at 'verbal' — a permanent bar rather than a nudge for a stuck player.
export const FIRST_ROUND_STUCK_THRESHOLDS_MS = {
  subtle: 0,
  verbal: 5_000,
  directional: 15_000,
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
