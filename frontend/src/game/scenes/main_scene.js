import Phaser from 'phaser';
import { createRooms } from './rooms';

export function playerIsInsideZone(player, zone) {
    return (
        player.x >= zone.x &&
        player.x <= zone.x + zone.width &&
        player.y >= zone.y &&
        player.y <= zone.y + zone.height
    );
}

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
    }

    create() {
        const walls = createRooms(this);

        this.physics.world.setBounds(20, 20, 1240, 680);

        this.player = this.physics.add.sprite(700, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.player.setScale(0.3);

        this.physics.add.collider(this.player, walls);

        this.playerInsideLectureRoom = false;
    }

    update() {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-160);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
        }

        const pointer = this.input.activePointer;
        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y, pointer.x, pointer.y
        );

        if (pointer.isDown && distance > 10) {
            this.physics.moveToObject(this.player, pointer, 160);
        }

        if (this.lectureRoomZone) {
            const inside = playerIsInsideZone(this.player, this.lectureRoomZone);
            if (inside && !this.playerInsideLectureRoom) {
                window.dispatchEvent(new Event('lecture-room-entered'));
                this.playerInsideLectureRoom = true;
            } else if (!inside) {
                this.playerInsideLectureRoom = false;
            }
        }
    }
}

export default MainScene;
