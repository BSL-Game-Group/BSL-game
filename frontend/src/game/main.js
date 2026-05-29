import { AUTO, Game } from 'phaser';

const config = {
    type: AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#a48a6c',
}

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;
