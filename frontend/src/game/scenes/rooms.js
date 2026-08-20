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

// Dressing room closet: a green glow + clickable area that opens the closet popup.
//  The glow is hidden until the player enters the dressing room, then it appears and follows the mouse pointer.
function setupCloset(scene) {
    const closetX = 90;
    const closetY = 500;
    const radius = 55;

    scene.closetZone = { x: closetX - 35, y: closetY - 60, width: 80, height: 80 };
    window.__gameData = { ...window.__gameData, closetZone: scene.closetZone };

    scene.closetGlow = scene.add.graphics();
    scene.closetGlow.fillStyle(0x0b6623, 0.8);
    scene.closetGlow.fillCircle(closetX, closetY, radius);
    scene.closetGlow.lineStyle(3, 0x0b6623);
    scene.closetGlow.strokeCircle(closetX, closetY, radius);
    scene.closetGlow.setVisible(false);

    scene.closetGlowTween = scene.tweens.add({
        targets: scene.closetGlow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    scene.closetGlowTween.pause();

    // Stays interactive for the whole scene — the handlers gate on the player being
    // in the room, so nothing needs to toggle this target on room entry/exit.
    scene.closetHit = scene.add
        .zone(closetX, closetY, radius * 2, radius * 2)
        .setInteractive({ useHandCursor: true });

    scene.closetHit.on('pointerover', () => {
        if (!scene.playerInsideDressingRoom) {return;}
        scene.closetHint.setVisible(true);
    });
    scene.closetHit.on('pointerout', () => {
        scene.closetHint.setVisible(false);
    });
    scene.closetHit.on('pointerdown', () => {
        if (!scene.playerInsideDressingRoom) {return;}
        window.dispatchEvent(new Event('closet-popup-opened'));
    });
}

// Quick-undress inside the dressing room + a green glow
//  that appears when the player is in the room and follows the mouse pointer.
function setupUndressPoint(scene) {
    const ux = 620;
    const uy = 650;
    const radius = 40;

    scene.undressPoint = { x: ux, y: uy };

    scene.undressGlow = scene.add.graphics();
    scene.undressGlow.fillStyle(0x0b6623, 0.8);
    scene.undressGlow.fillCircle(ux, uy, radius);
    scene.undressGlow.lineStyle(3, 0x0b6623);
    scene.undressGlow.strokeCircle(ux, uy, radius);
    scene.undressGlow.setDepth(5);
    scene.undressGlow.setVisible(false);

    scene.undressGlowTween = scene.tweens.add({
        targets: scene.undressGlow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    scene.undressGlowTween.pause();

    scene.undressZone = scene.add
        .zone(ux, uy, radius * 2.4, radius * 2.4)
        .setInteractive({ useHandCursor: true });

    // Both R and a click trigger the same wash-up.
    scene.undressZone.on('pointerdown', () => {
        if (!scene.playerInsideDressingRoom) {return;}
        window.dispatchEvent(new Event('quick-undress'));
    });
}

// Green glow interactable inside each BSL room. 
// pressing E or clicking it opens the answer popup.
function setupBslInteractables(scene) {
    const inset = 35;
    const vInset = 60;
    const radius = 24;

    const glowPos = (zone) => {
        const cy = zone.y + vInset;
        if (zone.key === 'BSL-3') {
            return { x: zone.x + zone.width / 2, y: cy };
        }
        return { x: zone.x + inset, y: cy };
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

        // Invisible clickable area over the glow
        const hit = scene.add
            .zone(cx, cy, radius * 2.4, radius * 2.4)
            .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
            if (!entry.playerInside) { return; }
            if (!window.__lectureOpen) {
                window.dispatchEvent(new Event('lecture-required'));
                return;
            }
            if (entry.key === 'BSL-4' && (!window.__bsl4Ready || scene.bsl4Door?.isOpen)) {
                window.dispatchEvent(new Event('bsl4-not-ready'));
                return;
            }
            if (entry.key === 'BSL-3' && scene.bsl3Door?.isOpen) {
                window.dispatchEvent(new Event('bsl-door-required'));
                return;
            }
            window.dispatchEvent(
                new CustomEvent('answer-popup-opened', { detail: { level: entry.key } })
            );
        });

        return entry;
    });
}

//Setup the lecture room background and colliders.
function setupLectureRoom(scene, walls) {
    scene.add.image(0, 0, 'lecture_room')
        .setOrigin(0, 0)
        .setDisplaySize(480, 290)
        .setDepth(-5);

    walls.push(wallRect(scene, 0, 0, 480, 24));

    // Back wall
    solidBox(scene, 0, 0, 480, 60, walls);

    // Front ledge under the display wall
    solidBox(scene, 0, 60, 480, 110, walls);

    // Left workstation
    solidBox(scene, 40, 132, 214, 236, walls);

    // New collider: x 200-290, y:77.5-146.25.
    solidBox(scene, 200, 77.5, 290, 146.25, walls);
}

function setupExitArea(scene, walls) {
    scene.add.image(480, 0, 'exit_area')
        .setOrigin(0, 0)
        .setDisplaySize(220, 290)
        .setDepth(-5);

    // back wall
    solidBox(scene, 480, 0, 700, 60, walls);
}

function setupExitButton(scene) {
    const gx = 520;
    const gy = 45;
    const radius = 28;

    // Add the picture/icon on the wall for the exit button
    scene.exitButtonSprite = scene.add.image(gx, gy, 'exit_button')
        .setOrigin(0.5)
        .setDisplaySize(40, 40)
        .setDepth(6);

    const padding = 16;
    const displayWidth = scene.exitButtonSprite.displayWidth + padding;
    const displayHeight = scene.exitButtonSprite.displayHeight + padding;

    // Create a permanent glowing rectangular frame using strokeRect
    const glow = scene.add.graphics();
    glow.lineStyle(3, 0x00ff00, 0.9); // Bright green border
    glow.strokeRect(-displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
    glow.setPosition(gx, gy);
    glow.setDepth(5);
    glow.setVisible(true); // Always visible

    // Pulsing animation that runs continuously
    const tween = scene.tweens.add({
        targets: glow,
        alpha: { from: 1.0, to: 0.4 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });

    scene.exitGlow = glow;
    scene.exitGlowTween = tween;
    scene.exitButtonPoint = { x: gx, y: gy };

    // Always active interactive zone for clicking the button
    scene.add
        .zone(gx, gy, displayWidth * 1.2, displayHeight * 1.2)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.dispatchEvent(new Event('exit-popup-opened'));
        });
}

// Microbe Info point in the lecture room
function setupLectureInfoPoint(scene) {
    const gx = 180;
    const gy = 240;
    const radius = 35;

    const glow = scene.add.graphics();
    glow.fillStyle(0x0b6623, 0.8);
    glow.fillCircle(gx, gy, radius);
    glow.lineStyle(3, 0x0b6623);
    glow.strokeCircle(gx, gy, radius);
    glow.setDepth(5);
    glow.setVisible(false);

    const tween = scene.tweens.add({
        targets: glow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    tween.pause();

    scene.lectureGlow = glow;
    scene.lectureGlowTween = tween;
    scene.lecturePoint = { x: gx, y: gy };

    scene.add
        .zone(gx, gy, radius * 2.4, radius * 2.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.dispatchEvent(new Event('microbe-info-popup-opened'));
        });
}

function setupLectureMaterialButton(scene) {
    const gx = 410;
    const gy = 120;
    const radius = 25;

    const glow = scene.add.graphics();
    glow.fillStyle(0x0b6623, 0.8);
    glow.fillCircle(gx, gy, radius);
    glow.lineStyle(3, 0x0b6623);
    glow.strokeCircle(gx, gy, radius);
    glow.setDepth(5);
    glow.setVisible(false);

    const tween = scene.tweens.add({
        targets: glow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    tween.pause();

    scene.lectureMaterialGlow = glow;
    scene.lectureMaterialGlowTween = tween;
    scene.lectureMaterialPoint = { x: gx, y: gy };

    scene.add
        .zone(gx, gy, radius * 2.4, radius * 2.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.dispatchEvent(new Event('lecture-material-popup-opened'));
        });
}

// Invisible colliders over the dressing-room furniture
function setupDressingRoomDeadzones(scene, walls) {
    // Left side:
    solidBox(scene, 103, 430, 315, 470, walls);  // lockers strip, 40 units tall (y430..470)
    solidBox(scene, 85, 572, 240, 598, walls);   // thin bench
    // Right side
    solidBox(scene, 469, 458, 677, 555, walls);  // top-right: decon counter + suits
    solidBox(scene, 469, 558, 571, 617, walls);  // shelves
    solidBox(scene, 575, 558, 694, 705, walls);  // glass booth
}

// Info desk in the corridor
function setupInfoDesk(scene, walls) {
    scene.add.image(6, 294, 'info_desk')
        .setOrigin(0, 0)
        .setDisplaySize(150, 108)
        .setDepth(-5);
    solidBox(scene, 6, 300, 156, 402, walls);

    // Green info point in front of the desk
    const gx = 140;
    const gy = 360;
    const radius = 22;

    const glow = scene.add.graphics();
    glow.fillStyle(0x0b6623, 0.8);
    glow.fillCircle(gx, gy, radius);
    glow.lineStyle(3, 0x0b6623);
    glow.strokeCircle(gx, gy, radius);
    glow.setDepth(5);
    glow.setVisible(false);
    const infoTween = scene.tweens.add({
        targets: glow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    infoTween.pause();
    scene.infoGlow = glow;
    scene.infoGlowTween = infoTween;
    scene.infoPoint = { x: gx, y: gy };

    scene.add
        .zone(gx, gy, radius * 2.4, radius * 2.4)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            window.dispatchEvent(new Event('info-popup-opened'));
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
    // Lecture | Exit divider
    vWall(scene, 480, 0, 290, [[200, 290]], walls);
    // Lecture bottom = Corridor top (door)
    hWall(scene, 0, 700, 290, [[220, 310]], walls);
    // Corridor bottom = Dressing room top (one narrower door)
    hWall(scene, 0, 700, 430, [[325, 377], [425, 480]], walls);

    // ---- BIG DIVIDER (Lobby <-> Lab area) ----
    vWall(scene, 400, 290, 430, [], walls);

    // ---- BIG DIVIDER x:700 (Corridor <-> Labs door ----
    vWall(scene, 700, 0, 720, [[292, 435]], walls);

    // ---- MIDDLE-RIGHT COLUMN: BSL 2 / Labs / BSL 1 ----
    hWall(scene, 700, 960, 250, [[790, 880]], walls); // BSL 2 <-> Labs
    hWall(scene, 700, 960, 470, [[805, 865]], walls); // Labs <-> BSL 1 (narrower door)

    // ---- x:960 wall (Labs <-> airlock column) ----
    vWall(scene, 960, 0, 720, [[250, 470]], walls);

    // ---- AIRLOCK BLOCK (rows 110px tall for easier passage) ----
    hWall(scene, 960, 1280, 250, [[1170, 1230]], walls); // BSL 4 <-> BSL4 airlock 2 only
    hWall(scene, 960, 1280, 360, [], walls);             // row divider (solid)
    vWall(scene, 1110, 250, 470, [[250, 360]], walls);   // BSL4 airlock 1 <-> 2 (clean top-row opening)
    hWall(scene, 960, 1280, 470, [[970, 1040]], walls);  // BSL3 airlock <-> BSL 3 only

    // ---- LABELS ----
    // BSL 2/4 (top rooms)
    label(scene, 830, 125, 'BSL 2', 16, true, 1);
    label(scene, 830, 595, 'BSL 1', 16, true, 21);
    label(scene, 1120, 125, 'BSL 4', 16, true, 1);
    label(scene, 1120, 595, 'BSL 3', 16, true, 21);

    // ---- ZONES (game logic) ----
    scene.lectureRoomZone = { x: 0, y: 0, width: 480, height: 290 };
    scene.ppeRoomZone = { x: 0, y: 430, width: 700, height: 290 };
    scene.corridorZone = { x: 0, y: 290, width: 700, height: 140 };
    scene.bslRoomZones = [
        { key: 'BSL-1', x: 700, y: 470, width: 260, height: 250 },
        { key: 'BSL-2', x: 700, y: 0, width: 260, height: 250 },
        { key: 'BSL-3', x: 960, y: 470, width: 320, height: 250 },
        { key: 'BSL-4', x: 960, y: 0, width: 320, height: 250 },
    ];
    // Airlock2's reachable cell (row1 only — its row2 cell has no doors in or
    // out). Player enter/exit is tracked the same way as the dressing room.
    scene.airlock2Zone = { x: 1110, y: 250, width: 170, height: 110 };
    scene.exitZone = {
        x: 480,
        y: 0,
        width: 220,
        height: 290,
    };

    window.__gameData = {
        ...window.__gameData,
        lectureRoomZone: scene.lectureRoomZone,
        ppeRoomZone: scene.ppeRoomZone,
        bslRoomZones: scene.bslRoomZones,
        exitZone: scene.exitZone,
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
    const airCell = { x: 1110, y: 360, width: 170, height: 110 };
    scene.add.image(airCell.x, airCell.y, 'air_systems')
        .setOrigin(0, 0)
        .setDisplaySize(airCell.width, airCell.height)
        .setDepth(-5);

    // Draw the dressing-room background
    const dressing = scene.ppeRoomZone;
    scene.dressingImage = scene.add.image(dressing.x, dressing.y, 'dressing_room')
        .setOrigin(0, 0)
        .setDisplaySize(dressing.width, dressing.height)
        .setDepth(-5);

    setupCloset(scene);
    setupBslInteractables(scene);
    setupUndressPoint(scene);
    setupLectureRoom(scene, walls);
    setupLectureInfoPoint(scene);
    setupLectureMaterialButton(scene);
    setupDressingRoomDeadzones(scene, walls);
    setupInfoDesk(scene, walls);
    setupExitArea(scene, walls);
    setupExitButton(scene);

    return walls;
}
