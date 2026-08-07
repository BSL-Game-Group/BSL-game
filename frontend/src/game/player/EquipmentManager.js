export default class EquipmentManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;

        this.config = {
            lab_coat: { scale: 0.05, offsetX: -1, offsetY: 5, depth: 11 },
            mask: { scale: 0.075, offsetX: -1, offsetY: -20, depth: 12 },
            glasses: { scale: 0.07, offsetX: -0.85, offsetY: -27.5, depth: 13 },
            face_shield: { scale: 0.03, offsetX: -0.5, offsetY: -28, depth: 14 },
            bsl3_respirator: { scale: 0.04, offsetX: -1, offsetY: -25, depth: 15 },
            sunglasses: { scale: 0.07, offsetX: -0.85, offsetY: -27.5, depth: 16 },
            disposable_overall: { scale: 0.065, offsetX: -0.95, offsetY: 5, depth: 13 },
            gloves: { scale: 0.085, offsetX: -1.5, offsetY: 14, depth: 12 },
            gloves_2: { scale: 0.085, offsetX: -1.5, offsetY: 14, depth: 13 },
            closable_lab_coat: { scale: 0.33, offsetX: -1, offsetY: 7, depth: 11 },
            pressurized_suit: { scale: 0.085, offsetX: 0, offsetY: 0, depth: 11 },
            wow_helmet: { scale: 0.1, offsetX: -2, offsetY: -31, depth: 13 }
        };

        this.sprites = {};

        this.createSprites();
    }

    createSprites() {
        Object.entries(this.config).forEach(([key, cfg]) => {
            this.sprites[key] = this.scene.add
                .sprite(700, 300, key)
                .setScale(cfg.scale)
                .setDepth(cfg.depth)
                .setVisible(false);
        });
    }

    setEquipment(equipped) {
        Object.keys(this.sprites).forEach(key => {
            this.sprites[key].setVisible(Boolean(equipped[key]));
        });

        if (equipped.pressurized_suit || equipped.disposable_overall) {
            this.player.setTexture("head_only");
        } else if (equipped.wow_helmet) {
            this.player.setTexture("no_hair");
        } else {
            this.player.setTexture("player_base");
        }
    }

    updatePositions() {
        Object.entries(this.sprites).forEach(([key, sprite]) => {
            const cfg = this.config[key];

            sprite.setPosition(
                this.player.x + cfg.offsetX,
                this.player.y + cfg.offsetY
            );
        });
    }
}