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

// Closet interactable inside the dressing room: the green glow circle IS the element
// (the dresser art now lives in the room image), and clicking anywhere on it opens the
// closet. The click target is an invisible zone matching the circle — same pattern as
// the BSL glows below. It must be a zone, not a hidden sprite: Phaser only hit-tests
// objects that would render (InputManager#inputCandidate), so a sprite kept invisible
// receives no pointer events at all.
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

// Quick-undress interactable inside the dressing room: a green glow, same look as
// the other room interactables (closet, BSL rooms, info points). Clicking it resets
// all worn PPE in one go. Placed toward the bottom-right of the walkable floor —
// the literal corner is blocked by the decon-counter/shelves/glass-booth furniture.
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

    // The "press R" hint is proximity-driven (main_scene's update loop), same as
    // the closet's — that way it works for keyboard players too, not just mouse
    // hover, and both R and a click trigger the same wash-up.
    scene.undressZone.on('pointerdown', () => {
        if (!scene.playerInsideDressingRoom) {return;}
        window.dispatchEvent(new Event('quick-undress'));
    });
}

// Wash-up point in airlock2's bottom-right corner. Same look/click as the
// dressing room's quick-undress spot and resets PPE the same way. App.jsx's
// dressing-room gate doesn't listen for this event, so it still doesn't
// replace the real checkout — it's just a reminder/decon step on the way out
// of BSL4 (main_scene fires it as soon as the player arrives in airlock2).
function setupAirlockWashPoint(scene) {
    const wx = 1250;
    const wy = 335;
    const radius = 16;

    scene.airlockWashPoint = { x: wx, y: wy };

    scene.airlockWashGlow = scene.add.graphics();
    scene.airlockWashGlow.fillStyle(0x0b6623, 0.8);
    scene.airlockWashGlow.fillCircle(wx, wy, radius);
    scene.airlockWashGlow.lineStyle(3, 0x0b6623);
    scene.airlockWashGlow.strokeCircle(wx, wy, radius);
    scene.airlockWashGlow.setDepth(5);
    scene.airlockWashGlow.setVisible(false);

    scene.airlockWashGlowTween = scene.tweens.add({
        targets: scene.airlockWashGlow,
        alpha: { from: 1.0, to: 0.3 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
    });
    scene.airlockWashGlowTween.pause();

    scene.airlockWashZone = scene.add
        .zone(wx, wy, radius * 2.4, radius * 2.4)
        .setInteractive({ useHandCursor: true });

    scene.airlockWashZone.on('pointerdown', () => {
        if (!scene.playerInsideAirlock2) {return;}
        window.dispatchEvent(new Event('airlock-decon'));
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
            if (!window.__lectureOpen) {
                window.dispatchEvent(new Event('lecture-required'));
                return;
            }
            window.dispatchEvent(
                new CustomEvent('answer-popup-opened', { detail: { level: entry.key } })
            );
        });

        return entry;
    });
}

// Lecture-room decor: a transparent pixel-art furniture overlay (the room's floor comes
// from the game). The back wall is solid (a real wall).
// but live in their OWN named group (`scene.lectureShelves`) rather than `walls`.
function setupLectureRoom(scene, walls) {
    scene.add.image(0, 0, 'lecture_room')
        .setOrigin(0, 0)
        .setDisplaySize(480, 290)
        .setDepth(-5);

    // Back wall
    solidBox(scene, 0, 0, 480, 60, walls);

    // Front ledge under the display wall
    solidBox(scene, 0, 60, 480, 110, walls);

    // Left workstation
    solidBox(scene, 40, 132, 214, 236, walls);

    // New collider: x 200-290, y:77.5-146.25.
    solidBox(scene, 200, 77.5, 290, 146.25, walls);

    // No bookshelf colliders anymore
    scene.lectureShelves = [];
}
function setupExitArea(scene, walls) {
    scene.add.image(480, 0, 'exit_area')
        .setOrigin(0, 0)
        .setDisplaySize(220, 290)
        .setDepth(-5);

    // back wall
    solidBox(scene, 480, 0, 700, 60, walls);
}

// Info point in the lecture room: a green pulsing glow (same look as the corridor
// info desk) that opens the lecture-materials panel on E, instead of it opening
// automatically when the player enters the room. Placed past the right workstation
// on open floor (y:236+), since the display wall (y:0-110) and both workstations
// (x:40-214 and x:266-440, y:132-236) are solid.
function setupLectureInfoPoint(scene) {
    const gx = 300;
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
            window.dispatchEvent(new Event('lecture-materials-unlocked'));
        });
}

// Invisible colliders over the dressing-room furniture, estimated from the room
// art (image 1024x419 mapped onto the 700x290 ppe zone at x:0,y:430). Everything
// that isn't floor blocks — only the grey tile floor and the shower approach
// (the gap at x ~315..469, which also holds the top door) stay walkable.
function setupDressingRoomDeadzones(scene, walls) {
    // Left side: only the top strip of the room (back wall + lockers) and the
    // thin bench block; the rest of the left floor is walkable.
    solidBox(scene, 103, 430, 315, 470, walls);  // lockers strip, 40 units tall (y430..470)
    solidBox(scene, 85, 572, 240, 598, walls);   // thin bench
    // Right side (kept): furniture blocks; the shower approach and floor stay open.
    solidBox(scene, 469, 458, 677, 555, walls);  // top-right: decon counter + suits
    solidBox(scene, 469, 558, 571, 617, walls);  // shelves
    solidBox(scene, 575, 558, 694, 705, walls);  // glass booth
}

// Info desk in the corridor's top-left corner, flush against the walls (a future
// info point). The counter is solid so the player can't walk through it.
function setupInfoDesk(scene, walls) {
    scene.add.image(6, 294, 'info_desk')
        .setOrigin(0, 0)
        .setDisplaySize(150, 108)
        .setDepth(-5);
    solidBox(scene, 6, 300, 156, 402, walls);

    // Green info point in front of the desk: a pulsing glow + clickable area that
    // opens the how-to-play popup (same green-ring look as the room interactables).
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
    // Lecture | Exit divider — door here now, so the exit room is reached from
    // the lecture room instead of straight down from the corridor. Door sits
    // right at the bottom edge of the divider (y:290 = corridor line).
    vWall(scene, 480, 0, 290, [[200, 290]], walls);
    // Lecture bottom = Corridor top (door). Exit room's old down-facing door
    // to the corridor is now closed — it's only reachable via the lecture room.
    hWall(scene, 0, 700, 290, [[220, 310]], walls);
    // Corridor bottom = Dressing room top (one narrower door)
    hWall(scene, 0, 700, 430, [[315, 375]], walls);

    // ---- BIG DIVIDER x:700 (Corridor <-> Labs door, opening nudged: top up, bottom down) ----
    vWall(scene, 700, 0, 720, [[292, 435]], walls);

    // ---- MIDDLE-RIGHT COLUMN: BSL 2 / Labs / BSL 1 ----
    hWall(scene, 700, 960, 250, [[790, 880]], walls); // BSL 2 <-> Labs
    hWall(scene, 700, 960, 470, [[805, 865]], walls); // Labs <-> BSL 1 (narrower door)

    // ---- x:960 wall (Labs <-> airlock column), one clean door spanning the airlock rows ----
    vWall(scene, 960, 0, 720, [[250, 470]], walls);

    // ---- AIRLOCK BLOCK (rows 110px tall for easier passage) ----
    hWall(scene, 960, 1280, 250, [[1170, 1230]], walls); // BSL 4 <-> BSL4 airlock 2 only
    hWall(scene, 960, 1280, 360, [], walls);             // row divider (solid)
    vWall(scene, 1110, 250, 470, [[250, 360]], walls);   // BSL4 airlock 1 <-> 2 (clean top-row opening)
    hWall(scene, 960, 1280, 470, [[970, 1040]], walls);  // BSL3 airlock <-> BSL 3 only

    // ---- LABELS ----
    label(scene, 830, 125, 'BSL 2', 16, true);
    label(scene, 830, 595, 'BSL 1', 16, true);
    label(scene, 1120, 125, 'BSL 4', 16, true);
    label(scene, 1120, 595, 'BSL 3', 16, true);

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
    setupUndressPoint(scene);
    setupAirlockWashPoint(scene);
    setupLectureRoom(scene, walls);
    setupLectureInfoPoint(scene);
    setupDressingRoomDeadzones(scene, walls);
    setupInfoDesk(scene, walls);
    setupExitArea(scene, walls);

    return walls;
}
