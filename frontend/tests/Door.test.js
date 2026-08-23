jest.mock('phaser', () => ({
    Physics: {
        Arcade: {
            Sprite: class {
                constructor(scene, x, y, texture) {
                    this.scene = scene;
                    this.x = x;
                    this.y = y;
                    this.texture = texture;
                    this.visible = true;

                    this.body = {
                        setSize: jest.fn(),
                        setOffset: jest.fn(),
                        enable: true,
                        moves: true
                    };
                }
            }
        }
    }
}));

import Door from '../src/game/sprites/Door';

describe('Door', () => {
    let scene;

    beforeEach(() => {
        scene = {
            add: {
                existing: jest.fn(),
                zone: jest.fn((x, y, width, height) => ({
                    x,
                    y,
                    width,
                    height,
                    setInteractive: jest.fn(),
                    on: jest.fn()
                }))
            },
            physics: {
                add: {
                    existing: jest.fn()
                }
            }
        };
    });

    describe('constructor', () => {
        it('creates a door with default values', () => {
            const door = new Door(scene, 100, 200, 'doorTexture');

            expect(scene.add.existing).toHaveBeenCalledWith(door);
            expect(scene.physics.add.existing).toHaveBeenCalledWith(door, true);

            expect(door.body.setSize).toHaveBeenCalledWith(50, 50);
            expect(door.body.setOffset).not.toHaveBeenCalled();

            expect(door.body.moves).toBe(false);
            expect(door.isOpen).toBe(false);
            expect(door.airlockDoorPairs).toEqual([]);

            expect(scene.add.zone).toHaveBeenCalledWith(
                100,
                200,
                75,
                75
            );

            expect(door.triggerZone.parentDoor).toBe(door);
        });

        it('applies custom body size and offset', () => {
            const door = new Door(scene, 100, 200, 'doorTexture', {
                bodyWidth: 80,
                bodyHeight: 90,
                bodyXOffset: 5,
                bodyYOffset: 10
            });

            expect(door.body.setSize).toHaveBeenCalledWith(80, 90);
            expect(door.body.setOffset).toHaveBeenCalledWith(5, 10);
        });

        it('uses custom trigger zone values', () => {
            new Door(scene, 100, 200, 'doorTexture', {
                triggerZoneX: 1,
                triggerZoneY: 2,
                triggerZoneWidth: 3,
                triggerZoneHeight: 4
            });

            expect(scene.add.zone).toHaveBeenCalledWith(
                1,
                2,
                3,
                4
            );
        });

        it('stores provided airlock door pairs', () => {
            const pairs = [{ isOpen: false }];

            const door = new Door(scene, 100, 200, 'doorTexture', {
                airlockDoorPairs: pairs
            });

            expect(door.airlockDoorPairs).toBe(pairs);
        });

        it('registers a pointerdown handler on the trigger zone', () => {
            const door = new Door(scene, 100, 200, 'doorTexture');

            expect(door.triggerZone.on).toHaveBeenCalledWith(
                'pointerdown',
                expect.any(Function)
            );
        });

        it('sets wasClicked when pointerdown is triggered', () => {
            const handlers = {};

            scene.add.zone.mockImplementation((x, y, width, height) => ({
                x,
                y,
                width,
                height,
                setInteractive: jest.fn(),
                on: jest.fn((event, handler) => {
                    handlers[event] = handler;
                })
            }));

            const door = new Door(scene, 100, 200, 'doorTexture');

            expect(door.wasClicked).toBe(false);

            handlers.pointerdown();

            expect(door.wasClicked).toBe(true);
        });
    });

    describe('tryToChangeDoorState', () => {
        it('opens a closed door when openable', () => {
            const door = new Door(scene, 100, 200, 'doorTexture');

            const result = door.tryToChangeDoorState();

            expect(result).toBe(true);
            expect(door.isOpen).toBe(true);
            expect(door.body.enable).toBe(false);
            expect(door.visible).toBe(false);
        });

        it('closes an open door when openable', () => {
            const door = new Door(scene, 100, 200, 'doorTexture');

            door.tryToChangeDoorState(); // open
            const result = door.tryToChangeDoorState(); // close

            expect(result).toBe(true);
            expect(door.isOpen).toBe(false);
            expect(door.body.enable).toBe(true);
            expect(door.visible).toBe(true);
        });

        it('does not change state when not openable', () => {
            const pairedDoor = { isOpen: true };

            const door = new Door(scene, 100, 200, 'doorTexture', {
                airlockDoorPairs: [pairedDoor]
            });

            const result = door.tryToChangeDoorState();

            expect(result).toBe(false);
            expect(door.isOpen).toBe(false);
            expect(door.body.enable).toBe(true);
            expect(door.visible).toBe(true);
        });
    });

    describe('addAirlockDoorPair', () => {
        it('adds a door pair to the list', () => {
            const door = new Door(scene, 100, 200, 'doorTexture');
            const pair = { isOpen: false };

            door.addAirlockDoorPair(pair);

            expect(door.airlockDoorPairs).toContain(pair);
        });
    });

    describe('isOpenable', () => {
        it('returns true when no paired doors are open', () => {
            const door = new Door(scene, 100, 200, 'doorTexture', {
                airlockDoorPairs: [
                    { isOpen: false },
                    { isOpen: false }
                ]
            });

            expect(door.isOpenable()).toBe(true);
        });

        it('returns false when at least one paired door is open', () => {
            const door = new Door(scene, 100, 200, 'doorTexture', {
                airlockDoorPairs: [
                    { isOpen: false },
                    { isOpen: true }
                ]
            });

            expect(door.isOpenable()).toBe(false);
        });

        it('returns true when there are no paired doors', () => {
            const door = new Door(scene, 100, 200, 'doorTexture');

            expect(door.isOpenable()).toBe(true);
        });
    });
});
