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
        this.load.image('dresser', 'assets/dresser.png');
    }

    create() {
        const walls = createRooms(this);

        this.physics.world.setBounds(20, 20, 1240, 680);

        // Area where mouse clicks are allowed to move the player
        this.playArea = new Phaser.Geom.Rectangle(20, 20, 1240, 680);

        this.player = this.physics.add.sprite(700, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.player.setScale(0.3);
        this.keyE = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.E
        );
        this.pressEText = this.add.text(0, 0, "Press E to open", {
            fontSize: "14px",
            backgroundColor: "#000",
            color: "#fff",
            padding: { x: 6, y: 3 }
        }).setDepth(1000).setVisible(false);

        this.physics.add.collider(this.player, walls);

        this.playerInsideLectureRoom = false;
        this.playerInsideDressingRoom = false;
        this.closetHint = this.add.text(0, 0, "Open Closet", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: {
                left: 6,
                right: 6,
                top: 3,
                bottom: 3
            }
        });

        this.closetHint.setDepth(1000);
        this.closetHint.setVisible(false);
    }

    update() {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        // Keyboard movement
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
        if (this.closetImage && this.closetHint.visible) {
            this.closetHint.setPosition(pointer.x + 15, pointer.y + 15);
        }

        if (
            pointer.isDown &&
            this.playArea &&
            this.playArea.contains(pointer.x, pointer.y)
        ) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                pointer.x,
                pointer.y
            );

            if (distance > 10) {
                this.physics.moveToObject(this.player, pointer, 160);
            }
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

        // Show/hide closet button and glow based on dressing room presence
        if (this.ppeRoomZone) {
            const inside = playerIsInsideZone(this.player, this.ppeRoomZone);

            if (inside && !this.playerInsideDressingRoom) {
                if (this.closetImage) {
                    this.closetImage.setVisible(true);
                    this.closetImage.setInteractive({useHandCursor: true});
                }

                if (this.closetGlow) {
                    this.closetGlow.setVisible(true);

                    if (this.closetGlowTween) {
                        this.closetGlowTween.resume();
                    }
                }

                this.playerInsideDressingRoom = true;
            } else if (!inside && this.playerInsideDressingRoom) {
                if (this.closetImage) {
                    this.closetImage.setVisible(false);
                    this.closetImage.disableInteractive();
                }

                if (this.closetGlow) {
                    this.closetGlow.setVisible(false);

                    if (this.closetGlowTween) {
                        this.closetGlowTween.pause();
                    }
                }


                this.playerInsideDressingRoom = false;
            }

            // Open with E
            if (
                inside &&
                Phaser.Input.Keyboard.JustDown(this.keyE)
            ) {
                window.dispatchEvent(new Event('closet-popup-opened'));
            }
            const closetCenter = this.closetZone
                ? {
                    x: this.closetZone.x + 35,
                    y: this.closetZone.y + 60
                }
                : null;

            if (closetCenter) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x,
                    this.player.y,
                    closetCenter.x,
                    closetCenter.y
                );

                const closeEnough = dist < 90;

                if (closeEnough) {
                    this.pressEText.setVisible(true);
                    this.pressEText.setPosition(
                        closetCenter.x - 40,
                        closetCenter.y - 80
                    );
                } else {
                    this.pressEText.setVisible(false);
                }
            } else {
                this.pressEText.setVisible(false);
            }
        }
    }
}

export default MainScene;