import { useEffect, useRef } from 'react'

// Everything a popup needs to behave like a modal dialog, in one place:
//
//   * tells the Phaser scene to freeze, so arrow keys and E don't drive the
//     character around behind the popup,
//   * closes on Escape,
//   * moves focus into the dialog when it opens,
//   * keeps Tab inside the dialog instead of letting it walk out into the
//     page behind it.
//
// Returns the ref to spread onto the dialog element, which also needs
// role="dialog", aria-modal="true" and tabIndex={-1} for the focus move to
// land somewhere.
export function useModalDialog(open, onClose) {
  const dialogRef = useRef(null)

  // The scene owns isPopupOpen and gates movement, doors and every E
  // interaction on it. Popups that skip this stay fully playable underneath.
  useEffect(() => {
    window.dispatchEvent(new Event(open ? 'popup-opened' : 'popup-closed'))
  }, [open])

  useEffect(() => {
    if (!open || !onClose) {
      return
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus()
    }
  }, [open])

  // The focusable list is read on each keypress rather than cached, because a
  // popup's controls change while it is open (a form expands, a button
  // appears once an answer is picked).
  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current

      if (!dialog) {
        return
      }

      const focusable = [...dialog.querySelectorAll(FOCUSABLE)]

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const outside = !dialog.contains(active)

      if (event.shiftKey && (active === first || active === dialog || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return dialogRef
}

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')
