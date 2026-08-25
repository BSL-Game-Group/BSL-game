import Phaser from 'phaser';
import { BaseInteraction } from './BaseInteraction';

export class ExitInteraction extends BaseInteraction {
    constructor(scene) {
        super(scene);
        this.playerInsideExitRoom = false;
    }

    seedPresence() {
        if (this.scene.exitZone) {
            this.playerInsideExitRoom = this.isInside(this.scene.exitZone);
        }
    }

    update() {
        const { exitGlow, exitButtonPoint, exitGlowTween, exitPressEText } = this.scene;
        if (!exitGlow || !exitButtonPoint) {
            return;
        }

        // Calculate distance to the wall exit button for proximity prompt (Press E)
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            exitButtonPoint.x, exitButtonPoint.y
        );

        // Make the glow active / pulsing when close to the button, or keep it always running
        const closeToButton = dist < 95;
        exitGlow.setVisible(closeToButton);
        if (exitGlowTween) {
            closeToButton ? exitGlowTween.resume() : exitGlowTween.pause();
        }

        if (closeToButton) {
            exitPressEText?.setVisible(true);
            exitPressEText?.setPosition(exitButtonPoint.x - 50, exitButtonPoint.y - 45);
            if (this.justPressed(this.keyE)) {
                window.dispatchEvent(new Event('exit-popup-opened'));
            }
        } else {
            exitPressEText?.setVisible(false);
        }
    }
}