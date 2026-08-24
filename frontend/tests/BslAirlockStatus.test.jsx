import { render, screen } from './test-utils'
import '@testing-library/jest-dom'
import BslAirlockStatus from '../src/components/BslAirlockStatus'

test('renders nothing outside BSL-3 or BSL-4', () => {
  render(<BslAirlockStatus roomKey="BSL-1" doorOpen={{}} ventilationConnected />)
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('renders nothing without a room key', () => {
  render(<BslAirlockStatus roomKey={null} doorOpen={{}} ventilationConnected />)
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('warns when the BSL-3 airlock door is open', () => {
  render(<BslAirlockStatus roomKey="BSL-3" doorOpen={{ 'BSL-3': true }} ventilationConnected />)
  expect(screen.getByTestId('bsl-airlock-status')).toHaveTextContent(
    'The airlock door is open — close it first'
  )
})

test('warns about missing ventilation only in BSL-4', () => {
  render(
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': false }} ventilationConnected={false} suitOn />
  )
  expect(screen.getByTestId('bsl-airlock-status')).toHaveTextContent('Ventilation is not connected')
})

test('does not warn about ventilation in BSL-3', () => {
  render(
    <BslAirlockStatus roomKey="BSL-3" doorOpen={{ 'BSL-3': false }} ventilationConnected={false} />
  )
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('renders nothing once the door is closed and ventilation is on', () => {
  render(
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': false }} ventilationConnected suitOn />
  )
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('renders nothing while suppressed', () => {
  render(
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': true }} ventilationConnected={false} suitOn suppressed />
  )
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('warns when the pressurized suit is not on in BSL-4', () => {
  render(
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': false }} ventilationConnected suitOn={false} />
  )
  expect(screen.getByTestId('bsl-airlock-status')).toHaveTextContent(
    'The pressurized suit is not on'
  )
})

// BSL-3 has no suit, so its absence must not be reported there.
test('does not warn about the suit in BSL-3', () => {
  render(
    <BslAirlockStatus roomKey="BSL-3" doorOpen={{ 'BSL-3': false }} ventilationConnected suitOn={false} />
  )
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('lists suit, ventilation and door in the order they must be done', () => {
  render(
    <BslAirlockStatus
      roomKey="BSL-4"
      doorOpen={{ 'BSL-4': true }}
      ventilationConnected={false}
      suitOn={false}
    />
  )

  const rows = screen.getByTestId('bsl-airlock-status').textContent

  expect(rows.indexOf('suit')).toBeLessThan(rows.indexOf('Ventilation'))
  expect(rows.indexOf('Ventilation')).toBeLessThan(rows.indexOf('airlock door'))
})
