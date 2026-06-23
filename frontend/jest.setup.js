import '@testing-library/jest-dom'

jest.mock('react-dnd', () => ({
  DndProvider: ({ children }) => children,
  useDrag: () => [
    { isDragging: false },
    jest.fn(),
  ],
  useDrop: () => [
    { isOver: false },
    jest.fn(),
  ],
}))

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}))