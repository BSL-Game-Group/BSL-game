import Phaser from 'phaser';

export default class Door extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, {
        airlockDoorPairs = [],
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
        this.triggerZone.setInteractive();
        this.wasClicked = false;
        this.triggerZone.on('pointerdown', () => {
            this.wasClicked = true;
        });
        this.airlockDoorPairs = airlockDoorPairs;
    }

    tryToChangeDoorState() {
        if (!this.isOpenable()) {
            // The caller shows the refusal next to the door itself — see
            // MainScene's handleDoorPress and HintManager.showDoorFeedback.
            return false;
        }
        this.isOpen = !this.isOpen;
        this.body.enable = !this.isOpen;
        this.visible = !this.isOpen;
        return true
    }

    addAirlockDoorPair(pair) {
        this.airlockDoorPairs.push(pair);
    }

    isOpenable() {
        return !this.airlockDoorPairs.some((pair) => pair.isOpen);
    }
}