import Phaser from "phaser";

export default class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.speed = 160;

        this.shadow = scene.add?.ellipse?.(
            scene.player?.x ?? 0,
            (scene.player?.y ?? 0) + 20,
            24,
            10,
            0x000000,
            0.25
        );
        this.shadow?.setDepth?.((scene.player?.depth ?? 0) - 1);
    }

    update() {
        if (!this.scene.player || !this.scene.player.body) {
            return;}

        this.scene.player.setVelocity(0);

        if (!this.scene.isPopupOpen) {
            this.handleKeyboardMovement();
            this.handleMouseMovement();
        }

        this.updateVisuals();
    }

    // Player art is one static image (no animation frames), so "liveliness"
    // is faked here: flip on horizontal facing and a drop shadow that
    // reacts to speed. Deliberately not touching player.scale — equipment
    // sprites track the player's position but not any scale change, so an
    // animated scale (breathing, squash, pop — all removed) would visibly
    // desync them from the body.
    updateVisuals() {
        const player = this.scene.player;
        const velocity = player.body.velocity;

        if (velocity.x !== 0) {
            player.setFlipX?.(velocity.x > 0);
        }

        const speedRatio = Math.min(1, Math.hypot(velocity.x, velocity.y) / this.speed);
        this.shadow?.setScale?.(1 + speedRatio * 0.15);
        this.shadow?.setAlpha?.(0.25 - speedRatio * 0.08);
        this.shadow?.setPosition?.(player.x, player.y + 20);
    }

    handleKeyboardMovement() {
        if (this.cursors.left.isDown) {
            this.scene.player.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown) {
            this.scene.player.setVelocityX(this.speed);
        }

        if (this.cursors.up.isDown) {
            this.scene.player.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown) {
            this.scene.player.setVelocityY(this.speed);
        }
    }

    handleMouseMovement() {
        const pointer = this.scene.input.activePointer;

        if (
            !pointer.isDown ||
            !this.scene.playArea ||
            !this.scene.playArea.contains(pointer.x, pointer.y)
        ) {
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            pointer.x,
            pointer.y
        );

        if (distance > 10) {
            this.scene.physics.moveToObject(
                this.scene.player,
                pointer,
                this.speed
            );
        }
    }
}