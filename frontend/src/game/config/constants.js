export const PLAYER_CONFIG = {
    startX: 590,
    startY: 150,
    scale: 0.4,
    depth: 10,
    // Walking speed in pixels per second, for both keyboard and pointer.
    speed: 190,
    body: {
        width: 56,
        height: 65,
        offsetX: 22,
        offsetY: 152
    }
};

export const DOORS_CONFIG = [
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