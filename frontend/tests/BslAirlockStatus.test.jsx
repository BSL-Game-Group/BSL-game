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
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': false }} ventilationConnected={false} />
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
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': false }} ventilationConnected />
  )
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})

test('renders nothing while suppressed', () => {
  render(
    <BslAirlockStatus roomKey="BSL-4" doorOpen={{ 'BSL-4': true }} ventilationConnected={false} suppressed />
  )
  expect(screen.queryByTestId('bsl-airlock-status')).not.toBeInTheDocument()
})
