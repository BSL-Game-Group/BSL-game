const COLORS = {
    fieldBorder: 0x2c3038,
    roomBorder:  0x6a7180,
    text:        '#2c3038',
};

function makeWall(scene, x, y, w, h) {
    const r = scene.add.rectangle(x, y, w, h).setAlpha(0);
    scene.physics.add.existing(r, true);
    return r;
}

function drawPlayField(scene) {
    scene.add
        .rectangle(640, 360, 1240, 680)
        .setStrokeStyle(2, COLORS.fieldBorder);
}

function drawLectureRoom(scene) {
    const cx = 170, cy = 155, w = 280, h = 250, doorSize = 100;
    const left = cx - w / 2, right = cx + w / 2;
    const top = cy - h / 2, bottom = cy + h / 2;
    const doorLeft = cx - doorSize / 2, doorRight = cx + doorSize / 2;

    const g = scene.add.graphics();
    g.lineStyle(2, COLORS.roomBorder);
    g.beginPath();
    g.moveTo(left, top);
    g.lineTo(right, top);
    g.lineTo(right, bottom);
    g.lineTo(doorRight, bottom);
    g.moveTo(doorLeft, bottom);
    g.lineTo(left, bottom);
    g.lineTo(left, top);
    g.strokePath();

    scene.add
        .text(cx, cy, 'lecture', { color: COLORS.text, fontSize: '14px' })
        .setOrigin(0.5);

    const t = 4;
    scene.lectureRoomZone = { x: left, y: top, width: w, height: h };
    window.__gameData = { ...window.__gameData, lectureRoomZone: scene.lectureRoomZone };

    return [
        makeWall(scene, cx, top, w, t),
        makeWall(scene, left, cy, t, h),
        makeWall(scene, right, cy, t, h),
        makeWall(scene, (left + doorLeft) / 2, bottom, doorLeft - left, t),
        makeWall(scene, (doorRight + right) / 2, bottom, right - doorRight, t),
    ];
}

function drawPPERoom(scene) {
    const cx = 170, cy = 565, w = 280, h = 250, doorSize = 100;
    const left = cx - w / 2, right = cx + w / 2;
    const top = cy - h / 2, bottom = cy + h / 2;
    const doorLeft = cx - doorSize / 2, doorRight = cx + doorSize / 2;

    const g = scene.add.graphics();
    g.lineStyle(2, COLORS.roomBorder);
    g.beginPath();
    g.moveTo(left, top);
    g.lineTo(doorLeft, top);
    g.moveTo(doorRight, top);
    g.lineTo(right, top);
    g.lineTo(right, bottom);
    g.lineTo(left, bottom);
    g.lineTo(left, top);
    g.strokePath();

    scene.add
        .text(cx, cy, 'Dressing room', { color: COLORS.text, fontSize: '14px' })
        .setOrigin(0.5);

    // Add closet button in upper left corner (invisible initially)
    scene.closetButton = scene.add.rectangle(left + 35, top + 60, 50, 70, 0xcccccc);
    scene.closetButton.setFillStyle(0xcccccc, 0); // fully transparent fill
    scene.closetButton.setVisible(false);
    
    // Add glow effect to indicate button is clickable (hidden initially)
    scene.closetGlow = scene.add.graphics();
    scene.closetGlow.fillStyle(0xffff00, 0.8); // fill circle with yellow
    scene.closetGlow.fillCircle(left + 35, top + 60, 55);
    scene.closetGlow.lineStyle(3, 0xffff00); // bright yellow outline
    scene.closetGlow.strokeCircle(left + 35, top + 60, 55);
    scene.closetGlow.setVisible(false);
    
    // Pulsate glow effect (brighter pulse)
    scene.closetGlowTween = scene.tweens.add({
        targets: [scene.closetGlow],
        alpha: { from: 1.0, to: 0.3 }, // higher minimum brightness
        duration: 1000,
        yoyo: true,
        repeat: -1
    });
    scene.closetGlowTween.pause();
    
    // Add dresser image (hidden initially)
    scene.closetImage = scene.add
        .image(left + 35, top + 60, 'dresser')
        .setOrigin(0.5)
        .setScale(1.5)
        .setVisible(false);

    const t = 4;
    scene.ppeRoomZone = { x: left, y: top, width: w, height: h };
    window.__gameData = { ...window.__gameData, ppeRoomZone: scene.ppeRoomZone };

    return [
        makeWall(scene, (left + doorLeft) / 2, top, doorLeft - left, t),
        makeWall(scene, (doorRight + right) / 2, top, right - doorRight, t),
        makeWall(scene, left, cy, t, h),
        makeWall(scene, right, cy, t, h),
        makeWall(scene, cx, bottom, w, t),
    ];
}

function drawBSLRoom(scene, cx, cy, w, h, label) {
    const left = cx - w / 2, right = cx + w / 2;
    const top = cy - h / 2, bottom = cy + h / 2;
    const doorSize = 100;
    const doorLeft = cx - doorSize / 2, doorRight = cx + doorSize / 2;

    const g = scene.add.graphics();
    g.lineStyle(2, COLORS.roomBorder);
    g.beginPath();
    g.moveTo(left, top);
    g.lineTo(doorLeft, top);
    g.moveTo(doorRight, top);
    g.lineTo(right, top);
    g.lineTo(right, bottom);
    g.lineTo(left, bottom);
    g.lineTo(left, top);
    g.strokePath();

    scene.add
        .text(cx, cy, label, { color: COLORS.text, fontSize: '14px', fontStyle: 'bold' })
        .setOrigin(0.5);

    const t = 4;
    return [
        makeWall(scene, (left + doorLeft) / 2, top, doorLeft - left, t),
        makeWall(scene, (doorRight + right) / 2, top, right - doorRight, t),
        makeWall(scene, right, cy, t, h),
        makeWall(scene, cx, bottom, w, t),
        makeWall(scene, left, cy, t, h),
    ];
}

export function createRooms(scene) {
    drawPlayField(scene);

    scene.bslRoomZones = [
        { key: 'BSL-1', x: 330, y: 500, width: 200, height: 150 },
        { key: 'BSL-2', x: 550, y: 500, width: 200, height: 150 },
        { key: 'BSL-3', x: 770, y: 500, width: 200, height: 150 },
        { key: 'BSL-4', x: 990, y: 500, width: 200, height: 150 },
    ];
    window.__gameData = { ...window.__gameData, bslRoomZones: scene.bslRoomZones };

    return [
        ...drawLectureRoom(scene),
        ...drawPPERoom(scene),
        ...scene.bslRoomZones.flatMap(r =>
            drawBSLRoom(scene, r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, r.key)
        ),
    ];
}
