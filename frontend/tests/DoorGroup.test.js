jest.mock('phaser', () => ({
    Physics: {
        Arcade: {
            StaticGroup: class {
                constructor(world, scene) {
                    this.world = world;
                    this.scene = scene;
                    this.add = jest.fn();
                }
            }
        }
    }
}));

jest.mock('../src/game/sprites/Door.js', () =>
    jest.fn()
);

import DoorGroup from '../src/game/groups/DoorGroup.js';
import Door from '../src/game/sprites/Door.js';

describe('DoorGroup', () => {
    let scene;

    beforeEach(() => {
        jest.clearAllMocks();

        scene = {
            physics: {
                world: {}
            }
        };
    });

    describe('constructor', () => {
        it('initializes with an empty solidSprites array', () => {
            const group = new DoorGroup(scene);

            expect(group.solidSprites).toEqual([]);
        });

        it('passes world and scene to StaticGroup', () => {
            const group = new DoorGroup(scene);

            expect(group.world).toBe(scene.physics.world);
            expect(group.scene).toBe(scene);
        });
    });

    describe('addDoor', () => {
        it('creates a Door with the provided arguments', () => {
            const mockDoor = {
                triggerZone: {}
            };

            Door.mockImplementation(() => mockDoor);

            const group = new DoorGroup(scene);

            group.addDoor(
                100,
                200,
                'doorTexture',
                { key: 'value' }
            );

            expect(Door).toHaveBeenCalledWith(
                scene,
                100,
                200,
                'doorTexture',
                { key: 'value' }
            );
        });

        it('adds the trigger zone to the static group', () => {
            const triggerZone = { id: 'zone' };
            const mockDoor = { triggerZone };

            Door.mockImplementation(() => mockDoor);

            const group = new DoorGroup(scene);

            group.addDoor(100, 200, 'doorTexture');

            expect(group.add).toHaveBeenCalledWith(triggerZone);
        });

        it('adds the door to solidSprites', () => {
            const mockDoor = {
                triggerZone: {}
            };

            Door.mockImplementation(() => mockDoor);

            const group = new DoorGroup(scene);

            group.addDoor(100, 200, 'doorTexture');

            expect(group.solidSprites).toContain(mockDoor);
            expect(group.solidSprites).toHaveLength(1);
        });

        it('returns the created door', () => {
            const mockDoor = {
                triggerZone: {}
            };

            Door.mockImplementation(() => mockDoor);

            const group = new DoorGroup(scene);

            const result = group.addDoor(
                100,
                200,
                'doorTexture'
            );

            expect(result).toBe(mockDoor);
        });

        it('supports adding multiple doors', () => {
            const door1 = { triggerZone: { id: 1 } };
            const door2 = { triggerZone: { id: 2 } };

            Door
                .mockImplementationOnce(() => door1)
                .mockImplementationOnce(() => door2);

            const group = new DoorGroup(scene);

            group.addDoor(0, 0, 'door1');
            group.addDoor(10, 10, 'door2');

            expect(group.solidSprites).toEqual([door1, door2]);
            expect(group.add).toHaveBeenCalledTimes(2);
        });
    });
});
