import {
  stuckStage,
  STUCK_THRESHOLDS_MS,
  FIRST_ROUND_STUCK_THRESHOLDS_MS,
} from '../src/utils/stuckStage'

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

  // The zero-length 'verbal' fuse this replaces made NextStepHud a permanent
  // bar for the whole first round, so the staying-silent case is the point of
  // this test, not an edge case beside it.
  test('the exported guided-first-round thresholds stay silent at first, then escalate', () => {
    expect(stuckStage(0, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('subtle')
    expect(stuckStage(4_999, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('subtle')
    expect(stuckStage(5_000, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('verbal')
    expect(stuckStage(500_000, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('verbal')
  })
})
