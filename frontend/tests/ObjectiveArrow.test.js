import ObjectiveArrow from '../src/game/managers/ObjectiveArrow'

function createScene(overrides = {}) {
  const graphics = {
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    fillTriangle: jest.fn().mockReturnThis(),
  }

  return {
    add: { graphics: jest.fn(() => graphics) },
    player: { x: 0, y: 0 },
    isPopupOpen: false,
    lecturePoint: { x: 100, y: 0 },
    ...overrides,
  }
}

afterEach(() => {
  delete window.__objective
  delete window.__stuckStage
})

test('is hidden when the stuck stage is not directional', () => {
  window.__objective = { id: 'visit-lecture', target: 'lectureRoom' }
  window.__stuckStage = 'verbal'

  const scene = createScene()
  const arrow = new ObjectiveArrow(scene)
  arrow.update()

  expect(arrow.graphics.setVisible).toHaveBeenLastCalledWith(false)
  expect(arrow.graphics.fillTriangle).not.toHaveBeenCalled()
})

test('is hidden while a popup is open, even at the directional stage', () => {
  window.__objective = { id: 'visit-lecture', target: 'lectureRoom' }
  window.__stuckStage = 'directional'

  const scene = createScene({ isPopupOpen: true })
  const arrow = new ObjectiveArrow(scene)
  arrow.update()

  expect(arrow.graphics.setVisible).toHaveBeenLastCalledWith(false)
})

test('is hidden when there is no objective target (e.g. awaiting a microbe)', () => {
  window.__objective = { id: 'await-microbe', target: null }
  window.__stuckStage = 'directional'

  const scene = createScene()
  const arrow = new ObjectiveArrow(scene)
  arrow.update()

  expect(arrow.graphics.setVisible).toHaveBeenLastCalledWith(false)
})

test('is hidden when the target has no known world point yet', () => {
  window.__objective = { id: 'go-to-room', target: 'BSL-3' }
  window.__stuckStage = 'directional'

  const scene = createScene({ bslGlows: [] })
  const arrow = new ObjectiveArrow(scene)
  arrow.update()

  expect(arrow.graphics.setVisible).toHaveBeenLastCalledWith(false)
})

test('draws a triangle pointing at the target once directional and visible', () => {
  window.__objective = { id: 'visit-lecture', target: 'lectureRoom' }
  window.__stuckStage = 'directional'

  const scene = createScene()
  const arrow = new ObjectiveArrow(scene)
  arrow.update()

  expect(arrow.graphics.fillTriangle).toHaveBeenCalledTimes(1)
  expect(arrow.graphics.setVisible).toHaveBeenLastCalledWith(true)

  // Target is straight ahead on +x from the player at the origin: the tip
  // (first fillTriangle argument pair) must be further along +x than the
  // player, and roughly on the same y.
  const [tipX, tipY] = arrow.graphics.fillTriangle.mock.calls[0]
  expect(tipX).toBeGreaterThan(0)
  expect(Math.abs(tipY)).toBeLessThan(1)
})
