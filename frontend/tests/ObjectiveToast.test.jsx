import { render, screen, act } from './test-utils'
import '@testing-library/jest-dom'
import ObjectiveToast from '../src/components/ObjectiveToast'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  act(() => jest.runOnlyPendingTimers())
  jest.useRealTimers()
})

test('shows the current objective text', () => {
  render(<ObjectiveToast objective={{ id: 'visit-lecture', target: 'lectureRoom' }} />)

  expect(screen.getByRole('status')).toHaveTextContent('Next: visit the lecture')
})

test('interpolates the target room into the text', () => {
  render(
    <ObjectiveToast
      objective={{ id: 'go-to-room', target: 'BSL-3' }}
      roomLabel="BSL-3"
    />
  )

  expect(screen.getByRole('status')).toHaveTextContent('Next: go to BSL-3')
})

test('becomes visible when the objective id changes, then fades on its own', () => {
  const { rerender } = render(<ObjectiveToast objective={{ id: 'visit-lecture' }} />)

  expect(screen.getByRole('status').className).toContain('objective-toast--visible')

  act(() => jest.advanceTimersByTime(3300))

  expect(screen.getByRole('status').className).not.toContain('objective-toast--visible')

  rerender(<ObjectiveToast objective={{ id: 'suit-up' }} />)

  expect(screen.getByRole('status').className).toContain('objective-toast--visible')
})

test('does not re-show for the same objective id after fading out', () => {
  const { rerender } = render(<ObjectiveToast objective={{ id: 'visit-lecture' }} />)
  act(() => jest.advanceTimersByTime(3300))

  rerender(<ObjectiveToast objective={{ id: 'visit-lecture' }} />)

  expect(screen.getByRole('status').className).not.toContain('objective-toast--visible')
})

test('is hidden immediately while a popup is open, even for a new objective', () => {
  const { rerender } = render(<ObjectiveToast objective={{ id: 'visit-lecture' }} suppressed />)

  expect(screen.getByRole('status').className).not.toContain('objective-toast--visible')

  rerender(<ObjectiveToast objective={{ id: 'suit-up' }} suppressed={false} />)

  expect(screen.getByRole('status').className).toContain('objective-toast--visible')
})

test('renders nothing when there is no objective', () => {
  render(<ObjectiveToast objective={null} />)

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('has no skip button when onSkipGuide is not provided', () => {
  render(<ObjectiveToast objective={{ id: 'suit-up' }} />)

  expect(screen.queryByTestId('objective-toast-skip')).not.toBeInTheDocument()
})

test('clicking the skip button calls onSkipGuide', () => {
  const onSkipGuide = jest.fn()
  render(<ObjectiveToast objective={{ id: 'suit-up' }} onSkipGuide={onSkipGuide} />)

  screen.getByTestId('objective-toast-skip').click()

  expect(onSkipGuide).toHaveBeenCalledTimes(1)
})

// The faded-out toast stays mounted at opacity 0, so a button left in it
// would still be clickable over the game long after the text had gone.
test('drops the skip button once the toast has faded out', () => {
  const onSkipGuide = jest.fn()
  render(<ObjectiveToast objective={{ id: 'suit-up' }} onSkipGuide={onSkipGuide} />)

  expect(screen.getByTestId('objective-toast-skip')).toBeInTheDocument()

  // A toast carrying the skip button stays up longer than a plain one: 3.2s
  // is long enough to read a line, not to notice a button and decide.
  act(() => jest.advanceTimersByTime(3200))

  expect(screen.getByTestId('objective-toast-skip')).toBeInTheDocument()

  act(() => jest.advanceTimersByTime(7000))

  expect(screen.queryByTestId('objective-toast-skip')).not.toBeInTheDocument()
})

test('hides the skip button while a popup is open', () => {
  render(<ObjectiveToast objective={{ id: 'suit-up' }} suppressed onSkipGuide={jest.fn()} />)

  expect(screen.queryByTestId('objective-toast-skip')).not.toBeInTheDocument()
})

// resolveObjective builds a fresh objective object on every render and the
// stuck timer re-renders App twice a second. With the object as an effect
// dependency, each of those re-renders cleared the pending hide and the guard
// then returned before setting a new one, so the toast never faded.
test('still fades out while the parent re-renders with an equal objective', () => {
  const { rerender } = render(<ObjectiveToast objective={{ id: 'suit-up' }} />)

  expect(screen.getByRole('status').className).toContain('objective-toast--visible')

  // 8 x 500ms clears VISIBLE_MS (3200) with room to spare.
  for (let tick = 0; tick < 8; tick += 1) {
    act(() => jest.advanceTimersByTime(500))
    rerender(<ObjectiveToast objective={{ id: 'suit-up' }} />)
  }

  expect(screen.getByRole('status').className).not.toContain('objective-toast--visible')
})

// A popup opening mid-display used to clear the pending hide without arming a
// new one, so closing it on the same objective left the toast up for good.
test('a popup opening and closing mid-display does not pin the toast', () => {
  const objective = { id: 'suit-up' }
  const { rerender } = render(<ObjectiveToast objective={objective} />)

  act(() => jest.advanceTimersByTime(1000))
  rerender(<ObjectiveToast objective={objective} suppressed />)

  act(() => jest.advanceTimersByTime(1000))
  rerender(<ObjectiveToast objective={objective} suppressed={false} />)

  act(() => jest.advanceTimersByTime(5000))

  expect(screen.getByRole('status').className).not.toContain('objective-toast--visible')
})
