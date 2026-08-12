import { render, screen, fireEvent } from './test-utils'
import '@testing-library/jest-dom'
import MicrobeInfoPopup from '../src/components/MicrobeInfoPopup'

test('renders nothing when closed', () => {
  const { container } = render(<MicrobeInfoPopup open={false} onClose={() => {}} microbe={null} />)
  expect(container).toBeEmptyDOMElement()
})

test('renders microbe info when open', () => {
  const microbe = {
    common_name: 'E. coli',
    common_name_sv: 'E. coli',
    common_name_fi: 'E. coli',
    scientific_name: 'Escherichia coli',
    type: 'Bacterium',
    type_sv: 'Bakterie',
    type_fi: 'Bakteeri',
    lecture_text: 'Common gut bacterium',
    lecture_text_sv: 'Vanlig tarmbakterie',
    lecture_text_fi: 'Tavallinen suolistobakteeri',
  }

  render(<MicrobeInfoPopup open={true} onClose={() => {}} microbe={microbe} />)

  expect(screen.getByRole('heading', { name: /microbe information/i })).toBeInTheDocument()
  expect(screen.getByText(/common name/i)).toBeInTheDocument()
  expect(screen.getByText(/scientific name/i)).toBeInTheDocument()
  expect(screen.getByText(/type/i)).toBeInTheDocument()
  expect(screen.getByText(/description/i)).toBeInTheDocument()
  expect(screen.getByText('E. coli')).toBeInTheDocument()
  expect(screen.getByText('Escherichia coli')).toBeInTheDocument()
  expect(screen.getByText('Bacterium')).toBeInTheDocument()
  expect(screen.getByText('Common gut bacterium')).toBeInTheDocument()
})

test('close button calls onClose', () => {
  const onClose = jest.fn()
  const microbe = {
    common_name: 'E. coli',
    scientific_name: 'Escherichia coli',
    type: 'Bacterium',
    lecture_text: 'Common gut bacterium',
  }

  render(<MicrobeInfoPopup open={true} onClose={onClose} microbe={microbe} />)

  fireEvent.click(screen.getByRole('button', { name: /close/i }))
  expect(onClose).toHaveBeenCalledTimes(1)
})
