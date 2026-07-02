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
        this.load.image('player_base', 'assets/player/base.png');
        this.load.image('lab_coat', 'assets/equipment/equipment_on_character/lab_coat.png');
        this.load.image('mask', 'assets/equipment/equipment_on_character/mask.png');
        this.load.image('glasses', 'assets/equipment/equipment_on_character/glasses.png');
        this.load.image('dresser', 'assets/dresser.png');
        this.load.image('wood', 'assets/tiles/wood.png');
    }

    createWoodFloor() {
        const tileSize = 64;

        if (!this.textures.exists('wood_tile')) {
            const woodTex = this.textures.get('wood');
            if (woodTex) {
                const woodSrc = woodTex.getSourceImage();
                if (woodSrc) {
                    const tileTexture = this.textures.createCanvas('wood_tile', tileSize, tileSize);
                    const ctx = tileTexture.getContext();
                    const srcW = woodSrc.naturalWidth || woodSrc.width;
                    const srcH = woodSrc.naturalHeight || woodSrc.height;
                    // Draw the entire source image scaled down to the tile size (no cropping)
                    ctx.drawImage(woodSrc, 0, 0, srcW, srcH, 0, 0, tileSize, tileSize);
                    tileTexture.refresh();
                } else {
                    console.warn('wood source image not available when creating wood_tile');
                }
            } else {
                console.warn('wood texture not found when creating wood_tile');
            }
        }

        const mapWidth = Math.ceil(this.playArea.width / tileSize);
        const mapHeight = Math.ceil(this.playArea.height / tileSize);

        const map = this.make.tilemap({
            width: mapWidth,
            height: mapHeight,
            tileWidth: tileSize,
            tileHeight: tileSize
        });

        const tileset = map.addTilesetImage('wood_tile', 'wood_tile', tileSize, tileSize, 0, 0);

        const layer = map.createBlankLayer(
            'wood_floor_layer',
            tileset,
            this.playArea.x,
            this.playArea.y
        );

        layer.fill(0, 0, 0, mapWidth, mapHeight);
        layer.setDepth(-10);
    }

    create() {
        const walls = createRooms(this);
        this.physics.world.setBounds(0, 0, 1280, 720);
        this.playArea = new Phaser.Geom.Rectangle(0, 0, 1280, 720);
        this.createWoodFloor();

        // 1. Create the Base Player
        this.player = this.physics.add.sprite(700, 300, 'player_base');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.4);
        this.player.setDepth(10); 

        // 2. CONFIGURATION: Tweaking values for size and placement relative to player center
        // Adjust these numbers until your equipment aligns perfectly!
        this.equipmentConfig = {
            lab_coat: { scale: 0.05, offsetX: -1,  offsetY: 5 },
            mask:     { scale: 0.075, offsetX: -1,  offsetY: -20 },
            glasses:  { scale: 0.07, offsetX: -0.85,  offsetY: -27.5 }
        };

        // 3. Create the Equipment Sprites using the configurations above
        this.equipment = {
            lab_coat: this.add.sprite(700, 300, 'lab_coat')
                .setScale(this.equipmentConfig.lab_coat.scale)
                .setVisible(false)
                .setDepth(11),
            mask: this.add.sprite(700, 300, 'mask')
                .setScale(this.equipmentConfig.mask.scale)
                .setVisible(false)
                .setDepth(12),
            glasses: this.add.sprite(700, 300, 'glasses')
                .setScale(this.equipmentConfig.glasses.scale)
                .setVisible(false)
                .setDepth(13)
        };

        // 4. Listen for React's CustomEvent
        this.handleEquipmentChange = (e) => {
            const equipped = e.detail; 
            this.equipment.lab_coat.setVisible(equipped.lab_coat);
            this.equipment.mask.setVisible(equipped.mask);
            this.equipment.glasses.setVisible(equipped.glasses);
        };
        window.addEventListener('equipment-changed', this.handleEquipmentChange);

        // Clean up event listener if the scene ever restarts/destroys
        this.events.on('shutdown', () => {
            window.removeEventListener('equipment-changed', this.handleEquipmentChange);
        });

        // NEW: Track if the React popup is open
        this.isPopupOpen = false;

        this.handlePopupOpen = () => { this.isPopupOpen = true; };
        this.handlePopupClosed = () => { this.isPopupOpen = false; };

        window.addEventListener('popup-opened', this.handlePopupOpen);
        window.addEventListener('popup-closed', this.handlePopupClosed);

        // Clean up event listeners if the scene ever restarts/destroys
        this.events.on('shutdown', () => {
            window.removeEventListener('equipment-changed', this.handleEquipmentChange);
            window.removeEventListener('popup-opened', this.handlePopupOpen);
            window.removeEventListener('popup-closed', this.handlePopupClosed);
        });

        // Setup inputs, text and colliders
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
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
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

        // Hint shown near a BSL room's blue glow while the player is inside it.
        this.bslHint = this.add.text(0, 0, "Press E", {
            fontSize: "14px",
            backgroundColor: "#000",
            color: "#fff",
            padding: { x: 6, y: 3 }
        }).setDepth(1000).setVisible(false);
    }

    update() {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        // 1. MOVEMENT CONTROLS (Locked when popup is open)
        if (!this.isPopupOpen) {
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

            // Mouse click movement tracking
            const pointer = this.input.activePointer;
            if (pointer.isDown && this.playArea && this.playArea.contains(pointer.x, pointer.y)) {
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pointer.x, pointer.y);
                if (distance > 10) {
                    this.physics.moveToObject(this.player, pointer, 160);
                }
            }
        } // <-- END OF POPUP CHECK

        // 2. UI HINTS (Always running)
        const pointer = this.input.activePointer;
        if (this.closetImage && this.closetHint.visible) {
            this.closetHint.setPosition(pointer.x + 15, pointer.y + 15);
        }

        // 3. EQUIPMENT GLUEING (Always running)
        // Keep this right here, outside the movement lock!
        if (this.equipment) {
            this.equipment.lab_coat.setPosition(
                this.player.x + this.equipmentConfig.lab_coat.offsetX, 
                this.player.y + this.equipmentConfig.lab_coat.offsetY
            );
            this.equipment.mask.setPosition(
                this.player.x + this.equipmentConfig.mask.offsetX, 
                this.player.y + this.equipmentConfig.mask.offsetY
            );
            this.equipment.glasses.setPosition(
                this.player.x + this.equipmentConfig.glasses.offsetX, 
                this.player.y + this.equipmentConfig.glasses.offsetY
            );
        }

        // Zone checks
        if (this.lectureRoomZone) {
            const inside = playerIsInsideZone(this.player, this.lectureRoomZone);
            if (inside && !this.playerInsideLectureRoom) {
                window.dispatchEvent(new Event('lecture-room-entered'));
                this.playerInsideLectureRoom = true;
            } else if (!inside) {
                this.playerInsideLectureRoom = false;
            }
        }

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

            if (inside && Phaser.Input.Keyboard.JustDown(this.keyE)) {
                window.dispatchEvent(new Event('closet-popup-opened'));
            }

            const closetCenter = this.closetZone ? { x: this.closetZone.x + 35, y: this.closetZone.y + 60 } : null;

            if (closetCenter) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, closetCenter.x, closetCenter.y);
                const closeEnough = dist < 90;

                if (closeEnough) {
                    this.pressEText.setVisible(true);
                    this.pressEText.setPosition(closetCenter.x - 40, closetCenter.y - 80);
                } else {
                    this.pressEText.setVisible(false);
                }
            } else {
                this.pressEText.setVisible(false);
            }
        }

        // BSL room interactables: show the blue glow while inside a BSL room,
        // and open the answer popup when E is pressed there.
        if (this.bslGlows) {
            let activeCenter = null;

            for (const entry of this.bslGlows) {
                const inside = playerIsInsideZone(this.player, entry.zone);

                if (inside && !entry.playerInside) {
                    entry.glow.setVisible(true);
                    entry.tween.resume();
                    entry.playerInside = true;
                } else if (!inside && entry.playerInside) {
                    entry.glow.setVisible(false);
                    entry.tween.pause();
                    entry.playerInside = false;
                }

                if (inside) {
                    activeCenter = entry.center;
                    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                        window.dispatchEvent(
                            new CustomEvent('answer-popup-opened', { detail: { level: entry.key } })
                        );
                    }
                }
            }

            if (this.bslHint) {
                if (activeCenter) {
                    this.bslHint.setVisible(true);
                    this.bslHint.setPosition(activeCenter.x - 28, activeCenter.y - 48);
                } else {
                    this.bslHint.setVisible(false);
                }
            }
        }
    }
}

export default MainScene;