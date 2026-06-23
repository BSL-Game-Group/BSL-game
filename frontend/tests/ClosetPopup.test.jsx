import { render, screen, fireEvent } from '@testing-library/react'
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
})