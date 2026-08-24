import Phaser from "phaser";
import { PLAYER_CONFIG } from "../config/constants";

// How long a standing start takes to reach full speed, and a released key to
// come to rest. Short enough that the lab still feels responsive to walk
// around, long enough to take the edge off the old instant 0-to-160 snap.
const ACCELERATION_MS = 120;
const DECELERATION_MS = 100;
const DEFAULT_DELTA_MS = 1000 / 60;

export default class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.speed = PLAYER_CONFIG.speed;

        // Fraction of full speed currently being applied, plus the unit
        // vector it is applied along. The direction outlives the input so a
        // released key coasts to a stop instead of stopping dead.
        this.throttle = 0;
        this.direction = { x: 0, y: 0 };

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

    update(_time, delta) {
        if (!this.scene.player || !this.scene.player.body) {
            return;}

        this.scene.player.setVelocity(0);

        // Popups freeze the player outright rather than letting it coast:
        // drifting on under an open dialog could carry it out of the room the
        // dialog is asking about.
        if (this.scene.isPopupOpen) {
            this.throttle = 0;
            this.updateVisuals();
            return;
        }

        const step = Number.isFinite(delta) ? delta : DEFAULT_DELTA_MS;
        const input = this.getInputDirection();

        if (input) {
            this.direction = input;
            this.throttle = Math.min(1, this.throttle + step / ACCELERATION_MS);
        } else {
            this.throttle = Math.max(0, this.throttle - step / DECELERATION_MS);
        }

        if (this.throttle > 0) {
            const speed = this.speed * this.throttle;

            this.scene.player.setVelocityX(this.direction.x * speed);
            this.scene.player.setVelocityY(this.direction.y * speed);
        }

        this.updateVisuals();
    }

    // The pointer wins when both are active, matching the old order where
    // moveToObject ran last and overwrote whatever the keys had set.
    getInputDirection() {
        return this.getPointerDirection() ?? this.getKeyboardDirection();
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

    getKeyboardDirection() {
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
            return null;
        }

        // Normalised, so holding two keys doesn't move the player √2 (≈41%)
        // faster than one — and so it matches the pointer, which is a unit
        // vector by construction.
        const length = Math.hypot(dirX, dirY);

        return { x: dirX / length, y: dirY / length };
    }

    getPointerDirection() {
        const pointer = this.scene.input.activePointer;

        if (
            !pointer.isDown ||
            !this.scene.playArea ||
            !this.scene.playArea.contains(pointer.x, pointer.y)
        ) {
            return null;
        }

        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            pointer.x,
            pointer.y
        );

        if (distance <= 10) {
            return null;
        }

        return {
            x: (pointer.x - this.scene.player.x) / distance,
            y: (pointer.y - this.scene.player.y) / distance,
        };
    }
}