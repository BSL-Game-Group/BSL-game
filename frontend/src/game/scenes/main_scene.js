import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
      this.load.image('player', '../../public/assets/player.png');
    }

    create() {
      this.player = this.physics.add.sprite(450, 450, 'player');
      this.player.setCollideWorldBounds(true);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.player.setScale(0.3);
    }

    update() {
      if (this.cursors.left.isDown)
      {
          this.player.setVelocityX(-160);

          this.player.anims.play('left', true);
      }
      else if (this.cursors.right.isDown)
      {
          this.player.setVelocityX(160);

          this.player.anims.play('right', true);
      }
      else if (this.cursors.up.isDown)
      {
          this.player.setVelocityY(-160);

          this.player.anims.play('up', true);
      }
      else if (this.cursors.down.isDown)
      {
          this.player.setVelocityY(160);

          this.player.anims.play('down', true);
      }
      else
      {
          this.player.setVelocityX(0);
          this.player.setVelocityY(0);

      }
    }
}

export default MainScene;