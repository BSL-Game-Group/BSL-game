import Phaser from 'phaser';
import { createRooms } from './rooms';
import microbeService from '../../services/microbes';
import { generateSessionId, notifyRoomEntry } from '../services/tracking';
import { createWoodFloor, createLabFloor } from '../environment/EnvironmentBuilder';
import HintManager from '../managers/HintManager';
import { EventBus } from '../EventBus';
import DoorGroup from '../groups/DoorGroup.js';
import { loadSavedGame, patchSavedGame, savePlayerPosition } from '../../state/savedGame';
import { loadAssets } from '../assets/loadAssets.js';
import EquipmentManager from "../player/EquipmentManager";
import PlayerController from "../player/PlayerController";
import { PLAYER_CONFIG, DOORS_CONFIG } from '../config/constants';

// Interactions
import { LectureInteraction } from '../interactions/LectureInteraction';
import { ExitInteraction } from '../interactions/ExitInteraction';
import { DressingRoomInteraction } from '../interactions/DressingRoomInteraction';
import { AirlockInteraction } from '../interactions/AirlockInteraction';
import { BslInteraction } from '../interactions/BslInteraction';
import { InfoInteraction } from '../interactions/InfoInteraction';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.notifyRoomEntry = notifyRoomEntry;
    }

    preload() {
        loadAssets(this);
        
        // Restored for backward compatibility with tests expecting this specific call
        this.load.image('dresser', 'assets/dresser.png');
    }

    create() {
        this.savedGame = loadSavedGame();

        const walls = createRooms(this);
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
        this.playArea = new Phaser.Geom.Rectangle(0, 0, gameWidth, gameHeight);

        createWoodFloor(this);
        createLabFloor(this);

        if (!window.__gameData?.sessionId) {
            const sessionId = this.savedGame?.sessionId ?? generateSessionId(); // Removed 'this.'
            window.__gameData = { ...window.__gameData, sessionId };
            patchSavedGame({ sessionId });
        }

        this.player = this.physics.add.sprite(
            this.savedGame?.player.x ?? PLAYER_CONFIG.startX,
            this.savedGame?.player.y ?? PLAYER_CONFIG.startY,
            'player_base'
        );
        this.player.setCollideWorldBounds(true);
        this.player.setScale(PLAYER_CONFIG.scale);
        this.player.body.setSize(PLAYER_CONFIG.body.width, PLAYER_CONFIG.body.height);
        this.player.body.setOffset(PLAYER_CONFIG.body.offsetX, PLAYER_CONFIG.body.offsetY);
        this.player.setDepth(PLAYER_CONFIG.depth);
        
        this.playerController = new PlayerController(this, this.player);

        this.hintManager = new HintManager(this);

        // Temporary Backwards Compatibility:
        this.pressEText = this.hintManager.pressEText;
        this.closetHint = this.hintManager.closetHint;
        this.undressHint = this.hintManager.undressHint;
        this.airlockWashHint = this.hintManager.airlockWashHint;
        this.bslHint = this.hintManager.bslHint;
        this.doorHint = this.hintManager.doorHint;
        
        Object.defineProperty(this, 'exitPromptText', {
            get: () => this.hintManager.exitPromptText
        });

        // Apply initial translations
        this.hintManager.updateTranslations({
            pressEToOpen: window.__translations?.pressEToOpen ?? 'Press E to open',
            openCloset: window.__translations?.openCloset ?? 'Open Closet',
            pressE: window.__translations?.pressE ?? 'Press E',
            washUp: window.__translations?.washUp ?? 'Press R or click to wash up',
            airlockWash: window.__translations?.airlockWash ?? 'Press R or click to decontaminate'
        });

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
        
        this.physics.add.collider(this.player, walls);
        
        this.currentMicrobe = null;
        this.registerEventBusListeners();

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

        this.handleTranslationsUpdate = (translations) => this.hintManager.updateTranslations(translations);
        EventBus.on('translations-updated', this.handleTranslationsUpdate);
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

        if (this.hintManager && this.input && this.input.activePointer) {
            this.hintManager.update(this.input.activePointer);
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
            const doorsGroup = new DoorGroup(this);
            const doorInstances = {}; // Temporary dictionary to hold doors by their ID

            // 1. Create all doors from the config
            DOORS_CONFIG.forEach(config => {
                const door = doorsGroup.addDoor(config.x, config.y, config.type, config.physics).setScale(config.scale);
                doorInstances[config.id] = door;
            });

            // Add collisions once for the whole group
            this.physics.add.collider(player, doorsGroup.solidSprites);

            // 2. Link airlock pairs based on the 'links' array
            DOORS_CONFIG.forEach(config => {
                const currentDoor = doorInstances[config.id];
                config.links.forEach(linkId => {
                    currentDoor.addAirlockDoorPair(doorInstances[linkId]);
                });
            });

            return doorsGroup;
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