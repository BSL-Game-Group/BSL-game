import Phaser from 'phaser';
import { BaseInteraction } from './BaseInteraction';

export class AirlockInteraction extends BaseInteraction {
    constructor(scene) {
        super(scene);
        this.playerInsideAirlock2 = false;
    }

    seedPresence() {
        if (this.scene.airlock2Zone) {
            this.playerInsideAirlock2 = this.isInside(this.scene.airlock2Zone);
            if (this.playerInsideAirlock2) {
                this.scene.airlockWashGlow?.setVisible(true);
                this.scene.airlockWashGlowTween?.resume();
            }
        }
    }

    update() {
        const { airlock2Zone, airlockWashGlow, airlockWashGlowTween, airlockWashHint, airlockWashPoint } = this.scene;
        if (!airlock2Zone) {
          return;}

        const inside = this.isInside(airlock2Zone);

        if (inside && !this.playerInsideAirlock2) {
            airlockWashGlow?.setVisible(true);
            airlockWashGlowTween?.resume();
            this.playerInsideAirlock2 = true;
            window.dispatchEvent(new Event('airlock-wash-reminder'));
        } else if (!inside && this.playerInsideAirlock2) {
            airlockWashGlow?.setVisible(false);
            airlockWashGlowTween?.pause();
            this.playerInsideAirlock2 = false;
        }

        if (!inside) {
          return;}

        if (this.justPressed(this.keyR)) {
            window.dispatchEvent(new Event('airlock-decon'));
        }

        if (airlockWashHint && airlockWashPoint) {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, airlockWashPoint.x, airlockWashPoint.y
            );
            const closeEnough = dist < 90;
            airlockWashHint.setVisible(closeEnough);
            if (closeEnough) {
                airlockWashHint.setPosition(airlockWashPoint.x - 320, airlockWashPoint.y + 30);
            }
        }
    }
}