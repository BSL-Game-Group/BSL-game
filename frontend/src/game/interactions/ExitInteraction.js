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
        const { exitGlow, exitZone, exitButtonPoint, exitGlowTween, pressEText, exitPromptText } = this.scene;
        if (!exitGlow || !exitZone || !exitButtonPoint) {
            return;}

        const inside = this.isInside(exitZone);
        this.playerInsideExitRoom = inside;

        exitGlow.setVisible(inside);
        if (exitGlowTween) {
            inside ? exitGlowTween.resume() : exitGlowTween.pause();
        }

        if (!inside) {
            return;}

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            exitButtonPoint.x, exitButtonPoint.y
        );

        if (dist < 95) {
            pressEText?.setVisible(true);
            pressEText?.setText(exitPromptText || 'Press E to exit');
            pressEText?.setPosition(exitButtonPoint.x - 50, exitButtonPoint.y - 45);
            if (this.justPressed(this.keyE)) {
                window.dispatchEvent(new Event('exit-popup-opened'));
            }
        } else {
            pressEText?.setVisible(false);
        }
    }
}