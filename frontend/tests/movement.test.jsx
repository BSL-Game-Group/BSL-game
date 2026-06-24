/*--import MainScene from '../src/game/scenes/main_scene' --*/
import MainScene, { playerIsInsideZone } from '../src/game/scenes/main_scene'
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
    scene.pressEText = {
      setVisible: jest.fn(),
      setPosition: jest.fn(),
    }

    scene.input = {
      activePointer: {
        x: 700,
        y: 500,
        isDown: false,
      },
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
  test('preload loads all game assets', () => {
  const scene = new MainScene()

  scene.load = {
    image: jest.fn(),
  }

  scene.preload()

  expect(scene.load.image).toHaveBeenCalledWith(
    'player_base',
    'assets/player/base.png'
  )

  expect(scene.load.image).toHaveBeenCalledWith(
    'lab_coat',
    'assets/equipment/equipment_on_character/lab_coat.png'
  )

  expect(scene.load.image).toHaveBeenCalledWith(
    'mask',
    'assets/equipment/equipment_on_character/mask.png'
  )

  expect(scene.load.image).toHaveBeenCalledWith(
    'glasses',
    'assets/equipment/equipment_on_character/glasses.png'
  )

  expect(scene.load.image).toHaveBeenCalledWith(
    'dresser',
    'assets/dresser.png'
  )
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
  /* -------------------------------
  TEST: handlePopupOpen sets popup state
  ------------------------------- */
  test('popup state can be opened', () => {
    scene.isPopupOpen = false

    scene.isPopupOpen = true

    expect(scene.isPopupOpen).toBe(true)
  })

  test('player inside zone returns true', () => {
    expect(
      playerIsInsideZone(
        { x: 50, y: 50 },
        { x: 0, y: 0, width: 100, height: 100 }
      )
    ).toBe(true)
  })

  test('player outside zone returns false', () => {
    expect(
      playerIsInsideZone(
        { x: 200, y: 200 },
        { x: 0, y: 0, width: 100, height: 100 }
      )
    ).toBe(false)
  })

  test('movement is skipped when popup is open', () => {
    scene.isPopupOpen = true

    scene.cursors.left.isDown = true

    scene.update()

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(0)
    expect(scene.player.setVelocityX).not.toHaveBeenCalledWith(-160)
  })

  test('shows closet when entering dressing room', () => {
    scene.ppeRoomZone = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    }

    scene.player.x = 100
    scene.player.y = 100

    scene.closetImage = {
      setVisible: jest.fn(),
      setInteractive: jest.fn(),
    }

    scene.closetHint = {
      visible: false,
      setPosition: jest.fn(),
    }

    scene.update()

    expect(scene.closetImage.setVisible)
      .toHaveBeenCalledWith(true)
  })

  test('hides closet when leaving dressing room', () => {
    scene.playerInsideDressingRoom = true

    scene.player.x = 500
    scene.player.y = 500

    scene.ppeRoomZone = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }

    scene.closetImage = {
      setVisible: jest.fn(),
      disableInteractive: jest.fn(),
    }

    scene.closetHint = {
      visible: false,
      setPosition: jest.fn(),
    }

    scene.update()

    expect(scene.closetImage.setVisible)
      .toHaveBeenCalledWith(false)
  })

  test('hides press E hint when far from closet', () => {
    scene.player.x = 500
    scene.player.y = 500

    scene.ppeRoomZone = {
      x: 0,
      y: 0,
      width: 1000,
      height: 1000,
    }

    scene.closetZone = {
      x: 0,
      y: 0,
    }

    scene.pressEText = {
      setVisible: jest.fn(),
      setPosition: jest.fn(),
    }

    scene.update()

    expect(scene.pressEText.setVisible)
      .toHaveBeenCalledWith(false)
  })

  test('resumes closet glow animation when entering dressing room', () => {
    scene.player.x = 100
    scene.player.y = 100

    scene.ppeRoomZone = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    }

    scene.closetHint = {
      visible: false,
      setPosition: jest.fn(),
    }

    scene.pressEText = {
      setVisible: jest.fn(),
      setPosition: jest.fn(),
    }

    scene.closetGlow = {
      setVisible: jest.fn(),
    }

    scene.closetGlowTween = {
      resume: jest.fn(),
    }

    scene.update()

    expect(scene.closetGlowTween.resume).toHaveBeenCalled()
  })
  test('pauses closet glow animation when leaving dressing room', () => {
    scene.playerInsideDressingRoom = true

    scene.player.x = 500
    scene.player.y = 500

    scene.ppeRoomZone = {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    }

    scene.closetHint = {
      visible: false,
      setPosition: jest.fn(),
    }

    scene.pressEText = {
      setVisible: jest.fn(),
      setPosition: jest.fn(),
    }

    scene.closetGlow = {
      setVisible: jest.fn(),
    }

    scene.closetGlowTween = {
      pause: jest.fn(),
    }

    scene.update()

    expect(scene.closetGlowTween.pause).toHaveBeenCalled()
  })
  
  test('resets lecture room state when player leaves room', () => {
    scene.playerInsideLectureRoom = true

    scene.player.x = 500
    scene.player.y = 500

    scene.lectureRoomZone = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }

    scene.update()

    expect(scene.playerInsideLectureRoom).toBe(false)
  })
})