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

    // Player art is one static image (no animation frames), so facing is
    // faked by flipping it. Deliberately not touching player.scale —
    // equipment sprites track the player's position but not any scale
    // change, so an animated scale would visibly desync them from the body.
    updateVisuals() {
        const player = this.scene.player;
        const velocity = player.body.velocity;

        if (velocity.x !== 0) {
            player.setFlipX?.(velocity.x > 0);
        }

        const speedRatio = Math.min(1, Math.hypot(velocity.x, velocity.y) / this.speed);
        this.shadow?.setScale?.(1 + speedRatio * 0.15);
        this.shadow?.setAlpha?.(0.25 - speedRatio * 0.08);
    }

    // Must run on the scene's POST_UPDATE, not in update(): Arcade Physics
    // integrates the body during the UPDATE event but only writes the result
    // back onto the sprite in Body.postUpdate (gameObject.x += dx), which
    // fires on POST_UPDATE — after update(). Reading player.x from update()
    // yields last frame's value, so anything positioned from it renders a
    // frame behind (~2.7px at this speed and 60fps).
    updateFollowers() {
        const player = this.scene.player;

        if (!player) {
            return;
        }

        this.shadow?.setPosition?.(player.x, player.y + 20);
    }

    handleKeyboardMovement() {
        let dirX = 0;
        let dirY = 0;

        if (this.cursors.left.isDown) {
            dirX = -1;
        } else if (this.cursors.right.isDown) {
            dirX = 1;
        }

        if (this.cursors.up.isDown) {
            dirY = -1;
        } else if (this.cursors.down.isDown) {
            dirY = 1;
        }

        if (dirX === 0 && dirY === 0) {
            return;
        }

        // Normalised, so holding two keys doesn't move the player √2 (≈41%)
        // faster than one. moveToObject already travels at exactly this.speed
        // in any direction, so without this the keyboard outran the mouse.
        const length = Math.hypot(dirX, dirY);

        this.scene.player.setVelocityX((dirX / length) * this.speed);
        this.scene.player.setVelocityY((dirY / length) * this.speed);
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