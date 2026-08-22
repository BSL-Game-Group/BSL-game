import Phaser from 'phaser';
import { createRooms } from './rooms';
import microbeService from '../../services/microbes';
import { notifyRoomEntry } from '../services/tracking';
import { createLabFloor } from '../environment/EnvironmentBuilder';
import HintManager from '../managers/HintManager';
import { EventBus } from '../EventBus';
import DoorGroup from '../groups/DoorGroup.js';
import { loadSavedGame, savePlayerPosition } from '../../state/savedGame';
import { getOrCreateSessionId } from '../../state/session';
import { loadAssets } from '../assets/loadAssets.js';
import { isTypingInField } from '../utils/isTypingInField';
import EquipmentManager from "../player/EquipmentManager";
import PlayerController from "../player/PlayerController";
import { PLAYER_CONFIG, DOORS_CONFIG } from '../config/constants';

// Interactions
import { LectureInteraction } from '../interactions/LectureInteraction';
import { ExitInteraction } from '../interactions/ExitInteraction';
import { DressingRoomInteraction } from '../interactions/DressingRoomInteraction';
import { BslInteraction } from '../interactions/BslInteraction';
import { InfoInteraction } from '../interactions/InfoInteraction';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.notifyRoomEntry = notifyRoomEntry;
    }

    preload() {
        loadAssets(this);
    }

    create() {
        this.savedGame = loadSavedGame();

        const walls = createRooms(this);
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);
        this.playArea = new Phaser.Geom.Rectangle(0, 0, gameWidth, gameHeight);

        createLabFloor(this);

        // The id is owned by state/session.js so the login UI can read it before
        // this scene exists. Publishing it on __gameData keeps notifyRoomEntry and
        // the Playwright fixture working unchanged.
        if (!window.__gameData?.sessionId) {
            window.__gameData = { ...window.__gameData, sessionId: getOrCreateSessionId() };
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
        this.bslHint = this.hintManager.bslHint;
        this.doorHint = this.hintManager.doorHint;
        this.openmicrobeInfoHint = this.hintManager.openmicrobeInfoHint;
        
        Object.defineProperty(this, 'exitPromptText', {
            get: () => this.hintManager.exitPromptText
        });

        // Apply initial translations
        this.hintManager.updateTranslations({
            pressEToOpen: window.__translations?.pressEToOpen ?? 'Press E to open',
            openCloset: window.__translations?.openCloset ?? 'Open Closet',
            pressE: window.__translations?.pressE ?? 'Press E',
            washUp: window.__translations?.washUp ?? 'Press R or click to wash up',
            closeTheDoorBehindYouFirst: window.__translations?.closeTheDoorBehindYouFirst ?? 'Close the door behind you first.',
            openmicrobeInfoHint: window.__translations?.openMicrobeInfo ?? 'Press E for microbe info',
            pressEOrClick: window.__translations?.pressEOrClick ?? 'Press E or click',
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

        // Anything that mirrors the player's position has to run here rather
        // than in update(). Arcade Physics integrates the body during the
        // scene's UPDATE event but only copies the result onto the player
        // sprite in Body.postUpdate, which runs on POST_UPDATE — i.e. after
        // update() has already returned. Positioning equipment from update()
        // therefore used last frame's player position, leaving it a frame
        // (~2.7px at 160px/s and 60fps) behind the body on screen.
        //
        // The physics plugin registers its own POST_UPDATE handler when the
        // scene starts, before create() runs, so this listener is called
        // after it and sees the synced position.
        this.handleScenePostUpdate = () => {
            this.equipmentManager?.updatePositions();
            this.playerController?.updateFollowers();
        };

        this.events.on('postupdate', this.handleScenePostUpdate);

        const cleanupListeners = () => {
            window.removeEventListener('equipment-changed', this.handleEquipmentChange);
            window.removeEventListener('popup-opened', this.handlePopupOpen);
            window.removeEventListener('popup-closed', this.handlePopupClosed);
            this.events.off('postupdate', this.handleScenePostUpdate);
            if (this.handleNewMicrobeRequest) {
                EventBus.off('request-current-microbe', this.handleNewMicrobeRequest);
            }
            
            // FIX: Clean up the random microbe listener that was previously missing
            EventBus.off('request-new-microbe', this.replaceCurrentMicrobeRandomly);

            if (this.handleTranslationsUpdate) {
                EventBus.off('translations-updated', this.handleTranslationsUpdate);
            }
        };

        // Ensure listeners are cleaned up whether the scene is just stopped or completely destroyed
        this.events.once('shutdown', cleanupListeners);
        this.events.once('destroy', cleanupListeners);

        // enableCapture defaults to true, which calls preventDefault() on the
        // native keydown for this key globally, regardless of DOM focus —
        // that silently ate "e"/"r" keystrokes typed into any text field on
        // the page (e.g. the login form's username input).
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R, false);
        
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

    update(time, delta) {
        // Guarded for isolated unit tests that bypass create()
        if (this.playerController) {
            this.playerController.update(time, delta);
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

        if (this.player && this.doors && !this.isPopupOpen) {
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

        // Equipment positioning deliberately lives in the POST_UPDATE handler
        // registered in create(), not here — see the comment there.

        if (this.interactions && !this.isPopupOpen) {
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

            // The BSL4 <-> airlock2 door (id 1) and the BSL3 airlock <-> BSL-3
            // room door (id 2): both gate entry to their room on being closed
            // before a microbe can be examined (see BslInteraction).
            this.bsl4Door = doorInstances[1];
            this.bsl3Door = doorInstances[2];

            return doorsGroup;
        }

    handleDoorInteraction(player, zone) {
        const door = zone.parentDoor;
        this.hintManager.showDoorHint(door);

        const ePressed =
            this.keyE &&
            Phaser.Input.Keyboard.JustDown(this.keyE) &&
            !this.keyE.ctrlKey &&
            !this.keyE.metaKey &&
            !this.keyE.altKey;

        const mouseClicked = door.wasClicked;

        if ((!ePressed && !mouseClicked) || isTypingInField()) {
            return;
        }

        door.wasClicked = false;

        if (door === this.bsl4Door) {
            this.handleBsl4DoorPress(door);
            return;
        }

        const doorStateChanged = door.tryToChangeDoorState();
        if (!doorStateChanged) {
            this.hintManager.showDoorFeedback(door);
        }
    }

    // Entering BSL-4 is unrestricted — the suiting-up prompt fires once the
    // player steps into the room itself (see BslInteraction). Leaving is the
    // only gated direction: closing an open door is always allowed, but
    // opening a closed one while still suited means stripping the suit first.
    handleBsl4DoorPress(door) {
        if (door.isOpen) {
            door.tryToChangeDoorState();
            return;
        }

        if (this.bsl4Occupied && window.__bsl4Suited) {
            window.dispatchEvent(new Event('bsl4-undress-required'));
            return;
        }

        const doorStateChanged = door.tryToChangeDoorState();
        if (!doorStateChanged) {
            this.hintManager.showDoorFeedback(door);
        }
    }
}

export default MainScene;