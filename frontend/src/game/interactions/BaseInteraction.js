import Phaser from 'phaser';
import { playerIsInsideZone } from '../utils/zoneUtils';
import { isTypingInField } from '../utils/isTypingInField';

export class BaseInteraction {
    constructor(scene) {
        this.scene = scene;
    }

    get player() { return this.scene.player; }
    get keyE() { return this.scene.keyE; }
    get keyR() { return this.scene.keyR; }

    isInside(zone) {
        return playerIsInsideZone(this.player, zone);
    }

    justPressed(key) {
        if (!key || !Phaser.Input.Keyboard.JustDown(key)) {
            return false;
        }
        if (isTypingInField()) {
            return false;
        }
        return !key.ctrlKey && !key.metaKey && !key.altKey;
    }

    seedPresence() {}
    update() {}
}