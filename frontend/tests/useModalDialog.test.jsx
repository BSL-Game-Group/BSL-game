import { render, screen, fireEvent } from './test-utils'
import '@testing-library/jest-dom'
import { useModalDialog } from '../src/hooks/useModalDialog'

// A minimal stand-in for a real popup: enough markup to exercise the focus
// trap without dragging any one popup's content into these tests.
function Dialog({ open, onClose }) {
  const dialogRef = useModalDialog(open, onClose)

  if (!open) {
    return null
  }

  return (
    <div role="dialog" aria-modal="true" ref={dialogRef} tabIndex={-1}>
      <button>first</button>
      <button>last</button>
    </div>
  )
}

test('tells the game to freeze while it is open, and to resume when it closes', () => {
  const events = []
  const record = (event) => events.push(event.type)

  window.addEventListener('popup-opened', record)
  window.addEventListener('popup-closed', record)

  const { rerender } = render(<Dialog open={false} onClose={() => {}} />)
  rerender(<Dialog open={true} onClose={() => {}} />)
  rerender(<Dialog open={false} onClose={() => {}} />)

  window.removeEventListener('popup-opened', record)
  window.removeEventListener('popup-closed', record)

  expect(events).toEqual(['popup-closed', 'popup-opened', 'popup-closed'])
})

test('closes on Escape', () => {
  const onClose = jest.fn()

  render(<Dialog open={true} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })

  expect(onClose).toHaveBeenCalledTimes(1)
})

test('ignores Escape once closed', () => {
  const onClose = jest.fn()

  const { rerender } = render(<Dialog open={true} onClose={onClose} />)
  rerender(<Dialog open={false} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })

  expect(onClose).not.toHaveBeenCalled()
})

test('moves focus into the dialog when it opens', () => {
  render(<Dialog open={true} onClose={() => {}} />)

  expect(screen.getByRole('dialog')).toHaveFocus()
})

test('keeps Tab from leaving the dialog', () => {
  render(<Dialog open={true} onClose={() => {}} />)

  const first = screen.getByRole('button', { name: 'first' })
  const last = screen.getByRole('button', { name: 'last' })

  // Forwards off the last control wraps to the first.
  last.focus()
  fireEvent.keyDown(window, { key: 'Tab' })
  expect(first).toHaveFocus()

  // Backwards off the first wraps to the last.
  fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
})
