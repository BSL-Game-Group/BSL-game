import { useEffect, useState } from 'react'

const TICK_MS = 500

// Milliseconds since `key` last changed, capped at `stopAtMs`. Resets to 0
// whenever `key` changes (a new objective, a new room). Stops advancing while
// `paused` is true — reading a popup is not being stuck — and picks back up
// from where it left off once unpaused, rather than resetting.
//
// The cap matters: without it the interval kept firing for the whole session,
// re-rendering App twice a second long after the last threshold had passed and
// no further tick could change anything on screen.
export function useStuckTimer(key, paused, stopAtMs = Infinity) {
  // "Adjusting state during render" (React's own pattern for this): the key
  // change is caught and the clock zeroed synchronously in render, not in an
  // effect — an effect-based reset would flash one stale tick first.
  const [state, setState] = useState({ key, elapsedMs: 0 })

  if (state.key !== key) {
    setState({ key, elapsedMs: 0 })
  }

  const atCap = state.elapsedMs >= stopAtMs

  useEffect(() => {
    if (paused || atCap) {
      return
    }

    const interval = setInterval(() => {
      setState((s) => ({ ...s, elapsedMs: s.elapsedMs + TICK_MS }))
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [key, paused, atCap])

  return state.elapsedMs
}
