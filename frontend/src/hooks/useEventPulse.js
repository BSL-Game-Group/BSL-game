import { useEffect, useRef, useState } from 'react'

// True for durationMs after `eventName` fires on window, then false again.
// Re-firing the event while already active restarts the window rather than
// stacking — the reader only needs to know "still relevant", not a count.
export function useEventPulse(eventName, durationMs = 3000) {
  const [active, setActive] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const handler = () => {
      setActive(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setActive(false), durationMs)
    }

    window.addEventListener(eventName, handler)

    return () => {
      window.removeEventListener(eventName, handler)
      clearTimeout(timerRef.current)
    }
  }, [eventName, durationMs])

  return active
}
