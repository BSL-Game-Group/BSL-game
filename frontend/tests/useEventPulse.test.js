import { renderHook, act } from '@testing-library/react'
import { useEventPulse } from '../src/hooks/useEventPulse'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

test('starts inactive', () => {
  const { result } = renderHook(() => useEventPulse('test-pulse-event'))
  expect(result.current).toBe(false)
})

test('becomes active when the event fires, then inactive after the duration', () => {
  const { result } = renderHook(() => useEventPulse('test-pulse-event', 1000))

  act(() => {
    window.dispatchEvent(new Event('test-pulse-event'))
  })
  expect(result.current).toBe(true)

  act(() => jest.advanceTimersByTime(1000))
  expect(result.current).toBe(false)
})

test('re-firing the event restarts the window instead of stacking', () => {
  const { result } = renderHook(() => useEventPulse('test-pulse-event', 1000))

  act(() => {
    window.dispatchEvent(new Event('test-pulse-event'))
  })
  act(() => jest.advanceTimersByTime(700))
  act(() => {
    window.dispatchEvent(new Event('test-pulse-event'))
  })
  act(() => jest.advanceTimersByTime(700))

  expect(result.current).toBe(true)

  act(() => jest.advanceTimersByTime(300))
  expect(result.current).toBe(false)
})
