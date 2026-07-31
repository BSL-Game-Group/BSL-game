import Phaser from 'phaser';

export default class Door extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, {
        airlockDoorPair = null,
        triggerZoneX = x,
        triggerZoneY = y,
        triggerZoneWidth = 75,
        triggerZoneHeight = 75,
        bodyWidth = 50,
        bodyHeight = 50,
        bodyXOffset = null,
        bodyYOffset = null
    } = {}) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        this.body.setSize(bodyWidth,bodyHeight);
        if ((bodyXOffset !== null) && (bodyYOffset !== null)) {
            this.body.setOffset(bodyXOffset, bodyYOffset);
        }
        this.body.moves = false;
        this.isOpen = false;
        this.triggerZone = scene.add.zone(triggerZoneX, triggerZoneY, triggerZoneWidth, triggerZoneHeight);
        this.triggerZone.parentDoor = this;
        this.airlockDoorPair = airlockDoorPair;
    }

    tryToChangeDoorState() {
        if ((this.airlockDoorPair !== null) && this.airlockDoorPair.isOpen) {
            return false;
        }
        this.isOpen = !this.isOpen;
        this.body.enable = !this.isOpen;
        this.visible = !this.isOpen;
        return true
    }
}