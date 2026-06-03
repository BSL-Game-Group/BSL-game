import { Scene } from 'phaser';

const COLORS = {
  fieldBorder: 0x2c3038,
  roomBorder:  0x6a7180,
  charFill:    0xf4f5f7,
  charStroke:  0x8a92a0,
  text:        '#2c3038',
};

export default class LabScene extends Scene {
  constructor() {
    super({ key: 'LabScene' });
  }

  create() {
    this.drawPlayField();
    this.drawCharacter();
  }

  drawPlayField() {
    this.add
      .rectangle(400, 300, 760, 560)
      .setStrokeStyle(2, COLORS.fieldBorder);
    this.add
      .rectangle(400, 24, 90, 26, 0xffffff)
      .setStrokeStyle(1, COLORS.roomBorder);
    this.add
      .text(400, 24, 'START', { color: COLORS.text, fontSize: '12px' })
      .setOrigin(0.5);
  }

  drawCharacter() {
    this.add
      .circle(560, 280, 13, COLORS.charFill)
      .setStrokeStyle(1, COLORS.charStroke);
  }
}
