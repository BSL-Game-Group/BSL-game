import Phaser from 'phaser';

const COLORS = {
  fieldBorder: 0x2c3038,
  roomBorder:  0x6a7180,
  text:        '#2c3038',
};

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
    }

    create() {
        this.drawPlayField();

        this.physics.world.setBounds(20, 20, 1240, 680);

        this.player = this.physics.add.sprite(640, 500, 'player');
        this.player.setCollideWorldBounds(true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.player.setScale(0.3);
    }

    drawPlayField() {
        this.add
            .rectangle(640, 360, 1240, 680)
            .setStrokeStyle(2, COLORS.fieldBorder);

        // Bounds for movement team — world-space top-left of lecture room area
        this.lectureRoomZone = { x: 80, y: 100, width: 210, height: 160 };
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
    }
}

export default MainScene;
