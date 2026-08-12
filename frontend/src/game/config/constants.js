export const PLAYER_CONFIG = {
    startX: 590,
    startY: 150,
    scale: 0.4,
    depth: 10,
    // Legs only: the feet decide where the player can stand, so the head and
    // torso can overlap walls and furniture. Source-texture pixels — Phaser
    // scales them by `scale`. base.png is 106x217; legs are rows 152-217,
    // columns 22-78.
    body: {
        width: 56,
        height: 65,
        offsetX: 22,
        offsetY: 152
    }
};

export const DOORS_CONFIG = [
    // The two front doors are drawn face-on: the art hangs below the wall line it
    // sits in (door 1's art spans y 244.75-315.25 against a wall at y 247-253), so
    // the art occupies floor the player would otherwise walk onto. Their bodies
    // therefore cover the whole drawn footprint rather than just the wall line —
    // a thin bar at the wall stops the legs-only body by its TOP edge, leaving the
    // character halted with its feet 35px short, standing on the door art.
    // Body top = door.y - 141 + bodyYOffset, and the body extends bodyHeight down
    // from there (StaticBody.setSize does not apply the sprite's 0.25 scale).
    // The trigger zones grow to match, keeping the prompt windows where they were
    // before the hitbox change: door 1 was (181.9, 338.5), now (179.1, 342.1).
    {
        id: 1, x: 1200, y: 280, type: 'door_front', scale: 0.25,
        physics: { triggerZoneY: 291, triggerZoneHeight: 137, bodyXOffset: 75, bodyYOffset: 105, bodyHeight: 71 },
        links: [3] // Pairs with door 3
    },
    {
        id: 2, x: 1005, y: 515, type: 'door_front', scale: 0.25,
        physics: { triggerZoneY: 524, triggerZoneHeight: 143, bodyXOffset: 75, bodyYOffset: 95, bodyHeight: 82 },
        links: [5] // Pairs with door 5
    },
    // The three top doors each have to seal the doorway gap cut into the wall
    // behind them, and prompt anywhere along it. Phaser's StaticBody.setSize()
    // does not apply the sprite's scale and centres the body on the door, so a
    // body/zone of height H spans y +/- H/2 in world pixels. The gaps come from
    // rooms.js: vWall x=1110 has gap [250, 360] (door 3), vWall x=960 has gap
    // [250, 470], which doors 4 and 5 split at y=360. Hence 110 for both the
    // body and the zone: anything shorter leaves an open band that the
    // legs-only player body (26 world px tall) walks straight through.
    {
        id: 3, x: 1110, y: 305, type: 'door_top', scale: 0.5,
        physics: { triggerZoneWidth: 40, triggerZoneHeight: 110, bodyWidth: 9, bodyHeight: 110 },
        links: [1, 4] // Pairs with doors 1 and 4
    },
    {
        id: 4, x: 965, y: 305, type: 'door_top', scale: 0.5,
        physics: { triggerZoneWidth: 40, triggerZoneHeight: 110, bodyWidth: 9, bodyHeight: 110 },
        links: [3] // Pairs with door 3
    },
    {
        id: 5, x: 965, y: 415, type: 'door_top', scale: 0.5,
        physics: { triggerZoneWidth: 40, triggerZoneHeight: 110, bodyWidth: 9, bodyHeight: 110 },
        links: [2] // Pairs with door 2
    }
];