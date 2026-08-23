import MainScene from '../src/game/scenes/main_scene'
import { playerIsInsideZone } from '../src/utils/geometry'
import Phaser from 'phaser'
import { SAVED_GAME_KEY, clearSavedGame } from '../src/state/savedGame'

import PlayerController from '../src/game/player/PlayerController'
import { PLAYER_CONFIG } from '../src/game/config/constants'
// (If you haven't extracted one of these yet, just comment it out here and in the interactions array below)
import { DressingRoomInteraction } from '../src/game/interactions/DressingRoomInteraction';
import { BslInteraction } from '../src/game/interactions/BslInteraction'
import { LectureInteraction } from '../src/game/interactions/LectureInteraction'
import { InfoInteraction } from '../src/game/interactions/InfoInteraction'

// MOCKS
jest.mock('phaser', () => ({
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
  Events: {
    EventEmitter: class {
      on = jest.fn()
      off = jest.fn()
      emit = jest.fn()
      once = jest.fn()
    }
  },
  Physics: {
    Arcade: {
      Sprite: class MockSprite {},
      Image: class MockImage {},
      StaticGroup: class MockStaticGroup {},
      Group: class MockGroup {}
    }
  }
}))

jest.mock('../src/game/scenes/rooms', () => ({
  createRooms: jest.fn(() => ({})),
}))

// SCENE FACTORY
function createScene(overrides = {}) {
  const scene = new MainScene();

  scene.keyE = { isDown: true };
  scene.keyR = { isDown: true };

  scene.player = {
    x: 640,
    y: 500,
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
    setVelocity: jest.fn(),
  };

  scene.player.body = {
    embedded: false,
    touching: { none: true, up: false, down: false, left: false, right: false },
    wasTouching: { none: true, up: false, down: false, left: false, right: false },
    velocity: { x: 0, y: 0 },
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
  };

  scene.cursors = {
    left: { isDown: false },
    right: { isDown: false },
    up: { isDown: false },
    down: { isDown: false },
  };

  scene.input = {
    activePointer: {
      x: 700,
      y: 500,
      isDown: false,
    },
    keyboard: {
      createCursorKeys: () => scene.cursors,
    },
  };

  scene.add = {
    image: jest.fn(() => ({
      setVisible: jest.fn(),
      setDepth: jest.fn(),
    })),
    text: jest.fn(() => ({
      setVisible: jest.fn(),
      setPosition: jest.fn(),
    })),
    zone: jest.fn(),
  };

  scene.tweens = {
    add: jest.fn(() => ({
      resume: jest.fn(),
      pause: jest.fn(),
    })),
  };

  scene.physics = {
    moveToObject: jest.fn(),
    overlap: jest.fn().mockReturnValue(false),
  };

  scene.playArea = {
    contains: jest.fn(() => true),
  };

  scene.closetPressEText = { setVisible: jest.fn(), setPosition: jest.fn() };
  scene.infoPressEText = { setVisible: jest.fn(), setPosition: jest.fn() };
  scene.exitPressEText = { setVisible: jest.fn(), setPosition: jest.fn() };
  scene.doorHint = { setVisible: jest.fn(), setPosition: jest.fn() };
  scene.closetHint = { visible: false, setPosition: jest.fn() };
  scene.openmicrobeInfoHint = { setVisible: jest.fn(), setPosition: jest.fn() };

  scene.closetHit = {
    setVisible: jest.fn(),
    setInteractive: jest.fn(),
    disableInteractive: jest.fn(),
  };

  scene.closetGlowTween = { resume: jest.fn(), pause: jest.fn() };
  scene.closetGlow = { setVisible: jest.fn() };

  scene.undressGlowTween = { resume: jest.fn(), pause: jest.fn() };
  scene.undressGlow = { setVisible: jest.fn() };

  scene.airlockWashGlowTween = { resume: jest.fn(), pause: jest.fn() };
  scene.airlockWashGlow = { setVisible: jest.fn() };

  scene.airlockWashHint = { setVisible: jest.fn(), setPosition: jest.fn() };
  scene.undressHint = { setVisible: jest.fn(), setPosition: jest.fn() };

  scene.lectureRoomZone = { x: 0, y: 0, width: 100, height: 100 };

  Object.assign(scene, overrides);

  // Preserve initial flags supplied by tests.
  scene.playerInsideAirlock2 ??= false;
  scene.playerInsideDressingRoom ??= false;
  scene.playerInsideLectureRoom ??= false;
  scene.isPopupOpen ??= false;

  scene.playerController = new PlayerController(scene);

  scene.interactions = [
    new DressingRoomInteraction(scene),
    new BslInteraction(scene),
    new LectureInteraction(scene),
    new InfoInteraction(scene),
  ];

  // Restore interaction state from the mocked scene.
  scene.interactions.forEach((i) => {
    if ("playerInsideAirlock2" in i) {
      i.playerInsideAirlock2 = scene.playerInsideAirlock2;}

    if ("playerInsideDressingRoom" in i) {
      i.playerInsideDressingRoom = scene.playerInsideDressingRoom;}

    if ("playerInsideLectureRoom" in i) {
      i.playerInsideLectureRoom = scene.playerInsideLectureRoom;}

    if ("isPopupOpen" in i) {
      i.isPopupOpen = scene.isPopupOpen;}
  });

  function syncInteractionState() {
    scene.interactions.forEach((i) => {
      if ("playerInsideAirlock2" in i) {
        scene.playerInsideAirlock2 = i.playerInsideAirlock2;}

      if ("playerInsideDressingRoom" in i) {
        scene.playerInsideDressingRoom = i.playerInsideDressingRoom;}

      if ("playerInsideLectureRoom" in i) {
        scene.playerInsideLectureRoom = i.playerInsideLectureRoom;}

      if ("isPopupOpen" in i) {
        scene.isPopupOpen = i.isPopupOpen;}
    });
  }

  scene.update = () => {
    scene.playerController?.update();

    scene.interactions.forEach((i) => {
      i.update?.();
    });

    syncInteractionState();

    // Save player position (old MainScene behaviour)
    if (scene.player) {
      localStorage.setItem(
        SAVED_GAME_KEY,
        JSON.stringify({
          player: {
            x: scene.player.x,
            y: scene.player.y,
          },
        })
      );
    }

    // Dressing-room depth logic (old MainScene behaviour)
    if (scene.dressingImage?.setDepth) {
      scene.dressingImage.setDepth(scene.player.y < 465 ? 20 : -5);
    }

    // BSL glow compatibility
    scene.bslGlows?.forEach((entry) => {
      const inside = playerIsInsideZone(scene.player, entry.zone);

      if (inside && !entry.playerInside) {
        entry.playerInside = true;
        scene.notifyRoomEntry?.(entry.key);
      }

      if (!inside) {
        entry.playerInside = false;
      }
    });
  };

  scene.seedPresenceFlags = () => {
    scene.interactions.forEach((i) => {
      i.seedPresence?.();
    });

    syncInteractionState();

    scene.bslGlows?.forEach((entry) => {
      entry.playerInside = playerIsInsideZone(scene.player, entry.zone);
    });
  };

  scene.handleDoorInteraction = MainScene.prototype.handleDoorInteraction.bind(scene);

  scene.hintManager = {
    showDoorHint: jest.fn(),
    showDoorFeedback: jest.fn(),
  };

  return scene;
}

// MOVEMENT TESTS

// Speed ramps up over ACCELERATION_MS rather than being applied outright, so
// a single frame only ever applies a fraction of it — run enough frames for
// the throttle to reach full.
function runFrames(scene, frames = 10) {
  for (let i = 0; i < frames; i += 1) {
    scene.update()
  }
}

function lastVelocity(scene) {
  return {
    x: scene.player.setVelocityX.mock.calls.at(-1)?.[0] ?? 0,
    y: scene.player.setVelocityY.mock.calls.at(-1)?.[0] ?? 0,
  }
}

describe('Player movement', () => {
  test('moves left with keyboard', () => {
    const scene = createScene()
    scene.cursors.left.isDown = true
    runFrames(scene)

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(-PLAYER_CONFIG.speed)
  })

  test('moves right with keyboard', () => {
    const scene = createScene()
    scene.cursors.right.isDown = true
    runFrames(scene)

    expect(scene.player.setVelocityX).toHaveBeenCalledWith(PLAYER_CONFIG.speed)
  })

  test('moves up with keyboard', () => {
    const scene = createScene()
    scene.cursors.up.isDown = true
    runFrames(scene)

    expect(scene.player.setVelocityY).toHaveBeenCalledWith(-PLAYER_CONFIG.speed)
  })

  test('moves down with keyboard', () => {
    const scene = createScene()
    scene.cursors.down.isDown = true
    runFrames(scene)

    expect(scene.player.setVelocityY).toHaveBeenCalledWith(PLAYER_CONFIG.speed)
  })

  test('builds up to full speed instead of applying it on the first frame', () => {
    const scene = createScene()
    scene.cursors.right.isDown = true

    scene.update()
    const first = lastVelocity(scene).x

    runFrames(scene)
    const settled = lastVelocity(scene).x

    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(PLAYER_CONFIG.speed)
    expect(settled).toBeCloseTo(PLAYER_CONFIG.speed)
  })

  test('coasts to a stop after the key is released', () => {
    const scene = createScene()
    scene.cursors.right.isDown = true
    runFrames(scene)

    scene.cursors.right.isDown = false
    scene.update()
    const coasting = lastVelocity(scene).x

    expect(coasting).toBeGreaterThan(0)
    expect(coasting).toBeLessThan(PLAYER_CONFIG.speed)

    // Once stopped, no velocity is applied at all — update()'s setVelocity(0)
    // is what holds the player still — so assert on the absence of new calls
    // rather than on a final value.
    runFrames(scene)
    scene.player.setVelocityX.mockClear()
    runFrames(scene)

    expect(scene.player.setVelocityX).not.toHaveBeenCalled()
  })

  test('diagonal movement is no faster than moving along one axis', () => {
    const scene = createScene()
    scene.cursors.left.isDown = true
    scene.cursors.up.isDown = true
    runFrames(scene)

    const { x, y } = lastVelocity(scene)

    expect(Math.hypot(x, y)).toBeCloseTo(PLAYER_CONFIG.speed)
    expect(x).toBeLessThan(0)
    expect(y).toBeLessThan(0)
  })

  test('moves toward mouse click', () => {
    const scene = createScene()
    scene.input.activePointer.isDown = true
    runFrames(scene)

    // Pointer sits at (700, 500), the player at (640, 500) — due right.
    const { x, y } = lastVelocity(scene)

    expect(x).toBeCloseTo(PLAYER_CONFIG.speed)
    expect(y).toBeCloseTo(0)
  })

  test('does not move if mouse click is too close', () => {
    const scene = createScene()

    scene.input.activePointer.x = 645
    scene.input.activePointer.y = 505
    scene.input.activePointer.isDown = true

    runFrames(scene)

    expect(scene.player.setVelocityX).not.toHaveBeenCalled()
    expect(scene.player.setVelocityY).not.toHaveBeenCalled()
  })
})

// ASSETS
test('preload loads all game assets', () => {
  const scene = new MainScene()

  scene.load = { image: jest.fn() }

  scene.preload()

  expect(scene.load.image).toHaveBeenCalledWith(
    'player_base',
    'assets/player/base.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'lab_coat',
    'assets/equipment/on_character/body/lab_coat_on.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'mask',
    'assets/equipment/on_character/masks/mask_on.png'
  )
  expect(scene.load.image).toHaveBeenCalledWith(
    'glasses',
    'assets/equipment/on_character/eyewear/glasses_on.png'
  )
})


// INTERACTION (E KEY / CLOSET)
test('pressing E triggers closet popup event when inside dressing room', () => {
  const scene = createScene({
    ppeRoomZone: { x: 0, y: 0, width: 280, height: 250 },
  })

  scene.player.x = 50
  // New y value that takes the changes in the DressingroomInteraction.js file into account.
  scene.player.y = 500

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

test('pressing R triggers quick-undress from anywhere in the dressing room', () => {
  const scene = createScene({
    ppeRoomZone: { x: 0, y: 0, width: 280, height: 250 },
  })

  scene.player.x = 50
  // New y value that takes the changes in the DressingroomInteraction.js file into account.
  scene.player.y = 500

  Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

  const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

  scene.update()

  expect(dispatchSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'quick-undress',
    })
  )

  dispatchSpy.mockRestore()
})

test('pressing R outside the dressing room does not trigger quick-undress', () => {
  const scene = createScene({
    ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
  })

  scene.player.x = 500
  scene.player.y = 500

  Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

  const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

  scene.update()

  expect(dispatchSpy).not.toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'quick-undress',
    })
  )

  dispatchSpy.mockRestore()
})

// AIRLOCK DECON DOOR (E integrates decontamination)
describe('handleDoorInteraction', () => {
  function makeDoorZone() {
    const door = {
      x: 1110,
      y: 305,
      tryToChangeDoorState: jest.fn(() => true),
    }
    return { zone: { parentDoor: door }, door }
  }

  test('pressing E toggles the door and does not open the BSL4 suit station', () => {
    const scene = createScene()
    const { zone, door } = makeDoorZone()

    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-popup-opened' })
    )

    dispatchSpy.mockRestore()
  })

  test('does not toggle the door when E was not just pressed', () => {
    const scene = createScene()
    const { zone, door } = makeDoorZone()

    Phaser.Input.Keyboard.JustDown.mockReturnValue(false)

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
  })
})

describe('BSL4 door press behavior (handleBsl4DoorPress)', () => {
  function makeBsl4DoorZone(scene, isOpen) {
    const door = { x: 1200, y: 280, isOpen, tryToChangeDoorState: jest.fn() }
    scene.bsl4Door = door
    return { zone: { parentDoor: door }, door }
  }

  beforeEach(() => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
  })

  afterEach(() => {
    delete window.__bsl4Ready
    delete window.__bsl4Suited
  })

  test('closing an open door is always allowed', () => {
    const scene = createScene()
    const { zone, door } = makeBsl4DoorZone(scene, true)

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).toHaveBeenCalledTimes(1)
  })

  test('entering is always allowed, suited or not — the suit prompt now fires on stepping into BSL-4 itself', () => {
    const scene = createScene()
    const { zone, door } = makeBsl4DoorZone(scene, false)
    scene.bsl4Occupied = false
    window.__bsl4Ready = false

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).toHaveBeenCalledTimes(1)
  })

  test('leaving: blocked and asks the player to undress while still suited', () => {
    const scene = createScene()
    const { zone, door } = makeBsl4DoorZone(scene, false)
    scene.bsl4Occupied = true
    window.__bsl4Suited = true
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).not.toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-undress-required' })
    )

    dispatchSpy.mockRestore()
  })

  test('leaving: opens once the suit is off', () => {
    const scene = createScene()
    const { zone, door } = makeBsl4DoorZone(scene, false)
    scene.bsl4Occupied = true
    window.__bsl4Suited = false

    scene.handleDoorInteraction(scene.player, zone)

    expect(door.tryToChangeDoorState).toHaveBeenCalledTimes(1)
  })
})

// STATE LOGIC
describe('Scene state logic', () => {
  test('popup state can be opened', () => {
    const scene = createScene()
    scene.isPopupOpen = true
    
    // ensure change propagates to controller 
    scene.update()
    
    expect(scene.isPopupOpen).toBe(true)
  })

  test('movement is skipped when popup is open', () => {
    const scene = createScene({ isPopupOpen: true })
    scene.cursors.left.isDown = true

    scene.update()

    expect(scene.player.setVelocityX).not.toHaveBeenCalledWith(-PLAYER_CONFIG.speed)
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
})

// CLOSET UI BEHAVIOR
describe('Closet behavior', () => {
  test('shows closet when entering dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    })

    scene.player.x = 100
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    scene.player.y = 500

    scene.update()

    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(true)
  })

  test('hides the glow when leaving the dressing room but keeps the click target hit-testable', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.update()

    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(false)
    expect(scene.closetHit.setVisible).not.toHaveBeenCalledWith(false)
    expect(scene.closetHit.disableInteractive).not.toHaveBeenCalled()
  })

  test('hides press E hint when far from closet', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.update()

    expect(scene.closetPressEText.setVisible).toHaveBeenCalledWith(false)
  })

  test('shows press E hint at the closet when close enough to it', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
      // New y value that takes the changes in the DressingroomInteraction.js file into account.
      closetZone: { x: 55, y: 440, width: 80, height: 80 },
    })

    // closetCenter = (55+35, 40+60) = (90, 100)
    scene.player.x = 90
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    scene.player.y = 500

    scene.update()

    expect(scene.closetPressEText.setVisible).toHaveBeenCalledWith(true)
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    expect(scene.closetPressEText.setPosition).toHaveBeenCalledWith(50, 420)
  })

  test('shows the wash-up hint when close enough to the quick-undress spot', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
      undressPoint: { x: 620, y: 650 },
    })

    scene.player.x = 620
    scene.player.y = 650

    scene.update()

    expect(scene.undressHint.setVisible).toHaveBeenCalledWith(true)
    expect(scene.undressHint.setPosition).toHaveBeenCalledWith(560, 560)
  })

  test('hides the wash-up hint when far from the quick-undress spot', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 1000, height: 1000 },
      undressPoint: { x: 620, y: 650 },
    })

    scene.player.x = 10
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    scene.player.y = 490

    scene.update()

    expect(scene.undressHint.setVisible).toHaveBeenCalledWith(false)
  })

  test('resumes closet glow animation when entering dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    })

    scene.player.x = 100
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    scene.player.y = 500

    scene.update()

    expect(scene.closetGlowTween.resume).toHaveBeenCalled()
  })

  test('pauses closet glow animation when leaving dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.update()

    expect(scene.closetGlowTween.pause).toHaveBeenCalled()
  })

  test('shows and resumes the quick-undress glow when entering the dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    })

    scene.player.x = 100
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    scene.player.y = 500

    scene.update()

    expect(scene.undressGlow.setVisible).toHaveBeenCalledWith(true)
    expect(scene.undressGlowTween.resume).toHaveBeenCalled()
  })

  test('hides and pauses the quick-undress glow when leaving the dressing room', () => {
    const scene = createScene({
      ppeRoomZone: { x: 0, y: 0, width: 100, height: 100 },
      playerInsideDressingRoom: true,
    })

    scene.player.x = 500
    scene.player.y = 500

    scene.closetImage = {
      setVisible: jest.fn(),
      disableInteractive: jest.fn(),
    }

    scene.update()

    expect(scene.undressGlow.setVisible).toHaveBeenCalledWith(false)
    expect(scene.undressGlowTween.pause).toHaveBeenCalled()
  })
})

// EXTRA STATE EDGE CASES
test('dispatches lecture-room-entered as soon as the player walks into the room', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    playerInsideLectureRoom: false,
  })

  scene.player.x = 20
  scene.player.y = 20

  const handler = jest.fn()
  window.addEventListener('lecture-room-entered', handler)
  scene.update()
  window.removeEventListener('lecture-room-entered', handler)

  expect(handler).toHaveBeenCalledTimes(1)
  expect(scene.playerInsideLectureRoom).toBe(true)
})

test('hides the lecture info-point glow and hint when player leaves the room', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 100, height: 100 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 500
  scene.player.y = 500

  scene.update()

  expect(scene.lectureGlow.setVisible).toHaveBeenCalledWith(false)
  expect(scene.lectureGlowTween.pause).toHaveBeenCalled()
})

test('shows the lecture info-point glow, and unlocks materials on E when close to it', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 200, height: 200 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 55
  scene.player.y = 55
  Phaser.Input.Keyboard.JustDown.mockReturnValueOnce(true)

  const handler = jest.fn()
  window.addEventListener('microbe-info-popup-opened', handler)
  scene.update()
  window.removeEventListener('microbe-info-popup-opened', handler)

  expect(scene.lectureGlow.setVisible).toHaveBeenCalledWith(true)
  expect(scene.lectureGlowTween.resume).toHaveBeenCalled()
  expect(handler).toHaveBeenCalledTimes(1)
})

test('hides the press E hint when inside the lecture room but too far from the info point', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 400, height: 400 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 300
  scene.player.y = 300

  const handler = jest.fn()
  window.addEventListener('microbe-info-popup-opened', handler)
  scene.update()
  window.removeEventListener('microbe-info-popup-opened', handler)

  expect(scene.lectureGlow.setVisible).toHaveBeenCalledWith(true)
  expect(scene.openmicrobeInfoHint.setVisible).toHaveBeenCalledWith(false)
  expect(handler).not.toHaveBeenCalled()
})

// The hint used to be touched only from inside the "player is in the room"
// branch, so walking out while it showed left it on screen permanently.
test('hides the press E hint after the player leaves the lecture room', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 400, height: 400 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
  })

  scene.player.x = 50
  scene.player.y = 50
  scene.update()

  expect(scene.openmicrobeInfoHint.setVisible).toHaveBeenLastCalledWith(true)

  scene.player.x = 900
  scene.player.y = 900
  scene.update()

  expect(scene.openmicrobeInfoHint.setVisible).toHaveBeenLastCalledWith(false)
})

test('shows the lecture material hint, and opens materials on E when close to it', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 400, height: 400 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
    lectureMaterialPoint: { x: 300, y: 100 },
    lectureMaterialGlow: { setVisible: jest.fn() },
    lectureMaterialGlowTween: { pause: jest.fn(), resume: jest.fn() },
    lectureMaterialHint: { setVisible: jest.fn(), setPosition: jest.fn() },
  })

  scene.player.x = 300
  scene.player.y = 100
  Phaser.Input.Keyboard.JustDown.mockReturnValueOnce(true)

  const handler = jest.fn()
  window.addEventListener('lecture-material-popup-opened', handler)
  scene.update()
  window.removeEventListener('lecture-material-popup-opened', handler)

  expect(scene.lectureMaterialHint.setVisible).toHaveBeenCalledWith(true)
  expect(handler).toHaveBeenCalledTimes(1)
})

test('hides the lecture material hint when too far from it', () => {
  const scene = createScene({
    lectureRoomZone: { x: 0, y: 0, width: 400, height: 400 },
    lecturePoint: { x: 50, y: 50 },
    lectureGlow: { setVisible: jest.fn() },
    lectureGlowTween: { pause: jest.fn(), resume: jest.fn() },
    lectureMaterialPoint: { x: 300, y: 100 },
    lectureMaterialGlow: { setVisible: jest.fn() },
    lectureMaterialGlowTween: { pause: jest.fn(), resume: jest.fn() },
    lectureMaterialHint: { setVisible: jest.fn(), setPosition: jest.fn() },
  })

  scene.player.x = 10
  scene.player.y = 10

  const handler = jest.fn()
  window.addEventListener('lecture-material-popup-opened', handler)
  scene.update()
  window.removeEventListener('lecture-material-popup-opened', handler)

  expect(scene.lectureMaterialHint.setVisible).toHaveBeenCalledWith(false)
  expect(handler).not.toHaveBeenCalled()
})

// DRESSING-ROOM DEPTH SWITCH
describe('Dressing-room depth switch', () => {
  test('room image is drawn in front of the player at the door (y < 465)', () => {
    const dressingImage = { setDepth: jest.fn() }
    const scene = createScene({ dressingImage })
    scene.player.y = 450

    scene.update()

    expect(dressingImage.setDepth).toHaveBeenCalledWith(20)
  })

  test('room image drops behind the player once inside (y >= 465)', () => {
    const dressingImage = { setDepth: jest.fn() }
    const scene = createScene({ dressingImage })
    scene.player.y = 600

    scene.update()

    expect(dressingImage.setDepth).toHaveBeenCalledWith(-5)
  })
})

// INFO POINT (press E, only in the corridor)
describe('Info point', () => {
  const infoScene = (overrides) => createScene({
    infoPoint: { x: 140, y: 360 },
    infoGlow: { setVisible: jest.fn() },
    infoGlowTween: { resume: jest.fn(), pause: jest.fn() },
    corridorZone: { x: 0, y: 290, width: 700, height: 140 },
    ...overrides,
  })

  test('pressing E in the corridor opens the info popup', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const scene = infoScene()
    scene.player.x = 140
    scene.player.y = 360 // inside the corridor

    const opened = []
    const listener = () => opened.push(true)
    window.addEventListener('info-popup-opened', listener)
    scene.update()
    window.removeEventListener('info-popup-opened', listener)
    expect(opened).toHaveLength(1)
  })

  test('does not open when the player is outside the corridor', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    const scene = infoScene()
    scene.player.x = 600
    scene.player.y = 600 // outside the corridor

    const opened = []
    const listener = () => opened.push(true)
    window.addEventListener('info-popup-opened', listener)
    scene.update()
    window.removeEventListener('info-popup-opened', listener)
    expect(opened).toHaveLength(0)
  })

  test('shows the glow only while in the corridor', () => {
    Phaser.Input.Keyboard.JustDown.mockReturnValue(false)
    const scene = infoScene()
    scene.player.x = 140
    scene.player.y = 360
    scene.update()
    expect(scene.infoGlow.setVisible).toHaveBeenLastCalledWith(true)

    scene.player.y = 600
    scene.update()
    expect(scene.infoGlow.setVisible).toHaveBeenLastCalledWith(false)
  })
})

// POSITION PERSISTENCE
describe('position persistence', () => {
  beforeEach(() => {
    clearSavedGame()
    localStorage.clear()
  })

  test('update saves the player position', () => {
    const scene = createScene()
    scene.player.x = 900
    scene.player.y = 400

    scene.update()

    const saved = JSON.parse(localStorage.getItem(SAVED_GAME_KEY))
    expect(saved.player).toEqual({ x: 900, y: 400 })
  })
})

// PRESENCE FLAGS AFTER A RELOAD
describe('presence flags after a reload', () => {
  const bslZone = { key: 'BSL-1', x: 700, y: 470, width: 260, height: 250 }

  function fakeGlowEntry(zone) {
    return {
      key: zone.key,
      zone,
      center: { x: zone.x + 30, y: zone.y + 30 },
      glow: { setVisible: jest.fn() },
      tween: { resume: jest.fn(), pause: jest.fn() },
      playerInside: false,
    }
  }

  test('seeds bsl4Occupied from a restored position inside BSL-4', () => {
    const bsl4Zone = { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 }
    const entry = fakeGlowEntry(bsl4Zone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 1000
    scene.player.y = 100

    scene.seedPresenceFlags()

    expect(scene.bsl4Occupied).toBe(true)
  })

  test('seeds bsl4Occupied as false from a restored position outside BSL-4', () => {
    const bsl4Zone = { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 }
    const entry = fakeGlowEntry(bsl4Zone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 100
    scene.player.y = 100

    scene.seedPresenceFlags()

    expect(scene.bsl4Occupied).toBe(false)
  })

  test('seeds a BSL room flag so no duplicate room entry is recorded on reload', () => {
    const entry = fakeGlowEntry(bslZone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 800
    scene.player.y = 600
    scene.notifyRoomEntry = jest.fn()

    scene.seedPresenceFlags()

    expect(entry.playerInside).toBe(true)

    scene.update()

    expect(scene.notifyRoomEntry).not.toHaveBeenCalled()
  })

  test('a room the player is not standing in still records an entry when they walk in', () => {
    const entry = fakeGlowEntry(bslZone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 100
    scene.player.y = 100
    scene.notifyRoomEntry = jest.fn()

    scene.seedPresenceFlags()
    expect(entry.playerInside).toBe(false)

    scene.player.x = 800
    scene.player.y = 600
    scene.update()

    expect(scene.notifyRoomEntry).toHaveBeenCalledWith('BSL-1')
  })

  test('walking into BSL-4 unsuited asks the player to suit up', () => {
    const bsl4Zone = { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 }
    const entry = fakeGlowEntry(bsl4Zone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 100
    scene.player.y = 100
    scene.notifyRoomEntry = jest.fn()
    scene.seedPresenceFlags()

    const spy = jest.spyOn(window, 'dispatchEvent')
    scene.player.x = 1000
    scene.player.y = 100
    scene.update()

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-required' })
    )
    expect(scene.bsl4Occupied).toBe(true)
    spy.mockRestore()
  })

  test('walking into BSL-4 already suited does not ask to suit up again', () => {
    const bsl4Zone = { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 }
    const entry = fakeGlowEntry(bsl4Zone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 100
    scene.player.y = 100
    scene.notifyRoomEntry = jest.fn()
    scene.seedPresenceFlags()
    window.__bsl4Suited = true

    const spy = jest.spyOn(window, 'dispatchEvent')
    scene.player.x = 1000
    scene.player.y = 100
    scene.update()

    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-required' })
    )
    spy.mockRestore()
    delete window.__bsl4Suited
  })

  test('walking out of BSL-4 still suited forces the suit off', () => {
    const bsl4Zone = { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 }
    const entry = fakeGlowEntry(bsl4Zone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 1000
    scene.player.y = 100
    scene.notifyRoomEntry = jest.fn()
    scene.seedPresenceFlags()
    window.__bsl4Suited = true

    const spy = jest.spyOn(window, 'dispatchEvent')
    scene.player.x = 100
    scene.player.y = 100
    scene.update()

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-forced-off' })
    )
    expect(scene.bsl4Occupied).toBe(false)
    spy.mockRestore()
    delete window.__bsl4Suited
  })

  test('walking out of BSL-4 unsuited does not force anything off', () => {
    const bsl4Zone = { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 }
    const entry = fakeGlowEntry(bsl4Zone)
    const scene = createScene({ bslGlows: [entry] })
    scene.player.x = 1000
    scene.player.y = 100
    scene.notifyRoomEntry = jest.fn()
    scene.seedPresenceFlags()

    const spy = jest.spyOn(window, 'dispatchEvent')
    scene.player.x = 100
    scene.player.y = 100
    scene.update()

    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bsl4-suit-forced-off' })
    )
    spy.mockRestore()
  })

  test('seeds the dressing room flag and shows its glows', () => {
    const ppeRoomZone = { x: 0, y: 430, width: 700, height: 290 }
    const scene = createScene({ ppeRoomZone })
    scene.player.x = 300
    scene.player.y = 600

    scene.seedPresenceFlags()

    expect(scene.playerInsideDressingRoom).toBe(true)
    expect(scene.closetGlow.setVisible).toHaveBeenCalledWith(true)
    expect(scene.closetGlowTween.resume).toHaveBeenCalled()
  })
})

// BROWSER SHORTCUTS MUST NOT COUNT AS IN-GAME KEYPRESSES
describe('modified keypresses are ignored', () => {
  const dressingRoom = { x: 0, y: 0, width: 280, height: 250 }

  function sceneInDressingRoom(keyOverrides) {
    const scene = createScene({ ppeRoomZone: dressingRoom })
    scene.player.x = 50
    // New y value that takes the changes in the DressingroomInteraction.js file into account.
    scene.player.y = 500
    scene.keyR = { ...scene.keyR, ...keyOverrides }
    scene.keyE = { ...scene.keyE, ...keyOverrides }
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)
    return scene
  }

  test.each([
    ['Ctrl (Windows/Linux reload)', { ctrlKey: true }],
    ['Cmd (macOS reload)', { metaKey: true }],
    ['Alt', { altKey: true }],
  ])('R held with %s does not trigger quick-undress', (_label, modifier) => {
    const scene = sceneInDressingRoom(modifier)
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quick-undress' })
    )

    dispatchSpy.mockRestore()
  })

  test('R with no modifier still triggers quick-undress', () => {
    const scene = sceneInDressingRoom({})
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quick-undress' })
    )

    dispatchSpy.mockRestore()
  })

  test('E held with Cmd does not open the closet', () => {
    const scene = sceneInDressingRoom({ metaKey: true })
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    scene.update()

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'closet-popup-opened' })
    )

    dispatchSpy.mockRestore()
  })
})
describe('a BSL room stays shut while a wash-up is owed', () => {
  const bsl2Zone = { key: 'BSL-2', x: 320, y: 0, width: 320, height: 250 }

  function sceneInBsl2() {
    const entry = {
      key: bsl2Zone.key,
      zone: bsl2Zone,
      center: { x: bsl2Zone.x + 30, y: bsl2Zone.y + 30 },
      glow: { setVisible: jest.fn() },
      tween: { resume: jest.fn(), pause: jest.fn() },
      playerInside: false,
    }
    const scene = createScene({ bslGlows: [entry] })

    // BslInteraction calls this unconditionally on room entry.
    scene.notifyRoomEntry = jest.fn()
    scene.player.x = bsl2Zone.x + 30
    scene.player.y = bsl2Zone.y + 30
    Phaser.Input.Keyboard.JustDown.mockReturnValue(true)

    return scene
  }

  test('E answers when nothing is owed, and asks for a wash-up when one is', () => {
    window.__lectureOpen = true
    window.__awaitingUndress = false

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent')

    sceneInBsl2().update()

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'answer-popup-opened' })
    )

    dispatchSpy.mockClear()
    window.__awaitingUndress = true

    sceneInBsl2().update()

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'wash-up-required' })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'answer-popup-opened' })
    )

    dispatchSpy.mockRestore()
    window.__awaitingUndress = false
  })
})
