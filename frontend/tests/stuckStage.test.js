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

  test('becomes verbal at the second threshold', () => {
    expect(stuckStage(STUCK_THRESHOLDS_MS.verbal)).toBe('verbal')
    expect(stuckStage(STUCK_THRESHOLDS_MS.directional - 1)).toBe('verbal')
  })

  test('becomes directional at the third threshold and stays there', () => {
    expect(stuckStage(STUCK_THRESHOLDS_MS.directional)).toBe('directional')
    expect(stuckStage(STUCK_THRESHOLDS_MS.directional * 100)).toBe('directional')
  })

  test('accepts custom thresholds, e.g. the guided-first-round settings', () => {
    const firstRoundThresholds = { subtle: 0, verbal: 0, directional: 8_000 }

    expect(stuckStage(0, firstRoundThresholds)).toBe('verbal')
    expect(stuckStage(8_000, firstRoundThresholds)).toBe('directional')
  })

  test('the exported guided-first-round thresholds skip straight to verbal, then go directional at 8s', () => {
    expect(stuckStage(0, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('verbal')
    expect(stuckStage(7_999, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('verbal')
    expect(stuckStage(8_000, FIRST_ROUND_STUCK_THRESHOLDS_MS)).toBe('directional')
  })
})
