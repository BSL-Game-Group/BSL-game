import MainScene from '../src/game/scenes/main_scene'
import Phaser from 'phaser'

/* -----------------------------
   FIXED PHASER MOCK
----------------------------- */
jest.mock('phaser', () => {
  const Phaser = {
    Scene: class {},
    Math: {
      Distance: {
        Between: jest.fn((x1, y1, x2, y2) =>
          Math.hypot(x2 - x1, y2 - y1)
        ),
      },
    },
    Input: {
      Keyboard: {
        JustDown: jest.fn(),
      },
    },
  }

  return Phaser
})

jest.mock('../src/game/scenes/rooms', () => ({
  createRooms: jest.fn(() => ({})),
}))

/* -----------------------------
   TEST SUITE
----------------------------- */
describe('Player movement', () => {
  let scene

  beforeEach(() => {
    scene = new MainScene()

    scene.player = {
      x: 640,
      y: 500,
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
    }

    scene.cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
    }

    scene.input = {
      activePointer: {
        x: 700,
        y: 500,
        isDown: false,
      },
    }

    scene.physics = {
      moveToObject: jest.fn(),
    }

    scene.playArea = {
      contains: jest.fn(() => true),
    }
  })

  test('moves left with keyboard', () => {
    scene.cursors.left.isDown = true
    scene.update()

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(-160)
  })

  test('moves right with keyboard', () => {
    scene.cursors.right.isDown = true
    scene.update()

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(160)
  })

  test('moves up with keyboard', () => {
    scene.cursors.up.isDown = true
    scene.update()

    expect(scene.player.setVelocityY).toHaveBeenCalledWith(-160)
  })

  test('moves down with keyboard', () => {
    scene.cursors.down.isDown = true
    scene.update()

    expect(scene.player.setVelocityY).toHaveBeenCalledWith(160)
  })

  test('moves toward mouse click', () => {
    scene.input.activePointer.isDown = true
    scene.update()

    expect(scene.physics.moveToObject).toHaveBeenCalledWith(
      scene.player,
      scene.input.activePointer,
      160
    )
  })

  test('does not move if mouse click is too close', () => {
    scene.playArea.contains.mockReturnValue(true)

    scene.input.activePointer = {
      x: 645,
      y: 505,
      isDown: true,
    }

    scene.update()

    expect(scene.physics.moveToObject).not.toHaveBeenCalled()
  })

  /* -----------------------------
     CLOSET / E-KEY TEST (FIXED)
  ----------------------------- */
  test('pressing E triggers closet popup event when inside dressing room', () => {
  const scene = new MainScene()

  scene.player = {
    x: 170,
    y: 565,
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
  }

  scene.cursors = {
    left: { isDown: false },
    right: { isDown: false },
    up: { isDown: false },
    down: { isDown: false },
  }

  scene.input = {
    activePointer: {
      x: 700,
      y: 500,
      isDown: false,
    },
  }

  scene.physics = {
    moveToObject: jest.fn(),
  }

  scene.playArea = {
    contains: jest.fn(() => true),
  }

  // IMPORTANT: UI mock (fix crash)
  scene.add = {
    text: jest.fn(() => ({
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setPosition: jest.fn(),
    })),
  }

  // IMPORTANT: prevent undefined crash
  scene.pressEText = {
    setVisible: jest.fn(),
    setPosition: jest.fn(),
  }

  scene.ppeRoomZone = {
    x: 20,
    y: 440,
    width: 280,
    height: 250,
  }

  Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

  const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

  scene.update()

  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'closet-popup-opened',
    })
  )

  dispatchSpy.mockRestore()
})
})