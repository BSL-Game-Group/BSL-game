import { render,act } from './test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'
import ClosetPopup from '../src/components/ClosetPopup/ClosetPopup'
import { unequipAll } from '../src/components/ClosetPopup/ItemConfig'

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

    expect(screen.getByRole('heading', { level: 2, name: /closet/i })).toBeInTheDocument()
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
    expect(screen.getByText(/eyewear/i)).toBeInTheDocument()
  })

  // -----------------------------
  // UI TESTS
  // -----------------------------

  test('shows each item as a button under its own tab', () => {
    renderPopup(true)

    expect(screen.getByRole('button', { name: /^glasses$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sunglasses$/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^masks$/i }))
    expect(screen.getByRole('button', { name: /^mask$/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^body$/i }))
    expect(screen.getByRole('button', { name: /^lab coat$/i })).toBeInTheDocument()
  })

  test('clicking an inventory item equips it (moves to character, aria-pressed becomes true)', () => {
    renderPopup(true)

    const glasses = screen.getByRole('button', { name: /^glasses$/i })
    expect(glasses).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(glasses)

    expect(screen.getByRole('button', { name: /^glasses$/i }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking a worn item unequips it (returns to inventory, aria-pressed false)', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^glasses$/i })) // equip
    const worn = screen.getByRole('button', { name: /^glasses$/i })
    expect(worn).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(worn)

    expect(screen.getByRole('button', { name: /^glasses$/i }))
      .toHaveAttribute('aria-pressed', 'false')
  })

  test('equipping a second eyewear item swaps out the first', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^glasses$/i }))    // equip glasses
    fireEvent.click(screen.getByRole('button', { name: /^sunglasses$/i })) // equip sunglasses -> swap

    expect(screen.getByRole('button', { name: /^sunglasses$/i }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^glasses$/i }))
      .toHaveAttribute('aria-pressed', 'false')
  })

  test('clothing items are exposed as keyboard-operable buttons', () => {
    renderPopup(true)

    const glasses = screen.getByRole('button', { name: /^glasses$/i })

    expect(glasses.tagName).toBe('BUTTON')
    expect(glasses).not.toBeDisabled()
  })

  // -----------------------------
  // MODAL ACCESSIBILITY
  // -----------------------------

  test('renders as a labelled modal dialog', () => {
    renderPopup(true)

    expect(screen.getByRole('dialog', { name: /closet/i })).toBeInTheDocument()
  })

  test('focuses the dialog when opened', async () => {
    renderPopup(true);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    })
  })

  test('pressing Escape calls onClose', () => {
    const onClose = jest.fn()
    renderPopup(true, onClose)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // -----------------------------
  // FOCUS TRAP
  // -----------------------------

  function focusableItems() {
    return [...screen.getByRole('dialog').querySelectorAll('button')]
  }

  test('Tab from the last control wraps to the first', () => {
    renderPopup(true)

    const buttons = focusableItems()
    const last = buttons[buttons.length - 1]
    act(() => last.focus())

    fireEvent.keyDown(window, { key: 'Tab' })

    expect(buttons[0]).toHaveFocus()
  })

  test('Shift+Tab from the first control wraps to the last', () => {
    renderPopup(true)

    const buttons = focusableItems()
    act(() => buttons[0].focus())

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })

    expect(buttons[buttons.length - 1]).toHaveFocus()
  })

  test('Shift+Tab from the dialog container wraps to the last control', async () => {
    renderPopup(true);
    const dialog = screen.getByRole('dialog');

    await waitFor(() => {
      expect(dialog).toHaveFocus();
    })

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

  })

  test('Tab pulls focus back in when it has drifted outside the dialog', () => {
    renderPopup(true)

    act(() => screen.getByRole('dialog').blur())
    expect(document.body).toHaveFocus()

    fireEvent.keyDown(window, { key: 'Tab' })

    expect(focusableItems()[0]).toHaveFocus()
  })

  // -----------------------------
  // FOCUS FOLLOWS EQUIP
  // -----------------------------

  test('focus follows an item onto the character when it is equipped', () => {
    renderPopup(true)

    const glasses = screen.getByRole('button', { name: /^glasses$/i })
    act(() => glasses.focus())

    fireEvent.click(glasses)

    expect(screen.getByRole('button', { name: /^glasses$/i })).toHaveFocus()
  })

  test('focus follows an item back to the inventory when it is unequipped', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^glasses$/i })) // equip
    const worn = screen.getByRole('button', { name: /^glasses$/i })

    fireEvent.click(worn) // unequip

    expect(screen.getByRole('button', { name: /^glasses$/i })).toHaveFocus()
  })

  test('unequipping into a hidden tab drops focus safely and the trap recovers it', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^glasses$/i })) // equip
    fireEvent.click(screen.getByRole('button', { name: /^gloves$/i }))  // hide eyewear
    fireEvent.click(screen.getByRole('button', { name: /^glasses$/i })) // unequip

    expect(document.body).toHaveFocus()

    fireEvent.keyDown(window, { key: 'Tab' })

    expect(focusableItems()[0]).toHaveFocus()
  })

  test('focus stays on the newly equipped item when it swaps another out', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^glasses$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^sunglasses$/i })) // swap

    expect(screen.getByRole('button', { name: /^sunglasses$/i })).toHaveFocus()
  })

  test('renders a tab per category in order', () => {
    const { container } = renderPopup(true)

    const labels = [...container.querySelectorAll('.gear-tab')].map((el) => el.textContent)
    expect(labels).toEqual(['Eyewear', 'Masks', 'Body', 'Gloves'])
  })

  test('Gloves tab shows the gloves item', () => {
    renderPopup(true)

    fireEvent.click(screen.getByRole('button', { name: /^gloves$/i }))
    // Items are exposed as buttons named via aria-label (the image is decorative),
    // so the glove items appear as buttons alongside the "Gloves" tab.
    expect(screen.getByRole('button', { name: /^gloves 2$/i })).toBeInTheDocument()
  })

  test('renders base character image', () => {
    renderPopup(true)

    expect(screen.getByAltText('base')).toBeInTheDocument()
  })

  // -----------------------------
  // QUICK UNDRESS (dressing-room "quick-undress" event) TESTS
  // -----------------------------
  // The interactable that triggers this lives in the Phaser dressing room, not
  // in this popup, so ClosetPopup only needs to react to the window event.

  test('resets all equipment when the quick-undress event fires while open', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    renderPopup(true)
    spy.mockClear()

    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })

    const lastEquipmentChange = spy.mock.calls
      .map((call) => call[0])
      .filter((event) => event.type === 'equipment-changed')
      .pop()

    expect(lastEquipmentChange.detail).toEqual(unequipAll())

    spy.mockRestore()
  })

  test('resets all equipment when the quick-undress event fires while closed', () => {
    const onEquipmentChange = jest.fn()

    render(
      <ClosetPopup open={false} onClose={jest.fn()} onEquipmentChange={onEquipmentChange} />
    )
    onEquipmentChange.mockClear()

    act(() => {
      window.dispatchEvent(new Event('quick-undress'))
    })

    expect(onEquipmentChange).toHaveBeenLastCalledWith(unequipAll())
  })

  // -----------------------------
  // AIRLOCK DECON ("airlock-decon" event) TESTS
  // -----------------------------
  // The BSL4 airlock decon point resets worn PPE too, but on its own event —
  // separate from quick-undress so it doesn't satisfy App's dressing-room gate.

  test('resets all equipment when the airlock-decon event fires', () => {
    const onEquipmentChange = jest.fn()

    render(
      <ClosetPopup open={false} onClose={jest.fn()} onEquipmentChange={onEquipmentChange} />
    )
    onEquipmentChange.mockClear()

    act(() => {
      window.dispatchEvent(new Event('airlock-decon'))
    })

    expect(onEquipmentChange).toHaveBeenLastCalledWith(unequipAll())
  })
})