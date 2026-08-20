import Phaser from 'phaser';
import { BaseInteraction } from './BaseInteraction';

export class DressingRoomInteraction extends BaseInteraction {
    constructor(scene) {
        super(scene);
        this.playerInsideDressingRoom = false;
    }

    seedPresence() {
        if (this.scene.ppeRoomZone) {
            this.playerInsideDressingRoom = this.isInside(this.scene.ppeRoomZone);
            if (this.playerInsideDressingRoom) {
                this.scene.closetGlow?.setVisible(true);
                this.scene.closetGlowTween?.resume();
                this.scene.undressGlow?.setVisible(true);
                this.scene.undressGlowTween?.resume();
            }
        }
    }

    update() {
        const { ppeRoomZone, closetGlow, closetGlowTween, undressGlow, undressGlowTween,
                closetZone, undressPoint, closetPressEText, undressHint } = this.scene;

        if (!ppeRoomZone) {
          return;}

        const inside = this.isInside(ppeRoomZone);

        if (inside && !this.playerInsideDressingRoom) {
            closetGlow?.setVisible(true);
            closetGlowTween?.resume();
            undressGlow?.setVisible(true);
            undressGlowTween?.resume();
            this.playerInsideDressingRoom = true;
        } else if (!inside && this.playerInsideDressingRoom) {
            closetGlow?.setVisible(false);
            closetGlowTween?.pause();
            undressGlow?.setVisible(false);
            undressGlowTween?.pause();
            this.playerInsideDressingRoom = false;
        }

        if (!inside) {
          return;}

        if (this.justPressed(this.keyE)) {
            window.dispatchEvent(new Event('closet-popup-opened'));
        }

        if (this.justPressed(this.keyR)) {
            window.dispatchEvent(new Event('quick-undress'));
        }

        // Closet hint positioning
        const closetCenter = closetZone ? { x: closetZone.x + 35, y: closetZone.y + 60 } : null;
        const closetDist = closetCenter 
            ? Phaser.Math.Distance.Between(this.player.x, this.player.y, closetCenter.x, closetCenter.y) 
            : Infinity;
        const closeToCloset = Boolean(closetCenter) && closetDist < 90;

        closetPressEText.setVisible(closeToCloset);
        if (closeToCloset) {
            closetPressEText.setPosition(closetCenter.x - 40, closetCenter.y - 80);
        }

        // Undress hint positioning
        if (undressHint && undressPoint) {
            const undressDist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, undressPoint.x, undressPoint.y
            );
            const closeToUndress = undressDist < 110;
            undressHint.setVisible(closeToUndress);
            if (closeToUndress) {
                undressHint.setPosition(undressPoint.x - 60, undressPoint.y - 90);
            }
        }
    }
}