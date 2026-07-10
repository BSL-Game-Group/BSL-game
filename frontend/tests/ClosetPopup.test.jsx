import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClosetPopup from '../src/components/ClosetPopup/ClosetPopup'

// -----------------------------
// HELPERS
// -----------------------------
function renderPopup(open = true, onClose = jest.fn()) {
  return render(<ClosetPopup open={open} onClose={onClose} />)
}

describe('ClosetPopup component', () => {
  test('does not render when closed', () => {
    renderPopup(false)

    expect(screen.queryByText(/equipment/i)).not.toBeInTheDocument()
  })

  test('renders when open', () => {
    renderPopup(true)

    expect(screen.getByText(/equipment/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()

    renderPopup(true, onClose)

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // -----------------------------
  // EVENT TESTS (FIXED: more reliable + less brittle)
  // -----------------------------

  test('dispatches popup-opened event when mounted', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    renderPopup(true)

    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'popup-opened' })
    )

    spy.mockRestore()
  })

  test('dispatches popup-closed event when closed via rerender', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    const { rerender } = renderPopup(true)

    rerender(<ClosetPopup open={false} onClose={jest.fn()} />)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'popup-closed' })
    )

    spy.mockRestore()
  })

  test('dispatches equipment-changed event on mount', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    renderPopup(true)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'equipment-changed' })
    )

    spy.mockRestore()
  })

  test('handles equipment-changed event update', () => {
    renderPopup(true)

    act(() => {
      window.dispatchEvent(
        new CustomEvent('equipment-changed', {
          detail: {
            mask: true,
            lab_coat: true,
            glasses: false,
          },
        })
      )
    })

    // UI should still exist after state update
    expect(screen.getByText(/equipment/i)).toBeInTheDocument()
  })

  // -----------------------------
  // UI TESTS
  // -----------------------------

  test('shows each item under its own tab', () => {
    renderPopup(true)

    // Eyewear is the default (lowest-order) tab.
    expect(screen.getAllByAltText(/glasses/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /^masks$/i }))
    expect(screen.getAllByAltText(/mask/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /^body$/i }))
    expect(screen.getAllByAltText(/lab_coat/i).length).toBeGreaterThan(0)
  })

  test('renders a tab per category in order', () => {
    const { container } = renderPopup(true)

    const labels = [...container.querySelectorAll('.gear-tab')].map((el) => el.textContent)
    expect(labels).toEqual(['Eyewear', 'Masks', 'Body', 'Gloves'])
  })

  test('empty Gloves tab shows the empty state', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^gloves$/i }))
    expect(screen.getByText(/no gloves available yet/i)).toBeInTheDocument()
  })

  test('renders player heading', () => {
    renderPopup(true)

    expect(screen.getByText(/player/i)).toBeInTheDocument()
  })

  test('renders base character image', () => {
    renderPopup(true)

    expect(screen.getByAltText('base')).toBeInTheDocument()
  })
})