export default class HintManager {
    constructor(scene) {
        this.scene = scene;

        // Define our common styles
        const baseStyle = { fontSize: "14px", color: "#ffffff", padding: { x: 6, y: 3 } };
        const darkStyle = { ...baseStyle, backgroundColor: "#000000" };
        const greyStyle = { ...baseStyle, backgroundColor: "#222222" };
        const redDarkStyle = {...baseStyle, backgroundColor: "#000000", color: "#e40e0e"};

        // Helper to quickly stamp out hints
        const createHint = (style) => {
            return this.scene.add.text(0, 0, "", style).setDepth(1000).setVisible(false);
        };

        // Create the hints using our styles.
        // Each interaction that shows a "Press E" prompt gets its own text object —
        // sharing one used to leak state between the closet, info point, and exit
        // (whichever ran last on a given frame won.)
        this.closetPressEText = createHint(darkStyle);
        this.infoPressEText = createHint(darkStyle);
        this.exitPressEText = createHint(darkStyle);
        this.bslHint = createHint(darkStyle);
        this.doorHint = createHint(darkStyle);
        this.doorFeedback = createHint(redDarkStyle);
        this.openmicrobeInfoHint = createHint(darkStyle);
        this.lectureMaterialHint = createHint(darkStyle);
        // Base "press E" label, kept separately so BslInteraction can prefix it
        // with the room key (e.g. "BSL-3 — Press E") without a translation
        // entry per BSL level.
        this.pressELabel = 'Press E';

        this.closetHint = createHint(greyStyle);
        this.undressHint = createHint(greyStyle);
    }

    updateTranslations(translations) {
        if (!translations) {
          return;}

        // DEFENSIVE GUARD: Abort if the Text objects have been destroyed by Phaser
        if (!this.closetPressEText || !this.closetPressEText.active) {
            return;
        }

        this.closetPressEText.setText(translations.closetPressE || 'Equipment closet — press E');
        this.infoPressEText.setText(translations.infoPressE || 'Info — press E');
        this.exitPressEText.setText(translations.exitPrompt || 'Press E to exit');
        this.closetHint.setText(translations.openCloset || 'Open Closet');
        this.undressHint.setText(translations.washUp || 'Press R or click to wash up');
        this.bslHint.setText(translations.pressE || 'Press E');
        // The door prompt names both inputs because a door can be clicked as
        // well as pressed; the other hints stay keyboard-only wording.
        this.doorHint.setText(translations.pressEOrClick || 'Press E or click');
        this.doorFeedback.setText(translations.closeTheDoorBehindYouFirst || 'Close the door behind you first.');
        this.openmicrobeInfoHint.setText(translations.openMicrobeInfoHint || 'Microbe info — press E');
        this.lectureMaterialHint.setText(translations.lectureMaterialHint || 'Lecture material — press E');

        this.pressELabel = translations.pressE || 'Press E';

        if (translations.exitPrompt) {
            this.exitPromptText = translations.exitPrompt;
        }
    }

    // Handles logic that needs to run every frame (like mouse following)
    update(pointer) {
        if (pointer && this.closetHint.visible) {
            this.closetHint.setPosition(pointer.x + 15, pointer.y + 15);
        }
    }

    showDoorHint(door) {
        if (door.isOpenable()) {
            this.doorHint.setAlpha(1);
        } else {
            this.doorHint.setAlpha(0.5);
        }
        this.doorHint.setVisible(true);
        this.doorHint.setPosition(Math.min(door.x, 1110), door.y);
    }

    showDoorFeedback(door) {
        this.doorFeedback.setVisible(true).setPosition(Math.min(door.x, 1000), door.y - 25);
        this.scene.time.delayedCall(3000, () => {
            this.doorFeedback.setVisible(false)
        }, [], this.scene);
    }
}