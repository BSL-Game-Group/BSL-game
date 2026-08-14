export const playerIsInsideZone = (player, zone) => {
    if (!player || !zone) {
      return false;}
    
    return (
        player.x >= zone.x &&
        player.x <= zone.x + zone.width &&
        player.y >= zone.y &&
        player.y <= zone.y + zone.height
    );
};