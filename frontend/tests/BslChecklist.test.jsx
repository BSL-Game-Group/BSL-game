import { render, screen } from './test-utils'
import '@testing-library/jest-dom'
import BslChecklist from '../src/components/BslChecklist'
import { unequipAll } from '../src/components/ClosetPopup/ItemConfig'

test('renders nothing without a room key', () => {
  render(<BslChecklist roomKey={null} equipped={unequipAll()} />)
  expect(screen.queryByTestId('bsl-checklist')).not.toBeInTheDocument()
})

test('renders nothing while suppressed, even when under-equipped', () => {
  render(<BslChecklist roomKey="BSL-1" equipped={unequipAll()} suppressed />)
  expect(screen.queryByTestId('bsl-checklist')).not.toBeInTheDocument()
})

test('lists the missing items for the room the player is standing in', () => {
  render(<BslChecklist roomKey="BSL-1" equipped={unequipAll()} />)

  const checklist = screen.getByTestId('bsl-checklist')
  expect(checklist).toHaveTextContent('BSL-1 — missing:')
  expect(checklist).toHaveTextContent('Lab coat')
  expect(checklist).toHaveTextContent('Glasses')
  expect(checklist).toHaveTextContent('Gloves')
})

test('renders nothing once the player is correctly equipped for the room', () => {
  const equipped = {
    ...unequipAll(),
    lab_coat: true,
    glasses: true,
    gloves: true,
    indoor_shoes: true,
  }

  render(<BslChecklist roomKey="BSL-1" equipped={equipped} />)

  expect(screen.queryByTestId('bsl-checklist')).not.toBeInTheDocument()
})

test('only lists what is still missing as the player suits up', () => {
  const equipped = { ...unequipAll(), lab_coat: true }

  render(<BslChecklist roomKey="BSL-1" equipped={equipped} />)

  const checklist = screen.getByTestId('bsl-checklist')
  expect(checklist).not.toHaveTextContent('Lab coat')
  expect(checklist).toHaveTextContent('Glasses')
  expect(checklist).toHaveTextContent('Gloves')
})
