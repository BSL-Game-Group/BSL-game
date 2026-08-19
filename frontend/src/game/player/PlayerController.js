import Phaser from "phaser";

const TURN_SQUASH_DURATION = 150;
const START_POP_DURATION = 150;

export default class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.speed = 160;
        this.baseScale = scene.player?.scaleX ?? 1;
        this.lastFlip = undefined;
        this.turnSquashStart = undefined;
        this.wasMoving = false;
        this.startPopBegin = undefined;

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
    // is faked here: flip on horizontal facing (with a brief squash on
    // direction change), an idle breathing pulse, a quick pop when starting
    // to move, and a drop shadow that reacts to speed.
    updateVisuals() {
        const player = this.scene.player;
        const velocity = player.body.velocity;
        const moving = velocity.x !== 0 || velocity.y !== 0;
        const now = this.scene.time?.now ?? 0;

        if (velocity.x !== 0) {
            const flip = velocity.x > 0;
            if (this.lastFlip !== undefined && this.lastFlip !== flip) {
                this.turnSquashStart = now;
            }
            this.lastFlip = flip;
            player.setFlipX?.(flip);
        }

        if (moving && !this.wasMoving) {
            this.startPopBegin = now;
        }
        this.wasMoving = moving;

        let scaleX = moving ? 1 : 1 + Math.sin(now / 400) * 0.015;
        let scaleY = scaleX;

        const turnElapsed = now - this.turnSquashStart;
        if (this.turnSquashStart !== undefined && turnElapsed < TURN_SQUASH_DURATION) {
            const t = turnElapsed / TURN_SQUASH_DURATION;
            scaleX *= 1 - Math.sin(t * Math.PI) * 0.25;
        }

        const popElapsed = now - this.startPopBegin;
        if (this.startPopBegin !== undefined && popElapsed < START_POP_DURATION) {
            const t = popElapsed / START_POP_DURATION;
            const pop = 1 - Math.sin(t * Math.PI) * 0.03;
            scaleX *= pop;
            scaleY *= pop;
        }

        player.setScale?.(this.baseScale * scaleX, this.baseScale * scaleY);

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