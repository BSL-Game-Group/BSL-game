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

jest.mock('phaser', () => ({
  Events: {
    EventEmitter: class {
      on = jest.fn()
      off = jest.fn()
      emit = jest.fn()
      once = jest.fn()
    }
  }
}));
