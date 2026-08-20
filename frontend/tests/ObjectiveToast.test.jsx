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
