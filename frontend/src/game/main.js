import { AUTO, Game, Scale } from 'phaser';
import MainScene from './scenes/main_scene';

const config = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#fafbfc',
    // Render the backing store at the device's pixel ratio so the canvas stays
    // sharp on retina/high-DPI screens, and let Phaser scale it to fit the parent
    // (instead of the browser squashing a fixed 1280x720 canvas via CSS).
    resolution: window.devicePixelRatio || 1,
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
