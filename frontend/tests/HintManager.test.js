import HintManager from '../src/game/managers/HintManager';

describe('HintManager door hints', () => {
  let scene;
  let hintManager;
  let mockText;

  beforeEach(() => {
    jest.useFakeTimers();

    mockText = {
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
    };

    scene = {
      add: {
        text: jest.fn(() => ({ ...mockText })),
      },
      time: {
        delayedCall: jest.fn((delay, callback) => {
          setTimeout(callback, delay);
        }),
      },
    };

    hintManager = new HintManager(scene);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('showDoorHint', () => {
    test('shows hint with full opacity when door is openable', () => {
      const door = {
        x: 100,
        y: 200,
        isOpenable: jest.fn(() => true),
      };

      hintManager.showDoorHint(door);

      expect(hintManager.doorHint.setAlpha)
        .toHaveBeenCalledWith(1);

      expect(hintManager.doorHint.setVisible)
        .toHaveBeenCalledWith(true);

      expect(hintManager.doorHint.setPosition)
        .toHaveBeenCalledWith(100, 200);
    });

    test('shows hint with reduced opacity when door is not openable', () => {
      const door = {
        x: 100,
        y: 200,
        isOpenable: jest.fn(() => false),
      };

      hintManager.showDoorHint(door);

      expect(hintManager.doorHint.setAlpha)
        .toHaveBeenCalledWith(0.5);

      expect(hintManager.doorHint.setVisible)
        .toHaveBeenCalledWith(true);

      expect(hintManager.doorHint.setPosition)
        .toHaveBeenCalledWith(100, 200);
    });
  });

  describe('showDoorFeedback', () => {
    test('shows feedback at the expected position', () => {
      const door = {
        x: 500,
        y: 300,
      };

      hintManager.showDoorFeedback(door);

      expect(hintManager.doorFeedback.setVisible)
        .toHaveBeenCalledWith(true);

      expect(hintManager.doorFeedback.setPosition)
        .toHaveBeenCalledWith(500, 275);
    });

    test('caps x position at 1000', () => {
      const door = {
        x: 1500,
        y: 300,
      };

      hintManager.showDoorFeedback(door);

      expect(hintManager.doorFeedback.setPosition)
        .toHaveBeenCalledWith(1000, 275);
    });

    test('hides feedback after 3 seconds', () => {
      const door = {
        x: 500,
        y: 300,
      };

      hintManager.showDoorFeedback(door);

      expect(hintManager.doorFeedback.setVisible)
        .toHaveBeenCalledWith(true);

      jest.advanceTimersByTime(3000);

      expect(hintManager.doorFeedback.setVisible)
        .toHaveBeenCalledWith(false);
    });

    test('schedules a delayed hide callback', () => {
      const door = {
        x: 500,
        y: 300,
      };

      hintManager.showDoorFeedback(door);

      expect(scene.time.delayedCall).toHaveBeenCalledWith(
        3000,
        expect.any(Function),
        [],
        scene
      );
    });
  });
});
