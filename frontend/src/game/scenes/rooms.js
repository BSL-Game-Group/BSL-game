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

// Invisible static collision box (its visuals come from a background image, e.g. the lecture room).
function solidBox(scene, x1, y1, x2, y2, walls) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const r = scene.add.rectangle(cx, cy, Math.abs(x2 - x1), Math.abs(y2 - y1)).setAlpha(0);
    scene.physics.add.existing(r, true);
    walls.push(r);
}

// Like solidBox, but returns a named box instead of pushing it into `walls` — for
// collidables that aren't walls (e.g. bookshelves), so they can be their own group.
function namedSolid(scene, x1, y1, x2, y2, name) {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const r = scene.add.rectangle(cx, cy, Math.abs(x2 - x1), Math.abs(y2 - y1)).setAlpha(0);
    r.name = name;
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

function label(scene, cx, cy, text, size = 14, bold = false, depth = 21) {
    scene.add
        .text(cx, cy, text, {
            color: COLORS.text,
            fontSize: `${size}px`,
            fontStyle: bold ? 'bold' : 'normal',
            align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(depth);
}

// Closet interactable inside the dressing room: a green glow marks the spot and an
// invisible sprite is the click target (the dresser art now lives in the room image).
function setupCloset(scene) {
    const dresserX = 90;
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
    const vInset = 60; // a bit lower than the horizontal inset so the element sits inside the room
    const radius = 24;

    const glowPos = (zone) => {
        const cy = zone.y + vInset;
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

// Lecture-room decor: a transparent pixel-art furniture overlay (the room's floor comes
// from the game). The back wall is solid (a real wall). The bookshelves are solid too,
// but live in their OWN named group (`scene.lectureShelves`) rather than `walls`.
function setupLectureRoom(scene, walls) {
    scene.add.image(0, 0, 'lecture_room')
        .setOrigin(0, 0)
        .setDisplaySize(480, 290)
        .setDepth(-5); // above the floor (-10), below walls (0) and the player (10)

    // Back wall: solid. The game's black wall reads as its rear; the plaster face is in the overlay.
    solidBox(scene, 0, 0, 480, 60, walls);

    // Bookshelves — own named group so a future "shelves as buttons" feature can hook onto them.
    scene.lectureShelves = [
        namedSolid(scene, 8, 72, 76, 136, 'lecture-shelf-1'),     // left-upper
        namedSolid(scene, 8, 184, 76, 248, 'lecture-shelf-2'),    // left-lower
        namedSolid(scene, 404, 72, 472, 136, 'lecture-shelf-3'),  // right-upper
        namedSolid(scene, 404, 184, 472, 248, 'lecture-shelf-4'), // right-lower
    ];
}

// Invisible colliders over the dressing-room furniture, estimated from the room
// art (image 1024x419 mapped onto the 700x290 ppe zone at x:0,y:430). Everything
// that isn't floor blocks — only the grey tile floor and the shower approach
// (the gap at x ~315..469, which also holds the top door) stay walkable.
function setupDressingRoomDeadzones(scene, walls) {
    solidBox(scene, 10, 458, 315, 548, walls);   // top-left: PPE suits + lockers
    solidBox(scene, 469, 458, 677, 555, walls);  // top-right: decon counter + suits
    solidBox(scene, 79, 565, 243, 631, walls);   // benches
    solidBox(scene, 219, 648, 284, 705, walls);  // biohazard bins
    solidBox(scene, 469, 558, 571, 617, walls);  // shelves
    solidBox(scene, 575, 558, 694, 705, walls);  // glass booth
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
    // Corridor bottom = Dressing room top (one narrower door)
    hWall(scene, 0, 700, 430, [[315, 375]], walls);

    // ---- BIG DIVIDER x:700 (Corridor <-> Labs door, opening nudged: top up, bottom down) ----
    vWall(scene, 700, 0, 720, [[292, 425]], walls);

    // ---- MIDDLE-RIGHT COLUMN: BSL 2 / Labs / BSL 1 ----
    hWall(scene, 700, 960, 250, [[790, 880]], walls); // BSL 2 <-> Labs
    hWall(scene, 700, 960, 470, [[805, 865]], walls); // Labs <-> BSL 1 (narrower door)

    // ---- x:960 wall (Labs <-> airlock column), one clean door spanning the airlock rows ----
    vWall(scene, 960, 0, 720, [[250, 470]], walls);

    // ---- AIRLOCK BLOCK (rows 110px tall for easier passage) ----
    hWall(scene, 960, 1280, 250, [[1140, 1230]], walls); // BSL 4 <-> BSL4 airlock 2 only
    hWall(scene, 960, 1280, 360, [], walls);             // row divider (solid)
    vWall(scene, 1110, 250, 470, [[250, 360]], walls);   // BSL4 airlock 1 <-> 2 (clean top-row opening)
    hWall(scene, 960, 1280, 470, [[970, 1040]], walls);  // BSL3 airlock <-> BSL 3 only

    // ---- LABELS ---- (lecture room now shown via the pixel-art overlay, so no text label)
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
    label(scene, 1195, 430, 'AIR SYSTEMS', 11, true);
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

    // Draw the BSL-1 background image
    const bsl1 = scene.bslRoomZones.find(zone => zone.key === 'BSL-1');

    scene.bsl1Image = scene.add.image(bsl1.x, bsl1.y, 'bsl1_room')
        .setOrigin(0, 0)
        .setDisplaySize(bsl1.width, bsl1.height)
        .setDepth(-5);

    // Draw the BSL-2 background image
    const bsl2 = scene.bslRoomZones.find(zone => zone.key === 'BSL-2');

    scene.add.image(bsl2.x, bsl2.y, 'bsl2_room')
        .setOrigin(0, 0)
        .setDisplaySize(bsl2.width, bsl2.height)
        .setDepth(-5);

    // Draw the BSL-3 background image
    const bsl3 = scene.bslRoomZones.find(zone => zone.key === 'BSL-3');

    scene.bsl3Image = scene.add.image(bsl3.x, bsl3.y, 'bsl3_room')
        .setOrigin(0, 0)
        .setDisplaySize(bsl3.width, bsl3.height)
        .setDepth(-5);

    // Draw the BSL-4 background image
    const bsl4 = scene.bslRoomZones.find(zone => zone.key === 'BSL-4');

    scene.add.image(bsl4.x, bsl4.y, 'bsl4_room')
        .setOrigin(0, 0)
        .setDisplaySize(bsl4.width, bsl4.height)
        .setDepth(-5);

    // Draw the air-system machine into its cell (bottom-right of the airlock block).
    // Fill the whole air-system cell wall-to-wall (like the BSL room backgrounds
    // fill their zones); the walls at depth 0 tuck over its edges.
    const airCell = { x: 1110, y: 360, width: 170, height: 110 };
    scene.add.image(airCell.x, airCell.y, 'air_systems')
        .setOrigin(0, 0)
        .setDisplaySize(airCell.width, airCell.height)
        .setDepth(-5);

    // Draw the dressing-room background, filling its zone wall-to-wall. Kept as a
    // named ref so main_scene can depth-switch it at the door (like the BSL rooms).
    const dressing = scene.ppeRoomZone;
    scene.dressingImage = scene.add.image(dressing.x, dressing.y, 'dressing_room')
        .setOrigin(0, 0)
        .setDisplaySize(dressing.width, dressing.height)
        .setDepth(-5);

    setupCloset(scene);
    setupBslInteractables(scene);
    setupLectureRoom(scene, walls);
    setupDressingRoomDeadzones(scene, walls);

    return walls;
}
