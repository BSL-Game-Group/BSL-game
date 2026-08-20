import { renderHook, act } from '@testing-library/react'
import { useStuckTimer } from '../src/hooks/useStuckTimer'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

test('starts at zero', () => {
  const { result } = renderHook(() => useStuckTimer('visit-lecture', false))

  expect(result.current).toBe(0)
})

test('advances while not paused', () => {
  const { result } = renderHook(() => useStuckTimer('visit-lecture', false))

  act(() => jest.advanceTimersByTime(2000))

  expect(result.current).toBe(2000)
})

test('does not advance while paused', () => {
  const { result } = renderHook(() => useStuckTimer('visit-lecture', true))

  act(() => jest.advanceTimersByTime(5000))

  expect(result.current).toBe(0)
})

test('resumes from where it left off after unpausing, rather than resetting', () => {
  const { result, rerender } = renderHook(
    ({ paused }) => useStuckTimer('visit-lecture', paused),
    { initialProps: { paused: false } }
  )

  act(() => jest.advanceTimersByTime(1000))
  expect(result.current).toBe(1000)

  rerender({ paused: true })
  act(() => jest.advanceTimersByTime(4000))
  expect(result.current).toBe(1000)

  rerender({ paused: false })
  act(() => jest.advanceTimersByTime(1000))
  expect(result.current).toBe(2000)
})

test('resets to zero when the key changes', () => {
  const { result, rerender } = renderHook(
    ({ key }) => useStuckTimer(key, false),
    { initialProps: { key: 'visit-lecture' } }
  )

  act(() => jest.advanceTimersByTime(3000))
  expect(result.current).toBe(3000)

  rerender({ key: 'suit-up' })
  expect(result.current).toBe(0)

  act(() => jest.advanceTimersByTime(1000))
  expect(result.current).toBe(1000)
})
