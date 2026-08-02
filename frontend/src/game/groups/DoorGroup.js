import Phaser from 'phaser';
import Door from '../sprites/Door.js'

export default class DoorGroup extends Phaser.Physics.Arcade.StaticGroup {
    constructor(scene) {
        super(scene.physics.world, scene);
        this.solidSprites = [];
    }

    addDoor(x, y, texture, config) {
        const door = new Door(this.scene, x, y, texture, config);
        this.add(door.triggerZone);
        this.solidSprites.push(door);
        return door;
    }
}