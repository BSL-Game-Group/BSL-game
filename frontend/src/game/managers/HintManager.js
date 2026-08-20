export default class HintManager {
    constructor(scene) {
        this.scene = scene;

        // Define our common styles
        const baseStyle = { fontSize: "14px", color: "#ffffff", padding: { x: 6, y: 3 } };
        const darkStyle = { ...baseStyle, backgroundColor: "#000000" };
        const greyStyle = { ...baseStyle, backgroundColor: "#222222" };

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
        this.openmicrobeInfoHint = createHint(darkStyle);

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

        this.closetPressEText.setText(translations.pressEToOpen || 'Press E to open');
        this.infoPressEText.setText(translations.pressEToOpen || 'Press E to open');
        this.exitPressEText.setText(translations.exitPrompt || 'Press E to exit');
        this.closetHint.setText(translations.openCloset || 'Open Closet');
        this.undressHint.setText(translations.washUp || 'Press R or click to wash up');
        this.bslHint.setText(translations.pressE || 'Press E');
        this.doorHint.setText(translations.pressE || 'Press E');
        this.openmicrobeInfoHint.setText(translations.openMicrobeInfoHint || 'Press E for microbe info');
    }

    // Handles logic that needs to run every frame (like mouse following)
    update(pointer) {
        if (pointer && this.closetHint.visible) {
            this.closetHint.setPosition(pointer.x + 15, pointer.y + 15);
        }
    }
}