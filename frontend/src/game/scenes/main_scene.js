import Phaser from 'phaser';
import { createRooms } from './rooms';
import microbeService from '../../services/microbes';
import { EventBus } from '../EventBus';
import DoorGroup from '../groups/DoorGroup.js';
import { loadSavedGame, patchSavedGame, savePlayerPosition } from '../../state/savedGame';
import { loadAssets } from '../assets/loadAssets.js';
import EquipmentManager from "../player/EquipmentManager";
import PlayerController from "../player/PlayerController";

// Interactions
import { LectureInteraction } from '../interactions/LectureInteraction';
import { ExitInteraction } from '../interactions/ExitInteraction';
import { DressingRoomInteraction } from '../interactions/DressingRoomInteraction';
import { AirlockInteraction } from '../interactions/AirlockInteraction';
import { BslInteraction } from '../interactions/BslInteraction';
import { InfoInteraction } from '../interactions/InfoInteraction';

// Restored for backwards compatibility with legacy tests
export const playerIsInsideZone = (player, zone) => {
    if (!player || !zone) {
        return false;
    }
    return (
        player.x >= zone.x &&
        player.x <= zone.x + zone.width &&
        player.y >= zone.y &&
        player.y <= zone.y + zone.height
    );
};

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
        if (process.env.VITE_API_URL) {
            return process.env.VITE_API_URL;
        }
        if (typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'http://localhost:3001';
            }
            return `${protocol}//backend:3001`;
        }
        return 'http://localhost:3001';
    }

    preload() {
        loadAssets(this);
        
        // Restored for backward compatibility with tests expecting this specific call
        this.load.image('dresser', 'assets/dresser.png');
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

    createLabFloor() {
        const startX = 0;
        const width = 1280;
        const height = 720;
        const tileScale = 440 / 442;

        const floor = this.add
            .tileSprite(startX, 0, width, height, 'labs_floor')
            .setOrigin(0, 0);
        floor.tileScaleX = tileScale;
        floor.tileScaleY = tileScale;
        floor.setDepth(-9);
    }

    create() {
        this.savedGame = loadSavedGame();

        const walls = createRooms(this);
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
        this.playArea = new Phaser.Geom.Rectangle(0, 0, gameWidth, gameHeight);

        this.createWoodFloor();
        this.createLabFloor();

        if (!window.__gameData?.sessionId) {
            const sessionId = this.savedGame?.sessionId ?? this.generateSessionId();
            window.__gameData = { ...window.__gameData, sessionId };
            patchSavedGame({ sessionId });
        }

        this.player = this.physics.add.sprite(
            this.savedGame?.player.x ?? 590,
            this.savedGame?.player.y ?? 150,
            'player_base'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.4);
        this.player.body.setSize(60, 205);
        this.player.body.setOffset(23, 6);
        this.player.setDepth(10);
        
        this.playerController = new PlayerController(this, this.player);

        this.doors = this.initializeDoors(this.player);

        this.equipmentManager = new EquipmentManager(this, this.player);
        
        // Backward compatibility for tests expecting scene.equipment to exist
        this.equipment = this.equipmentManager.equipment || this.equipmentManager.sprites || {};

        this.handleEquipmentChange = (e) => {
            this.equipmentManager.setEquipment(e.detail);
        };

        window.addEventListener('equipment-changed', this.handleEquipmentChange);

        if (this.savedGame) {
            this.equipmentManager.setEquipment(this.savedGame.equipped);
        }

        this.events.on('shutdown', () => {
            window.removeEventListener('equipment-changed', this.handleEquipmentChange);
        });
        
        this.isPopupOpen = this.savedGame?.popups.closet ?? false;

        this.handlePopupOpen = () => { this.isPopupOpen = true; };
        this.handlePopupClosed = () => { this.isPopupOpen = false; };

        window.addEventListener('popup-opened', this.handlePopupOpen);
        window.addEventListener('popup-closed', this.handlePopupClosed);

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

        this.closetHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

        this.undressHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

        this.airlockWashHint = this.add.text(0, 0, "", {
            fontSize: "14px",
            backgroundColor: "#222222",
            color: "#ffffff",
            padding: { left: 6, right: 6, top: 3, bottom: 3 }
        }).setDepth(1000).setVisible(false);

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
        });

        if (this.savedGame?.microbe) {
            this.currentMicrobe = this.savedGame.microbe;
            EventBus.emit('current-microbe-updated', this.currentMicrobe);
        } else {
            this.replaceCurrentMicrobeRandomly();
        }

        this.interactions = [
            new LectureInteraction(this),
            new ExitInteraction(this),
            new DressingRoomInteraction(this),
            new AirlockInteraction(this),
            new BslInteraction(this),
            new InfoInteraction(this)
        ];

        this.seedPresenceFlags();
    }

    registerEventBusListeners() {
        this.handleNewMicrobeRequest = () => {
            if (this.currentMicrobe) {
                EventBus.emit('current-microbe-updated', this.currentMicrobe);
            }
        };
        EventBus.on('request-new-microbe', this.replaceCurrentMicrobeRandomly);
        EventBus.on('request-current-microbe', this.handleNewMicrobeRequest);

        this.handleTranslationsUpdate = (translations) => this.updateTextTranslations(translations);
        EventBus.on('translations-updated', this.handleTranslationsUpdate);
    }

    updateTextTranslations(translations) {
        if (this.pressEText) {
            this.pressEText.setText(translations.pressEToOpen);
        }
        if (this.closetHint) {
            this.closetHint.setText(translations.openCloset);
        }
        if (this.undressHint) {
            this.undressHint.setText(translations.washUp);
        }
        if (this.airlockWashHint) {
            this.airlockWashHint.setText(translations.airlockWash);
        }
        if (this.bslHint) {
            this.bslHint.setText(translations.pressE);
        }
        if (translations.exitPrompt) {
            this.exitPromptText = translations.exitPrompt;
        }
        if (this.doorHint) {
            this.doorHint.setText(translations.pressE);
        }
    }

    async replaceCurrentMicrobeRandomly() {
        const microbe = await microbeService.getRandom();
        if (microbe === null) {
            return;
        }
        this.currentMicrobe = microbe;
        EventBus.emit('current-microbe-updated', microbe);
    }

    seedPresenceFlags() {
        // Guarded for isolated unit tests
        if (this.interactions) {
            this.interactions.forEach(interaction => interaction.seedPresence());
        }
    }

    update() {
        // Guarded for isolated unit tests that bypass create()
        if (this.playerController) {
            this.playerController.update();
        }

        if (
            this.player && this.player.body &&
            (this.player.body.embedded ||
            (this.player.body.touching.none &&
            this.player.body.wasTouching.none))
        ) {
            if (this.doors && !this.physics.overlap(this.player, this.doors)) {
                if (this.doorHint) {
                    this.doorHint.setVisible(false);
                }
            }
        }

        if (this.player && this.doors) {
            this.physics.overlap(
                this.player,
                this.doors,
                this.handleDoorInteraction,
                null,
                this
            );
        }

        if (this.input && this.input.activePointer) {
            const pointer = this.input.activePointer;
            if (this.closetHint && this.closetHint.visible) {
                this.closetHint.setPosition(pointer.x + 15, pointer.y + 15);
            }
        }

        if (this.equipmentManager) {
            this.equipmentManager.updatePositions();
        }

        if (this.interactions) {
            this.interactions.forEach(interaction => interaction.update());
        }

        if (this.player) {
            savePlayerPosition(this.player.x, this.player.y);
        }
    }

    initializeDoors(player) {
        const doors = new DoorGroup(this);
        let config = { triggerZoneY: 260, bodyXOffset: 75, bodyYOffset: 105, bodyHeight: 9 };
        const door1 = doors.addDoor(1200, 280, 'door_front', config).setScale(0.25);
        
        config = { triggerZoneY: 490, bodyXOffset: 75, bodyYOffset: 95, bodyHeight: 9 };
        const door2 = doors.addDoor(1005, 515, 'door_front', config).setScale(0.25);
        this.physics.add.collider(player, doors.solidSprites);

        config = { triggerZoneWidth: 40, triggerZoneHeight: 40, bodyWidth: 9 };
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
            fontSize: "14px", backgroundColor: "#000", color: "#fff", padding: { x: 6, y: 3 }
        }).setDepth(1000).setVisible(false);

        return doors;
    }

    handleDoorInteraction(player, zone) {
        const door = zone.parentDoor;
        this.doorHint.setVisible(true);
        this.doorHint.setPosition(door.x, door.y);
        
        if (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE) && 
            !this.keyE.ctrlKey && !this.keyE.metaKey && !this.keyE.altKey) {
            door.tryToChangeDoorState();
        }
    }
}

export default MainScene;