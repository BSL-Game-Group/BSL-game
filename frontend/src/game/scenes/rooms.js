const COLORS = {
    wall: 0x2c3038,
    text: '#000000',
};

const T = 6; // wall thickness

// A solid, visible wall rectangle (corner-to-corner) with a static physics body.
function wallRect(scene, x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    const r = scene.add.rectangle(cx, cy, w, h, COLORS.wall);
    scene.physics.add.existing(r, true);
    return r;
}

// Single horizontal / vertical wall segment on a centre line.
function hSeg(scene, xa, xb, y, walls) {
    if (xb - xa <= 0) {return;}
    walls.push(wallRect(scene, xa, y - T / 2, xb, y + T / 2));
}
function vSeg(scene, x, ya, yb, walls) {
    if (yb - ya <= 0) {return;}
    walls.push(wallRect(scene, x - T / 2, ya, x + T / 2, yb));
}

// A wall along a line, broken by door gaps. doors = [[start, end], ...].
function hWall(scene, xa, xb, y, doors, walls) {
    let cursor = xa;
    for (const [ds, de] of [...doors].sort((a, b) => a[0] - b[0])) {
        hSeg(scene, cursor, ds, y, walls);
        cursor = de;
    }
    hSeg(scene, cursor, xb, y, walls);
}
function vWall(scene, x, ya, yb, doors, walls) {
    let cursor = ya;
    for (const [ds, de] of [...doors].sort((a, b) => a[0] - b[0])) {
        vSeg(scene, x, cursor, ds, walls);
        cursor = de;
    }
    vSeg(scene, x, cursor, yb, walls);
}

function label(scene, cx, cy, text, size = 14, bold = false) {
    scene.add
        .text(cx, cy, text, {
            color: COLORS.text,
            fontSize: `${size}px`,
            fontStyle: bold ? 'bold' : 'normal',
            align: 'center',
        })
        .setOrigin(0.5);
}

// Dresser + glow + interaction inside the dressing room.
function setupCloset(scene) {
    const dresserX = 120;
    const dresserY = 500;

    scene.closetZone = { x: dresserX - 35, y: dresserY - 60, width: 80, height: 80 };
    window.__gameData = { ...window.__gameData, closetZone: scene.closetZone };

    scene.closetGlow = scene.add.graphics();
    scene.closetGlow.fillStyle(0x0b6623, 0.8);
    scene.closetGlow.fillCircle(dresserX, dresserY, 55);
    scene.closetGlow.lineStyle(3, 0x0b6623);
    scene.closetGlow.strokeCircle(dresserX, dresserY, 55);
    scene.closetGlow.setVisible(false);

    scene.closetGlowTween = scene.tweens.add({
        targets: scene.closetGlow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    scene.closetGlowTween.pause();

    scene.closetImage = scene.add
        .image(dresserX, dresserY, 'dresser')
        .setOrigin(0.5)
        .setScale(1.5)
        .setVisible(false)
        .setInteractive({ useHandCursor: true });

    scene.closetImage.on('pointerover', () => {
        if (!scene.playerInsideDressingRoom) {return;}
        scene.closetHint.setVisible(true);
    });
    scene.closetImage.on('pointerout', () => {
        scene.closetHint.setVisible(false);
    });
    scene.closetImage.on('pointerdown', () => {
        if (!scene.playerInsideDressingRoom) {return;}
        window.dispatchEvent(new Event('closet-popup-opened'));
    });
}

// Dark green glow interactable inside each BSL room. Placeholder for the real element
// (image TBD with the team) — pressing E or clicking it opens the answer popup.
// Position per room: BSL-1/2/4 top-left, BSL-3 top-centre.
function setupBslInteractables(scene) {
    const inset = 35;
    const radius = 24;

    const glowPos = (zone) => {
        const cy = zone.y + inset;
        if (zone.key === 'BSL-3') {
            return { x: zone.x + zone.width / 2, y: cy }; // top-centre
        }
        return { x: zone.x + inset, y: cy };              // top-left
    };

    scene.bslGlows = scene.bslRoomZones.map((zone) => {
        const { x: cx, y: cy } = glowPos(zone);

        const glow = scene.add.graphics();
        glow.fillStyle(0x0b6623, 0.8);
        glow.fillCircle(cx, cy, radius);
        glow.lineStyle(3, 0x0b6623);
        glow.strokeCircle(cx, cy, radius);
        glow.setVisible(false);
        glow.setDepth(5);

        const tween = scene.tweens.add({
            targets: glow,
            alpha: { from: 1.0, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
        });
        tween.pause();

        const entry = {
            key: zone.key,
            zone,
            center: { x: cx, y: cy },
            glow,
            tween,
            playerInside: false,
        };

        // Invisible clickable area over the glow (no image needed).
        const hit = scene.add
            .zone(cx, cy, radius * 2.4, radius * 2.4)
            .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
            if (!entry.playerInside) { return; }
            window.dispatchEvent(
                new CustomEvent('answer-popup-opened', { detail: { level: entry.key } })
            );
        });

        return entry;
    });
}

export function createRooms(scene) {
    const walls = [];

    // ---- Outer boundary (fully visible, outer edge flush with the floor 0/1280/720) ----
    hSeg(scene, 0, 1280, T / 2, walls);          // top
    hSeg(scene, 0, 1280, 720 - T / 2, walls);    // bottom
    vSeg(scene, T / 2, 0, 720, walls);           // left
    vSeg(scene, 1280 - T / 2, 0, 720, walls);    // right

    // ---- LEFT SIDE ----
    // Lecture | Exit divider (no door)
    vWall(scene, 480, 0, 290, [], walls);
    // Lecture/Exit bottom = Corridor top (doors to both)
    hWall(scene, 0, 700, 290, [[180, 270], [540, 630]], walls);
    // Corridor bottom = Dressing room top (one door)
    hWall(scene, 0, 700, 430, [[300, 390]], walls);

    // ---- BIG DIVIDER x:700 (Corridor <-> Labs door, opening nudged: top up, bottom down) ----
    vWall(scene, 700, 0, 720, [[292, 425]], walls);

    // ---- MIDDLE-RIGHT COLUMN: BSL 2 / Labs / BSL 1 ----
    hWall(scene, 700, 960, 250, [[790, 880]], walls); // BSL 2 <-> Labs
    hWall(scene, 700, 960, 470, [[790, 880]], walls); // Labs <-> BSL 1

    // ---- x:960 wall (Labs <-> airlock column), one clean door spanning the airlock rows ----
    vWall(scene, 960, 0, 720, [[250, 470]], walls);

    // ---- AIRLOCK BLOCK (rows 110px tall for easier passage) ----
    hWall(scene, 960, 1280, 250, [[1140, 1230]], walls); // BSL 4 <-> BSL4 airlock 2 only
    hWall(scene, 960, 1280, 360, [], walls);             // row divider (solid)
    vWall(scene, 1110, 250, 470, [[250, 360]], walls);   // BSL4 airlock 1 <-> 2 (clean top-row opening)
    hWall(scene, 960, 1280, 470, [[990, 1080]], walls);  // BSL3 airlock <-> BSL 3 only

    // ---- LABELS ----
    label(scene, 240, 145, 'Lecture room');
    label(scene, 590, 145, 'Exit', 12);
    label(scene, 350, 360, 'Corridor', 12);
    label(scene, 350, 575, 'Dressing room');
    label(scene, 830, 125, 'BSL 2', 16, true);
    label(scene, 830, 360, 'Labs', 12);
    label(scene, 830, 595, 'BSL 1', 16, true);
    label(scene, 1120, 125, 'BSL 4', 16, true);
    label(scene, 1035, 305, 'BSL4\nAIRLOCK 1', 9);
    label(scene, 1195, 305, 'BSL4\nAIRLOCK 2', 9);
    label(scene, 1035, 415, 'BSL3\nAIRLOCK', 9);
    label(scene, 1195, 415, 'AIR\nSYSTEM', 9);
    label(scene, 1120, 595, 'BSL 3', 16, true);

    // ---- ZONES (game logic) ----
    scene.lectureRoomZone = { x: 0, y: 0, width: 480, height: 290 };
    scene.ppeRoomZone = { x: 0, y: 430, width: 700, height: 290 };
    scene.bslRoomZones = [
        { key: 'BSL-1', x: 700, y: 470, width: 260, height: 250 },
        { key: 'BSL-2', x: 700, y: 0, width: 260, height: 250 },
        { key: 'BSL-3', x: 960, y: 470, width: 320, height: 250 },
        { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 },
    ];

    window.__gameData = {
        ...window.__gameData,
        lectureRoomZone: scene.lectureRoomZone,
        ppeRoomZone: scene.ppeRoomZone,
        bslRoomZones: scene.bslRoomZones,
    };

    setupCloset(scene);
    setupBslInteractables(scene);

    return walls;
}
