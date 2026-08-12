export const PLAYER_CONFIG = {
    startX: 590,
    startY: 150,
    scale: 0.4,
    depth: 10,
    body: {
        width: 60,
        height: 205,
        offsetX: 23,
        offsetY: 6
    }
};

export const DOORS_CONFIG = [
    { 
        id: 1, x: 1200, y: 280, type: 'door_front', scale: 0.25, 
        physics: { triggerZoneY: 260, bodyXOffset: 75, bodyYOffset: 105, bodyHeight: 9 }, 
        links: [3] // Pairs with door 3
    },
    { 
        id: 2, x: 1005, y: 515, type: 'door_front', scale: 0.25, 
        physics: { triggerZoneY: 490, bodyXOffset: 75, bodyYOffset: 95, bodyHeight: 9 }, 
        links: [5] // Pairs with door 5
    },
    { 
        id: 3, x: 1110, y: 305, type: 'door_top', scale: 0.5, 
        physics: { triggerZoneWidth: 40, triggerZoneHeight: 40, bodyWidth: 9 }, 
        links: [1, 4] // Pairs with doors 1 and 4
    },
    { 
        id: 4, x: 965, y: 305, type: 'door_top', scale: 0.5, 
        physics: { triggerZoneWidth: 40, triggerZoneHeight: 40, bodyWidth: 9 }, 
        links: [3] // Pairs with door 3
    },
    { 
        id: 5, x: 965, y: 415, type: 'door_top', scale: 0.5, 
        physics: { triggerZoneWidth: 40, triggerZoneHeight: 40, bodyWidth: 9 }, 
        links: [2] // Pairs with door 2
    }
];