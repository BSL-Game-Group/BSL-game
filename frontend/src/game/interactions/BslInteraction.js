import { BaseInteraction } from './BaseInteraction';

export class BslInteraction extends BaseInteraction {
    seedPresence() {
        if (this.scene.bslGlows) {
            for (const entry of this.scene.bslGlows) {
                entry.playerInside = this.isInside(entry.zone);
                if (entry.playerInside) {
                    entry.glow.setVisible(true);
                    entry.tween.resume();
                }
            }
        }
    }

    update() {
        const { bslGlows, bslHint } = this.scene;
        if (!bslGlows) {
          return;}

        let activeCenter = null;

        for (const entry of bslGlows) {
            const inside = this.isInside(entry.zone);

            if (inside && !entry.playerInside) {
                entry.glow.setVisible(true);
                entry.tween.resume();
                entry.playerInside = true;
                this.scene.notifyRoomEntry(entry.key);
            } else if (!inside && entry.playerInside) {
                entry.glow.setVisible(false);
                entry.tween.pause();
                entry.playerInside = false;
            }

            if (inside) {
                activeCenter = entry.center;

                if (this.justPressed(this.keyE)) {
                    if (!window.__lectureOpen) {
                        window.dispatchEvent(new Event('lecture-required'));
                    } else {
                        window.dispatchEvent(
                            new CustomEvent('answer-popup-opened', {
                                detail: { level: entry.key }
                            })
                        );
                    }
                }
            }
        }

        if (bslHint) {
            if (activeCenter) {
                const hintY = activeCenter.y > 80
                    ? activeCenter.y - 48
                    : activeCenter.y + 36;
                bslHint.setVisible(true);
                bslHint.setPosition(activeCenter.x - 28, hintY);
            } else {
                bslHint.setVisible(false);
            }
        }
    }
}