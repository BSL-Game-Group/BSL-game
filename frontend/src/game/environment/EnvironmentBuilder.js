export const createLabFloor = (scene) => {
    const startX = 0;
    const width = 1280;
    const height = 720;
    const tileScale = 440 / 442;

    const floor = scene.add
        .tileSprite(startX, 0, width, height, 'labs_floor')
        .setOrigin(0, 0);
    floor.tileScaleX = tileScale;
    floor.tileScaleY = tileScale;
    floor.setDepth(-9);
};