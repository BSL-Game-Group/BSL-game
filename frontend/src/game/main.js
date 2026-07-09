import { AUTO, Game, Scale } from 'phaser';
import MainScene from './scenes/main_scene';

const config = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#fafbfc',
    // Let Phaser's Scale manager fit and centre the canvas in its parent, instead
    // of the browser squashing a fixed 1280x720 canvas via CSS.
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    render: {
        antialias: true,
        roundPixels: true,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [MainScene],
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
};

export default StartGame;
