import { BaseInteraction } from './BaseInteraction';

export class InfoInteraction extends BaseInteraction {
    update() {
        const { infoGlow, corridorZone, infoPoint, infoGlowTween, pressEText } = this.scene;
        if (!infoGlow || !corridorZone || !infoPoint) {
          return;}

        const inCorridor = this.isInside(corridorZone);
        infoGlow.setVisible(inCorridor);

        if (infoGlowTween) {
            inCorridor ? infoGlowTween.resume() : infoGlowTween.pause();
        }

        if (inCorridor) {
            pressEText.setVisible(true);
            pressEText.setPosition(infoPoint.x - 40, infoPoint.y - 45);
            if (this.justPressed(this.keyE)) {
                window.dispatchEvent(new Event('info-popup-opened'));
            }
        }
    }
}