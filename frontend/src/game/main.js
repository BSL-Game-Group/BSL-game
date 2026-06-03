import { AUTO, Game } from 'phaser';
import LabScene from '../scenes/LabScene';

const config = {
  type: AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#fafbfc',
  scene: [LabScene],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;
