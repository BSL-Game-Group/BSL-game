import Phaser from 'phaser';
import { createRooms } from './rooms';
import microbeService from '../../services/microbes'
import { EventBus } from '../EventBus'
import DoorGroup from '../groups/DoorGroup.js';

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

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async notifyRoomEntry(roomKey) {
        try {
            const sessionId = window.__gameData?.sessionId;
            if (!sessionId) {
                return;
            }

            const backendUrl = this.getBackendUrl();
            const response = await fetch(`${backendUrl}/api/rooms/enter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    room_key: roomKey,
                    session_id: sessionId,
                }),
            });

            if (!response.ok) {
                return;
            }

            await response.json();
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            // Silently fail - room entry is not critical to gameplay
        }
    }

    getBackendUrl() {
        // Try process.env first (set by build tools)
        if (process.env.VITE_API_URL) {
            return process.env.VITE_API_URL;
        }

        // Fallback: use current window location to determine backend URL
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;

            // If running on localhost, use localhost:3001
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'http://localhost:3001';
            }

            // In OpenShift/Kubernetes/Docker, use backend service name
            return `${protocol}//backend:3001`;
        }

        // Jest/Node environment fallback
        return 'http://localhost:3001';
    }

    preload() {
        // Player base
        this.load.image('player_base', 'assets/player/base.png');
        this.load.image('head_only', 'assets/player/head_only.png');
        this.load.image('no_hair', 'assets/player/no_hair.png');

        // Equipment
        this.load.image('lab_coat', 'assets/equipment/on_character/body/lab_coat_on.png');
        this.load.image('mask', 'assets/equipment/on_character/masks/mask_on.png');
        this.load.image('glasses', 'assets/equipment/on_character/eyewear/glasses_on.png');
        this.load.image('sunglasses', 'assets/equipment/on_character/eyewear/sunglasses_on.png');
        this.load.image('face_shield', 'assets/equipment/on_character/eyewear/face_shield_on.png');
        this.load.image('bsl3_respirator', 'assets/equipment/on_character/masks/bsl3_respirator_on.png');
        this.load.image('disposable_overall', 'assets/equipment/on_character/body/disposable_overall_on.png');
        this.load.image('dresser', 'assets/dresser.png');
        this.load.image('wood', 'assets/tiles/birchwood.png');
        this.load.image('labs_floor', 'assets/tiles/Labs-Floor.png');
        this.load.image('gloves', 'assets/equipment/on_character/gloves/gloves_on.png');
        this.load.image('gloves_2', 'assets/equipment/on_character/gloves/gloves_2_on.png');
        this.load.image('closable_lab_coat', 'assets/equipment/on_character/body/closable_lab_coat_on.png');
        this.load.image('pressurized_suit', 'assets/equipment/on_character/body/pressurized_suit_on.png');
        this.load.image('wow_helmet', 'assets/equipment/on_character/eyewear/wow_helmet_on.png');

        // Rooms
        this.load.image('bsl1_room', 'assets/rooms/BSL-1 ver. 4.png');
        this.load.image('lecture_room', 'assets/rooms/lecture_room2.png');
        this.load.image('bsl2_room', 'assets/rooms/BSL-2.jpg');
        this.load.image('bsl3_room', 'assets/rooms/BSL-3 ver. 2.png');
        this.load.image('bsl4_room', 'assets/rooms/BSL-4 ver. 2.png');
        this.load.image('air_systems', 'assets/rooms/air-systems.jpeg');
        this.load.image('dressing_room', 'assets/rooms/dressing-room.png');
        this.load.image('info_desk', 'assets/rooms/info-desk.png');
        this.load.image('exit_area', 'assets/rooms/exit_area.png');

        this.load.image('door_front', 'assets/doors/door_front.png');
        this.load.image('door_top', 'assets/doors/door_top.png');
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
                    // eslint-disable-next-line no-console
                    console.warn('wood source image not available when creating wood_tile');
                }
            } else {
                // eslint-disable-next-line no-console
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

    // Clinical tile floor for the labs side — everything right of the x:700 divider
    // (BSL rooms 1-4, the Labs room, the airlocks and the air system). The left,
    // human side (lecture/corridor/dressing/exit) keeps the wood floor.
    createLabFloor() {
        const startX = 700;
        const width = 1280 - startX;
        const height = 720;
        // Source tiles are ~442px; show them near 110px so the pattern reads at play scale.
        const tileScale = 110 / 442;

        const floor = this.add
            .tileSprite(startX, 0, width, height, 'labs_floor')
            .setOrigin(0, 0);
        floor.tileScaleX = tileScale;
        floor.tileScaleY = tileScale;
        // Above the wood floor (-10), below room art (-5), walls (0) and the player (10).
        floor.setDepth(-9);
    }

    create() {
        const walls = createRooms(this);
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
        this.playArea = new Phaser.Geom.Rectangle(0, 0, gameWidth, gameHeight);

        this.createWoodFloor();
        this.createLabFloor();

        // Initialize session ID if not already present
        if (!window.__gameData?.sessionId) {
            window.__gameData = { ...window.__gameData, sessionId: this.generateSessionId() };
        }

        // 1. Create the Base Player (start in the corridor hub)
        this.player = this.physics.add.sprite(590, 150, 'player_base');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.4);
        // Narrow but full-height collision body: narrow so the character moves
        // smoothly through doors and gaps, full height so the head is covered too
        // and it can't slip through walls.
        this.player.body.setSize(60, 205);
        this.player.body.setOffset(23, 6);
        this.player.setDepth(10);

        this.doors = this.initializeDoors(this.player);
        
        // 2. CONFIGURATION: Tweaking values for size and placement relative to player center
        // Adjust these numbers until your equipment aligns perfectly!
        this.equipmentConfig = {
            lab_coat: { scale: 0.05, offsetX: -1,  offsetY: 5 },
            mask:     { scale: 0.075, offsetX: -1,  offsetY: -20 },
            glasses:  { scale: 0.07, offsetX: -0.85,  offsetY: -27.5 },
            face_shield: { scale: 0.03, offsetX: -0.5, offsetY: -28 },
            bsl3_respirator: { scale: 0.04, offsetX: -1, offsetY: -25 },
            sunglasses: { scale: 0.07, offsetX: -0.85,  offsetY: -27.5 },
            disposable_overall: { scale: 0.065, offsetX: -0.95,  offsetY: 5 },
            gloves: { scale: 0.085, offsetX: -1.5, offsetY: 14 },
            gloves_2: { scale: 0.085, offsetX: -1.5, offsetY: 14 },
            closable_lab_coat: { scale: 0.33, offsetX: -1,  offsetY: 7 },
            pressurized_suit: { scale: 0.085, offsetX: 0,  offsetY: 0 },
            wow_helmet: { scale: 0.1, offsetX: -2,  offsetY: -31 }
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
                .setDepth(13),
            face_shield: this.add.sprite(700, 300, 'face_shield')
                .setScale(this.equipmentConfig.face_shield.scale)
                .setVisible(false)
                .setDepth(14),
            bsl3_respirator: this.add.sprite(700, 300, 'bsl3_respirator')
                .setScale(this.equipmentConfig.bsl3_respirator.scale)
                .setVisible(false)
                .setDepth(15),
            sunglasses: this.add.sprite(700, 300, 'sunglasses')
                .setScale(this.equipmentConfig.sunglasses.scale)
                .setVisible(false)
                .setDepth(16),
            disposable_overall: this.add.sprite(700, 300, 'disposable_overall')
                .setScale(this.equipmentConfig.disposable_overall.scale)
                .setVisible(false)
                .setDepth(13),
            gloves: this.add.sprite(700, 300, 'gloves')
                .setScale(this.equipmentConfig.gloves.scale)
                .setVisible(false)
                .setDepth(12),
            gloves_2: this.add.sprite(700, 300, 'gloves_2')
                .setScale(this.equipmentConfig.gloves_2.scale)
                .setVisible(false)
                .setDepth(13),
            closable_lab_coat: this.add.sprite(700, 300, 'closable_lab_coat')
                .setScale(this.equipmentConfig.closable_lab_coat.scale)
                .setVisible(false)
                .setDepth(11),
            pressurized_suit: this.add.sprite(700, 300, 'pressurized_suit')
                .setScale(this.equipmentConfig.pressurized_suit.scale)
                .setVisible(false)
                .setDepth(11),
            wow_helmet: this.add.sprite(700, 300, 'wow_helmet')
                .setScale(this.equipmentConfig.wow_helmet.scale)
                .setVisible(false)
                .setDepth(13)
        };

        // 4. Listen for React's CustomEvent
        this.handleEquipmentChange = (e) => {
            const equipped = e.detail; 
            this.equipment.lab_coat.setVisible(equipped.lab_coat);
            this.equipment.mask.setVisible(equipped.mask);
            this.equipment.glasses.setVisible(equipped.glasses);
            this.equipment.face_shield.setVisible(equipped.face_shield);
            this.equipment.bsl3_respirator.setVisible(equipped.bsl3_respirator);
            this.equipment.sunglasses.setVisible(equipped.sunglasses);
            this.equipment.disposable_overall.setVisible(equipped.disposable_overall);
            this.equipment.gloves.setVisible(equipped.gloves);
            this.equipment.gloves_2.setVisible(equipped.gloves_2);
            this.equipment.closable_lab_coat.setVisible(equipped.closable_lab_coat);
            this.equipment.pressurized_suit.setVisible(equipped.pressurized_suit);
            this.equipment.wow_helmet.setVisible(equipped.wow_helmet);

            // Swap the player base texture based on pressurized suit or disposable overall state
            if (equipped.pressurized_suit || equipped.disposable_overall) {
                this.player.setTexture('head_only');
            } else if (equipped.wow_helmet) {
                this.player.setTexture('no_hair');
            } else {
                this.player.setTexture('player_base');
            }
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
            if (this.handleNewMicrobeRequest) {
                EventBus.off('request-new-microbe', this.handleNewMicrobeRequest);
            }
            if (this.handleTranslationsUpdate) {
                EventBus.off('translations-updated', this.handleTranslationsUpdate);
            }
        });

        // Setup inputs, text and colliders
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        this.pressEText = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#000",
            color: "#fff",
            padding: { x: 6, y: 3 }
        }).setDepth(1000).setVisible(false);
        this.exitPromptText = 'Press E to exit';

        this.physics.add.collider(this.player, walls);


        this.playerInsideLectureRoom = false;
        this.playerInsideExitRoom = false;
        this.playerInsideDressingRoom = false;
        this.playerInsideAirlock2 = false;
        this.closetHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

        // Proximity hint over the quick-undress spot, reminding the player to wash up.
        this.undressHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

        // Proximity hint under the airlock2 decon spot.
        this.airlockWashHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

        // Hint shown near a BSL room's blue glow while the player is inside it.
        this.bslHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#000",
            color: "#fff",
            padding: { x: 6, y: 3 }
        }).setDepth(1000).setVisible(false);
        
        this.currentMicrobe = null;
        this.registerEventBusListeners();
        this.updateTextTranslations({
            pressEToOpen: window.__translations?.pressEToOpen ?? 'Press E to open',
            openCloset: window.__translations?.openCloset ?? 'Open Closet',
            pressE: window.__translations?.pressE ?? 'Press E',
            washUp: window.__translations?.washUp ?? 'Press R or click to wash up',
            airlockWash: window.__translations?.airlockWash ?? 'Press R or click to decontaminate'
        })
        this.replaceCurrentMicrobeRandomly()
    }

    // Wire EventBus listeners the scene owns. React (App) asks for a fresh
    // microbe after each answer; the scene stays the single source of truth.
    registerEventBusListeners() {
        this.handleNewMicrobeRequest = () => {
            if (this.currentMicrobe) {
                EventBus.emit('current-microbe-updated', this.currentMicrobe)
            }
        }
        EventBus.on('request-new-microbe', this.replaceCurrentMicrobeRandomly)

        // Add this listener:
        EventBus.on('request-current-microbe', this.handleNewMicrobeRequest)

        this.handleTranslationsUpdate = (translations) => this.updateTextTranslations(translations)
        EventBus.on('translations-updated', this.handleTranslationsUpdate)
    }

    updateTextTranslations(translations) {
        if (this.pressEText) {
            this.pressEText.setText(translations.pressEToOpen)
        }
        if (this.closetHint) {
            this.closetHint.setText(translations.openCloset)
        }
        if (this.undressHint) {
            this.undressHint.setText(translations.washUp)
        }
        if (this.airlockWashHint) {
            this.airlockWashHint.setText(translations.airlockWash)
        }
        if (this.bslHint) {
            this.bslHint.setText(translations.pressE)
        }
        if (translations.exitPrompt) {
            this.exitPromptText = translations.exitPrompt
        }
        if (this.doorHint) {
            this.doorHint.setText(translations.pressE)
        }
    }

    //Exit interaction
    updateExitInteraction() {
        if (!this.exitGlow || !this.exitZone || !this.exitButtonPoint) {
            return;
        }

        const inside = playerIsInsideZone(this.player, this.exitZone);
        this.exitGlow.setVisible(inside);

        if (this.exitGlowTween) {
            if (inside) {
                this.exitGlowTween.resume();
            } else {
                this.exitGlowTween.pause();
            }
        }

        if (!inside) {
            this.pressEText?.setVisible(false);
            return;
        }

        const dist = Phaser.Math.Distance.Between(
            this.player.x,
            this.player.y,
            this.exitButtonPoint.x,
            this.exitButtonPoint.y
        );
        const closeEnough = dist < 95;

        if (closeEnough) {
            this.pressEText?.setVisible(true);
            this.pressEText?.setText(this.exitPromptText || 'Press E to exit');
            this.pressEText?.setPosition(this.exitButtonPoint.x - 50, this.exitButtonPoint.y - 45);
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                window.dispatchEvent(new Event('exit-popup-opened'));
            }
        } else {
            this.pressEText?.setVisible(false);
        }
    }

    async replaceCurrentMicrobeRandomly() {
        const microbe = await microbeService.getRandom()
        if (microbe === null) {
            return
        }
        this.currentMicrobe = microbe
        EventBus.emit('current-microbe-updated', microbe)
    }

    update() {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);

        if (this.player.body.embedded || (this.player.body.touching.none && this.player.body.wasTouching.none)) {
            if (!this.physics.overlap(this.player, this.doors)) {
                this.doorHint.setVisible(false);
            }
        }
        this.physics.overlap(this.player, this.doors, this.handleDoorInteraction, null, this);

        // Change BSL-1 image depth depending on player position
        if (this.bsl1Image) {
            if (this.player.y < 505) {
                this.bsl1Image.setDepth(20);
            } else {
                this.bsl1Image.setDepth(-5);
            }
        }

        // Change BSL-3 image depth depending on player position
        if (this.bsl3Image) {
            if (this.player.y < 505) {
                this.bsl3Image.setDepth(20);
            } else {
                this.bsl3Image.setDepth(-5);
            }
        }

        // Same trick for the dressing room (top door at y:430): its front occludes
        // the player at the doorway, then drops behind once they step inside.
        if (this.dressingImage) {
            if (this.player.y < 465) {
                this.dressingImage.setDepth(20);
            } else {
                this.dressingImage.setDepth(-5);
            }
        }

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
        if (this.closetHint && this.closetHint.visible) {
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
            this.equipment.face_shield.setPosition(
                this.player.x + this.equipmentConfig.face_shield.offsetX, 
                this.player.y + this.equipmentConfig.face_shield.offsetY
            );
            this.equipment.bsl3_respirator.setPosition(
                this.player.x + this.equipmentConfig.bsl3_respirator.offsetX, 
                this.player.y + this.equipmentConfig.bsl3_respirator.offsetY
            );
            this.equipment.sunglasses.setPosition(
                this.player.x + this.equipmentConfig.sunglasses.offsetX,
                this.player.y + this.equipmentConfig.sunglasses.offsetY
            );
            this.equipment.disposable_overall.setPosition(
                this.player.x + this.equipmentConfig.disposable_overall.offsetX,
                this.player.y + this.equipmentConfig.disposable_overall.offsetY
            );
            this.equipment.gloves.setPosition(
                this.player.x + this.equipmentConfig.gloves.offsetX,
                this.player.y + this.equipmentConfig.gloves.offsetY
            );
            this.equipment.gloves_2.setPosition(
                this.player.x + this.equipmentConfig.gloves_2.offsetX,
                this.player.y + this.equipmentConfig.gloves_2.offsetY
            );
            this.equipment.closable_lab_coat.setPosition(
                this.player.x + this.equipmentConfig.closable_lab_coat.offsetX,
                this.player.y + this.equipmentConfig.closable_lab_coat.offsetY
            );
            this.equipment.pressurized_suit.setPosition(
                this.player.x + this.equipmentConfig.pressurized_suit.offsetX,
                this.player.y + this.equipmentConfig.pressurized_suit.offsetY
            );
            this.equipment.wow_helmet.setPosition(
                this.player.x + this.equipmentConfig.wow_helmet.offsetX,
                this.player.y + this.equipmentConfig.wow_helmet.offsetY
            );
        }

        // Lecture room: the microbe task panel shows as soon as the player walks in.
        // The lecture-materials section only unlocks once they walk up to the info
        // point and press E — same glow + hint pattern as the other interactables.
        if (this.lectureRoomZone) {
            const inside = playerIsInsideZone(this.player, this.lectureRoomZone);
            if (inside && !this.playerInsideLectureRoom) {
                window.dispatchEvent(new Event('lecture-room-entered'));
                this.playerInsideLectureRoom = true;
            } else if (!inside) {
                this.playerInsideLectureRoom = false;
            }
        }
        if (this.exitZone) {
            const inside = playerIsInsideZone(this.player, this.exitZone);

            if (inside && !this.playerInsideExitRoom) {
                this.playerInsideExitRoom = true;
            } else if (!inside && this.playerInsideExitRoom) {
                this.playerInsideExitRoom = false;
            }
        }

        if (this.lectureGlow && this.lecturePoint && this.lectureRoomZone) {
            const inside = playerIsInsideZone(this.player, this.lectureRoomZone);
            this.lectureGlow.setVisible(inside);
            if (this.lectureGlowTween) {
                if (inside) { this.lectureGlowTween.resume(); } else { this.lectureGlowTween.pause(); }
            }

            if (inside) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, this.lecturePoint.x, this.lecturePoint.y
                );
                const closeEnough = dist < 100;

                if (closeEnough) {
                    this.pressEText.setVisible(true);
                    // Below the glow (it sits near the top of the room, so a hint
                    // above it would clip off-screen — same fix as the top BSL rooms).
                    this.pressEText.setPosition(this.lecturePoint.x - 40, this.lecturePoint.y + 45);
                    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                        window.dispatchEvent(new Event('lecture-materials-unlocked'));
                    }
                } else {
                    this.pressEText.setVisible(false);
                }
            } else {
                this.pressEText.setVisible(false);
            }
        }

        this.updateExitInteraction();

        if (this.ppeRoomZone) {
            const inside = playerIsInsideZone(this.player, this.ppeRoomZone);

            // Only the glow is toggled here. The click target (closetHit) stays
            // interactive and renderable for the whole scene — Phaser skips input on
            // anything that would not render, so hiding it here left the circle
            // permanently unclickable. Its handlers check playerInsideDressingRoom.
            if (inside && !this.playerInsideDressingRoom) {
                if (this.closetGlow) {
                    this.closetGlow.setVisible(true);
                    if (this.closetGlowTween) {
                        this.closetGlowTween.resume();
                    }
                }
                if (this.undressGlow) {
                    this.undressGlow.setVisible(true);
                    if (this.undressGlowTween) {
                        this.undressGlowTween.resume();
                    }
                }
                this.playerInsideDressingRoom = true;
            } else if (!inside && this.playerInsideDressingRoom) {
                if (this.closetGlow) {
                    this.closetGlow.setVisible(false);
                    if (this.closetGlowTween) {
                        this.closetGlowTween.pause();
                    }
                }
                if (this.undressGlow) {
                    this.undressGlow.setVisible(false);
                    if (this.undressGlowTween) {
                        this.undressGlowTween.pause();
                    }
                }
                this.playerInsideDressingRoom = false;
            }

            if (inside && Phaser.Input.Keyboard.JustDown(this.keyE)) {
                window.dispatchEvent(new Event('closet-popup-opened'));
            }

            // R washes up / quick-undresses from anywhere in the dressing room —
            // same reach as the closet's E, no need to stand exactly on the glow.
            if (inside && Phaser.Input.Keyboard.JustDown(this.keyR)) {
                window.dispatchEvent(new Event('quick-undress'));
            }

            // Only this room's own presence (`inside`) may hide the shared hint text —
            // otherwise this always-running block stomps on the other rooms' hints
            // (e.g. the lecture info point) every frame regardless of where the player is.
            if (inside) {
                const closetCenter = this.closetZone ? { x: this.closetZone.x + 35, y: this.closetZone.y + 60 } : null;
                const dist = closetCenter
                    ? Phaser.Math.Distance.Between(this.player.x, this.player.y, closetCenter.x, closetCenter.y)
                    : Infinity;
                const closeEnough = Boolean(closetCenter) && dist < 90;

                this.pressEText.setVisible(closeEnough);
                if (closeEnough) {
                    this.pressEText.setPosition(closetCenter.x - 40, closetCenter.y - 80);
                }
            }

            // Same proximity-hint pattern for the wash-up spot, but on its own text
            // object (undressHint) so it doesn't fight the closet's pressEText when
            // both interactables are visible in the same room.
            if (inside && this.undressHint && this.undressPoint) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, this.undressPoint.x, this.undressPoint.y
                );
                const closeEnough = dist < 110;

                this.undressHint.setVisible(closeEnough);
                if (closeEnough) {
                    this.undressHint.setPosition(this.undressPoint.x - 60, this.undressPoint.y - 90);
                }
            }
        }

        // Airlock2 wash-up point: same enter/exit tracking as the dressing room's
        // closet. The reminder fires as soon as the player arrives — a nudge to
        // use the green decon spot before heading further out — not a scolding
        // after the fact.
        if (this.airlock2Zone) {
            const inside = playerIsInsideZone(this.player, this.airlock2Zone);

            if (inside && !this.playerInsideAirlock2) {
                if (this.airlockWashGlow) {
                    this.airlockWashGlow.setVisible(true);
                    if (this.airlockWashGlowTween) {
                        this.airlockWashGlowTween.resume();
                    }
                }
                this.playerInsideAirlock2 = true;
                window.dispatchEvent(new Event('airlock-wash-reminder'));
            } else if (!inside && this.playerInsideAirlock2) {
                if (this.airlockWashGlow) {
                    this.airlockWashGlow.setVisible(false);
                    if (this.airlockWashGlowTween) {
                        this.airlockWashGlowTween.pause();
                    }
                }
                this.playerInsideAirlock2 = false;
            }

            // R washes up from anywhere in airlock2, same reach as the dressing
            // room's R — no need to stand exactly on the glow.
            if (inside && Phaser.Input.Keyboard.JustDown(this.keyR)) {
                window.dispatchEvent(new Event('airlock-decon'));
            }

            // Proximity hint, positioned BELOW the glow (unlike the dressing
            // room's, which sits above its point).
            if (inside && this.airlockWashHint && this.airlockWashPoint) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, this.airlockWashPoint.x, this.airlockWashPoint.y
                );
                const closeEnough = dist < 90;

                this.airlockWashHint.setVisible(closeEnough);
                if (closeEnough) {
                    this.airlockWashHint.setPosition(this.airlockWashPoint.x - 320, this.airlockWashPoint.y + 30);
                }
            }
        }

        // Info point: only active in the corridor. Show the glow and a Press E hint
        // there, and open the how-to-play popup on E.
        if (this.infoGlow && this.corridorZone && this.infoPoint) {
            const inCorridor = playerIsInsideZone(this.player, this.corridorZone);
            this.infoGlow.setVisible(inCorridor);
            if (this.infoGlowTween) {
                if (inCorridor) { this.infoGlowTween.resume(); } else { this.infoGlowTween.pause(); }
            }
            if (inCorridor) {
                this.pressEText.setVisible(true);
                this.pressEText.setPosition(this.infoPoint.x - 40, this.infoPoint.y - 45);
                if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                    window.dispatchEvent(new Event('info-popup-opened'));
                }
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
                    this.notifyRoomEntry(entry.key);
                } else if (!inside && entry.playerInside) {
                    entry.glow.setVisible(false);
                    entry.tween.pause();
                    entry.playerInside = false;
                }

                if (inside) {
                    activeCenter = entry.center;

                    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {

                        if (!window.__lectureOpen) {
                            window.dispatchEvent(new Event('lecture-required'));
                        } else {
                            window.dispatchEvent(
                                new CustomEvent('answer-popup-opened', {
                                    detail: { level: entry.key }
                                })
                            );
                        }
                    }
                }
            }

            if (this.bslHint) {
                if (activeCenter) {
                    // Top-row rooms (glow near the screen top) would push the hint
                    // off-screen / behind the wall, so show it below the glow there.
                    const hintY = activeCenter.y > 80
                        ? activeCenter.y - 48   // room lower down: hint above the glow
                        : activeCenter.y + 36;  // top room: hint below the glow
                    this.bslHint.setVisible(true);
                    this.bslHint.setPosition(activeCenter.x - 28, hintY);
                } else {
                    this.bslHint.setVisible(false);
                }
            }
        }
    }

    initializeDoors(player) {
        const doors = new DoorGroup(this);
        let config = {
            triggerZoneY: 260,
            bodyXOffset: 75,
            bodyYOffset: 105,
            bodyHeight: 9
        }
        const door1 = doors.addDoor(1200, 280, 'door_front', config).setScale(0.25);
        config = {
            triggerZoneY: 490,
            bodyXOffset: 75,
            bodyYOffset: 95,
            bodyHeight: 9
        }
        const door2 = doors.addDoor(1005, 515, 'door_front', config).setScale(0.25);
        this.physics.add.collider(player, doors.solidSprites);

        config = {
            triggerZoneWidth: 40,
            triggerZoneHeight: 40,
            bodyWidth: 9
        }
        const door3 = doors.addDoor(1110, 305, 'door_top', config).setScale(0.5);
        const door4 = doors.addDoor(965, 305, 'door_top', config).setScale(0.5);
        const door5 = doors.addDoor(965, 415, 'door_top', config).setScale(0.5);

        door1.addAirlockDoorPair(door3);
        door3.addAirlockDoorPair(door1);

        door3.addAirlockDoorPair(door4);
        door4.addAirlockDoorPair(door3);

        door2.addAirlockDoorPair(door5);
        door5.addAirlockDoorPair(door2);

        this.doorHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#000",
            color: "#fff",
            padding: { x: 6, y: 3 }
        }).setDepth(1000).setVisible(false);

        return doors;
    }

    handleDoorInteraction(player, zone) {
        const door = zone.parentDoor;
        this.doorHint.setVisible(true);
        this.doorHint.setPosition(door.x, door.y);
        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
            door.tryToChangeDoorState();
        }
    }
}

export default MainScene;
