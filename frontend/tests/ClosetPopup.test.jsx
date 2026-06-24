import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClosetPopup from '../src/components/ClosetPopup'

describe('ClosetPopup component', () => {
  test('does not render when closed', () => {
    render(<ClosetPopup open={false} onClose={jest.fn()} />)

    expect(
      screen.queryByText(/equipment/i)
    ).not.toBeInTheDocument()
  })

  test('renders when open', () => {
    render(<ClosetPopup open={true} onClose={jest.fn()} />)

    expect(
      screen.getByText(/equipment/i)
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /close/i })
    ).toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()

    render(<ClosetPopup open={true} onClose={onClose} />)

    fireEvent.click(
      screen.getByRole('button', { name: /close/i })
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('dispatches popup-opened event when open', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    render(<ClosetPopup open={true} onClose={jest.fn()} />)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'popup-opened' })
    )

    spy.mockRestore()
  })
  test('dispatches popup-closed event when closed', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    const { rerender } = render(
      <ClosetPopup open={true} onClose={jest.fn()} />
    )

    rerender(<ClosetPopup open={false} onClose={jest.fn()} />)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'popup-closed' })
    )

    spy.mockRestore()
  })
  test('dispatches equipment-changed event when component mounts', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    render(<ClosetPopup open={true} onClose={jest.fn()} />)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'equipment-changed' })
    )

    spy.mockRestore()
  })
  test('dispatches equipment-changed when state updates via event', () => {
    const spy = jest.spyOn(window, 'dispatchEvent')

    render(<ClosetPopup open={true} onClose={jest.fn()} />)

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

    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })

  test('renders inventory items when not equipped', () => {
    render(<ClosetPopup open={true} onClose={jest.fn()} />)

    expect(screen.getAllByAltText(/mask/i).length).toBeGreaterThan(0)
    expect(screen.getAllByAltText(/glasses/i).length).toBeGreaterThan(0)
    expect(screen.getAllByAltText(/lab_coat/i).length).toBeGreaterThan(0)
  })

  test('renders player heading', () => {
    render(<ClosetPopup open={true} onClose={jest.fn()} />)

    expect(screen.getByText(/player/i)).toBeInTheDocument()
  })

  test('renders base character image', () => {
    render(<ClosetPopup open={true} onClose={jest.fn()} />)

    expect(screen.getByAltText('base')).toBeInTheDocument()
  })
})