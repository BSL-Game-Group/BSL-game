import { AUTO, Game, Scale } from 'phaser';
import MainScene from './scenes/main_scene';

// Initialize global translations object that React and Phaser can share
if (typeof window !== 'undefined') {
    window.__gameTranslations = {
        pressEToOpen: 'Press E to open',
        openCloset: 'Open Closet',
        pressE: 'Press E'
    };
}

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
        width: 1280,
        height: 720
    },
    render: {
        antialias: true,
        // Off: Scale.FIT stretches the 1280x720 game by a non-integer
        // factor to fit the window, so per-sprite pixel rounding happens on
        // the GPU after that scale is applied — the player and its
        // separately-positioned equipment sprites could round to different
        // screen pixels and visibly drift apart while moving.
        roundPixels: false,
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
