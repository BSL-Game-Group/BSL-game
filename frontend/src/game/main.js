import { AUTO, Game } from 'phaser';
import MainScene from './scenes/main_scene';

const config = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#fafbfc',
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
