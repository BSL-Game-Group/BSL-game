import Phaser from "phaser";

export default class PlayerController {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        this.cursors = scene.input.keyboard.createCursorKeys();

        this.speed = 160;
    }

    update() {
        this.player.setVelocity(0);

        if (this.scene.isPopupOpen) {
            return;
        }

        this.handleKeyboardMovement();
        this.handleMouseMovement();
    }

    handleKeyboardMovement() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.speed);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.speed);
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
            this.player.x,
            this.player.y,
            pointer.x,
            pointer.y
        );

        if (distance > 10) {
            this.scene.physics.moveToObject(
                this.player,
                pointer,
                this.speed
            );
        }
    }
}