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
    const cx = 184, cy = 154, w = 280, h = 220, doorSize = 110;
    const left = cx - w / 2, right = cx + w / 2;
    const top = cy - h / 2, bottom = cy + h / 2;
    const doorTop = cy - doorSize / 2, doorBottom = cy + doorSize / 2;

    const g = scene.add.graphics();
    g.lineStyle(2, COLORS.roomBorder);
    g.beginPath();
    g.moveTo(right, doorBottom);
    g.lineTo(right, bottom);
    g.lineTo(left, bottom);
    g.lineTo(left, top);
    g.lineTo(right, top);
    g.lineTo(right, doorTop);
    g.strokePath();

    scene.add
        .text(cx, cy, 'Luento', { color: COLORS.text, fontSize: '14px' })
        .setOrigin(0.5);

    const t = 4;
    scene.lectureRoomZone = { x: left, y: top, width: w, height: h };
    window.__gameData = { ...window.__gameData, lectureRoomZone: scene.lectureRoomZone };

    return [
        makeWall(scene, cx, top, w, t),
        makeWall(scene, left, cy, t, h),
        makeWall(scene, cx, bottom, w, t),
        makeWall(scene, right, (top + doorTop) / 2, t, doorTop - top),
        makeWall(scene, right, (doorBottom + bottom) / 2, t, bottom - doorBottom),
    ];
}

function drawPPERoom(scene) {
    const cx = 184, cy = 404, w = 280, h = 220, doorSize = 110;
    const left = cx - w / 2, right = cx + w / 2;
    const top = cy - h / 2, bottom = cy + h / 2;
    const doorTop = cy - doorSize / 2, doorBottom = cy + doorSize / 2;

    const g = scene.add.graphics();
    g.lineStyle(2, COLORS.roomBorder);
    g.beginPath();
    g.moveTo(right, doorBottom);
    g.lineTo(right, bottom);
    g.lineTo(left, bottom);
    g.lineTo(left, top);
    g.lineTo(right, top);
    g.lineTo(right, doorTop);
    g.strokePath();

    scene.add
        .text(cx, cy, 'Pukeutumishuone', { color: COLORS.text, fontSize: '14px' })
        .setOrigin(0.5);

    const t = 4;
    scene.ppeRoomZone = { x: left, y: top, width: w, height: h };
    window.__gameData = { ...window.__gameData, ppeRoomZone: scene.ppeRoomZone };

    return [
        makeWall(scene, cx, top, w, t),
        makeWall(scene, left, cy, t, h),
        makeWall(scene, cx, bottom, w, t),
        makeWall(scene, right, (top + doorTop) / 2, t, doorTop - top),
        makeWall(scene, right, (doorBottom + bottom) / 2, t, bottom - doorBottom),
    ];
}

function drawBSLRoom(scene, cx, cy, w, h, label, doorSide = 'top') {
    const left = cx - w / 2, right = cx + w / 2;
    const top = cy - h / 2, bottom = cy + h / 2;
    const doorSize = 120;

    const g = scene.add.graphics();
    g.lineStyle(2, COLORS.roomBorder);
    g.beginPath();

    const t = 4;
    let walls;

    if (doorSide === 'right') {
        const doorTop = cy - doorSize / 2;
        const doorBottom = cy + doorSize / 2;

        g.moveTo(right, doorBottom);
        g.lineTo(right, bottom);
        g.lineTo(left, bottom);
        g.lineTo(left, top);
        g.lineTo(right, top);
        g.lineTo(right, doorTop);
        g.strokePath();

        walls = [
            makeWall(scene, cx, top, w, t),
            makeWall(scene, left, cy, t, h),
            makeWall(scene, cx, bottom, w, t),
            makeWall(scene, right, (top + doorTop) / 2, t, doorTop - top),
            makeWall(scene, right, (doorBottom + bottom) / 2, t, bottom - doorBottom),
        ];
    } else {
        const doorLeft = cx - doorSize / 2;
        const doorRight = cx + doorSize / 2;

        g.moveTo(left, top);
        g.lineTo(doorLeft, top);
        g.moveTo(doorRight, top);
        g.lineTo(right, top);
        g.lineTo(right, bottom);
        g.lineTo(left, bottom);
        g.lineTo(left, top);
        g.strokePath();

        walls = [
            makeWall(scene, (left + doorLeft) / 2, top, doorLeft - left, t),
            makeWall(scene, (doorRight + right) / 2, top, right - doorRight, t),
            makeWall(scene, right, cy, t, h),
            makeWall(scene, cx, bottom, w, t),
            makeWall(scene, left, cy, t, h),
        ];
    }

    scene.add
        .text(cx, cy, label, { color: COLORS.text, fontSize: '14px', fontStyle: 'bold' })
        .setOrigin(0.5);

    return walls;
}

export function createRooms(scene) {
    drawPlayField(scene);

    scene.bslRoomZones = [
        { key: 'BSL-1', x: 92,  y: 550, width: 220, height: 140 },
        { key: 'BSL-2', x: 384, y: 550, width: 220, height: 140 },
        { key: 'BSL-3', x: 676, y: 550, width: 220, height: 140 },
        { key: 'BSL-4', x: 968, y: 550, width: 220, height: 140 },
    ];
    window.__gameData = { ...window.__gameData, bslRoomZones: scene.bslRoomZones };

    return [
        ...drawLectureRoom(scene),
        ...drawPPERoom(scene),
        ...scene.bslRoomZones.flatMap(r =>
            drawBSLRoom(scene, r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, r.key,
                r.key === 'BSL-1' ? 'right' : 'top')
        ),
    ];
}
