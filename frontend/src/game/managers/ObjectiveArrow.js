import { targetWorldPoint } from './objectiveTargets';

const DISTANCE_FROM_PLAYER = 45;
const ARROW_LENGTH = 14;
const ARROW_HALF_WIDTH = 7;
const COLOR = 0xb4531b;

// A small triangle beside the player, pointing at the current objective's
// target. Only shown at the 'directional' stuck stage (React owns that
// decision — see App.jsx mirroring it onto window.__stuckStage) and never
// over a popup. Positioned from the scene's normal update(), same as every
// other hint here: the one-frame lag from not using POST_UPDATE is a couple
// of pixels, invisible on an arrow (unlike the equipment-drag case it
// matters for elsewhere).
export default class ObjectiveArrow {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(1500).setVisible(false);
  }

  update() {
    const { player, isPopupOpen } = this.scene;
    const objective = window.__objective;
    const stage = window.__stuckStage;

    if (isPopupOpen || stage !== 'directional' || !player || !objective?.target) {
      this.graphics.setVisible(false);
      return;
    }

    const point = targetWorldPoint(this.scene, objective.target);
    if (!point) {
      this.graphics.setVisible(false);
      return;
    }

    const angle = Math.atan2(point.y - player.y, point.x - player.x);
    const originX = player.x + Math.cos(angle) * DISTANCE_FROM_PLAYER;
    const originY = player.y + Math.sin(angle) * DISTANCE_FROM_PLAYER;

    const tipX = originX + Math.cos(angle) * ARROW_LENGTH;
    const tipY = originY + Math.sin(angle) * ARROW_LENGTH;
    const backX = originX - Math.cos(angle) * (ARROW_LENGTH * 0.4);
    const backY = originY - Math.sin(angle) * (ARROW_LENGTH * 0.4);
    const leftX = backX + Math.cos(angle + Math.PI / 2) * ARROW_HALF_WIDTH;
    const leftY = backY + Math.sin(angle + Math.PI / 2) * ARROW_HALF_WIDTH;
    const rightX = backX + Math.cos(angle - Math.PI / 2) * ARROW_HALF_WIDTH;
    const rightY = backY + Math.sin(angle - Math.PI / 2) * ARROW_HALF_WIDTH;

    this.graphics.clear();
    this.graphics.fillStyle(COLOR, 0.95);
    this.graphics.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);
    this.graphics.setVisible(true);
  }

  destroy() {
    this.graphics.destroy();
  }
}
