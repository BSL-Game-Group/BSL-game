export const createWoodFloor = (scene) => {
    const tileSize = 64;

    if (!scene.textures.exists('wood_tile')) {
        const woodTex = scene.textures.get('wood');
        if (woodTex) {
            const woodSrc = woodTex.getSourceImage();
            if (woodSrc) {
                const tileTexture = scene.textures.createCanvas('wood_tile', tileSize, tileSize);
                const ctx = tileTexture.getContext();
                const srcW = woodSrc.naturalWidth || woodSrc.width;
                const srcH = woodSrc.naturalHeight || woodSrc.height;
                ctx.drawImage(woodSrc, 0, 0, srcW, srcH, 0, 0, tileSize, tileSize);
                tileTexture.refresh();
            } else {
                // eslint-disable-next-line no-console
                console.warn('wood source image not available when creating wood_tile');
            }
        } else {
            // eslint-disable-next-line no-console
            console.warn('wood texture not found when creating wood_tile');
        }
    }

    const mapWidth = Math.ceil(scene.playArea.width / tileSize);
    const mapHeight = Math.ceil(scene.playArea.height / tileSize);

    const map = scene.make.tilemap({
        width: mapWidth,
        height: mapHeight,
        tileWidth: tileSize,
        tileHeight: tileSize
    });

    const tileset = map.addTilesetImage('wood_tile', 'wood_tile', tileSize, tileSize, 0, 0);

    const layer = map.createBlankLayer(
        'wood_floor_layer',
        tileset,
        scene.playArea.x,
        scene.playArea.y
    );

    layer.fill(0, 0, 0, mapWidth, mapHeight);
    layer.setDepth(-10);
};

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