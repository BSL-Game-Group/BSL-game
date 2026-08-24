import { stuckStage, STUCK_THRESHOLDS_MS } from '../src/utils/stuckStage'

describe('stuckStage', () => {
  test('is silent right after the objective changes', () => {
    expect(stuckStage(0)).toBe('silent')
    expect(stuckStage(STUCK_THRESHOLDS_MS.subtle - 1)).toBe('silent')
  })

  test('becomes subtle at the first threshold', () => {
    expect(stuckStage(STUCK_THRESHOLDS_MS.subtle)).toBe('subtle')
    expect(stuckStage(STUCK_THRESHOLDS_MS.verbal - 1)).toBe('subtle')
  })

  test('becomes verbal at the last threshold and stays there', () => {
    expect(stuckStage(STUCK_THRESHOLDS_MS.verbal)).toBe('verbal')
    expect(stuckStage(STUCK_THRESHOLDS_MS.verbal * 100)).toBe('verbal')
  })

  test('accepts custom thresholds', () => {
    const shortFuse = { subtle: 0, verbal: 8_000 }

    expect(stuckStage(0, shortFuse)).toBe('subtle')
    expect(stuckStage(8_000, shortFuse)).toBe('verbal')
  })

})
