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
            this.scene.playerInsideDressingRoom = this.playerInsideDressingRoom;
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
                closetZone, undressPoint, pressEText, undressHint } = this.scene;

        if (!ppeRoomZone) {
          return;}

        // The new y value is hardcoded in the movement.test.jsx. If you change this value, remember to update the test too!
        const ppeRoomZoneModified = { ...ppeRoomZone, y: 480}
        const inside = this.isInside(ppeRoomZoneModified);

        if (inside && !this.playerInsideDressingRoom) {
            closetGlow?.setVisible(true);
            closetGlowTween?.resume();
            undressGlow?.setVisible(true);
            undressGlowTween?.resume();
            
            this.playerInsideDressingRoom = true;
            this.scene.playerInsideDressingRoom = true;
        } else if (!inside && this.playerInsideDressingRoom) {
            closetGlow?.setVisible(false);
            closetGlowTween?.pause();
            undressGlow?.setVisible(false);
            undressGlowTween?.pause();

            this.playerInsideDressingRoom = false;
            this.scene.playerInsideDressingRoom = false;

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

        pressEText.setVisible(closeToCloset);
        if (closeToCloset) {
            pressEText.setPosition(closetCenter.x - 40, closetCenter.y - 80);
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