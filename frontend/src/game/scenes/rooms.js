const COLORS = {
    fieldBorder: 0x2c3038,
    roomBorder:  0x6a7180,
    text:        '#2c3038',
};

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
    const makeWall = (x, y, ww, wh) => {
        const r = scene.add.rectangle(x, y, ww, wh).setAlpha(0);
        scene.physics.add.existing(r, true);
        return r;
    };

    scene.lectureRoomZone = { x: left, y: top, width: w, height: h };
    window.__gameData = { ...window.__gameData, lectureRoomZone: scene.lectureRoomZone };

    return [
        makeWall(cx, top, w, t),
        makeWall(left, cy, t, h),
        makeWall(cx, bottom, w, t),
        makeWall(right, (top + doorTop) / 2, t, doorTop - top),
        makeWall(right, (doorBottom + bottom) / 2, t, bottom - doorBottom),
    ];
}

export function createRooms(scene) {
    drawPlayField(scene);
    return [
        ...drawLectureRoom(scene),
    ];
}
