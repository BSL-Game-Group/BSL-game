import { BaseInteraction } from './BaseInteraction';

export class BslInteraction extends BaseInteraction {
    seedPresence() {
        if (this.scene.bslGlows) {
            for (const entry of this.scene.bslGlows) {
                entry.playerInside = this.isInside(entry.zone);
                if (entry.key === 'BSL-4') {
                    this.scene.bsl4Occupied = entry.playerInside;
                }
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
        let activeKey = null;

        for (const entry of bslGlows) {
            const inside = this.isInside(entry.zone);

            if (inside && !entry.playerInside) {
                entry.glow.setVisible(true);
                entry.tween.resume();
                entry.playerInside = true;
                this.scene.notifyRoomEntry(entry.key);
                if (entry.key === 'BSL-4') {
                    this.scene.bsl4Occupied = true;
                    // Stepping into BSL-4 itself is the suiting-up trigger —
                    // the door lets anyone through, suited or not.
                    if (!window.__bsl4Suited) {
                        window.dispatchEvent(new Event('bsl4-suit-required'));
                    }
                }
            } else if (!inside && entry.playerInside) {
                entry.glow.setVisible(false);
                entry.tween.pause();
                entry.playerInside = false;
                if (entry.key === 'BSL-4') {
                    this.scene.bsl4Occupied = false;
                    // The suit cannot exist outside BSL-4, no matter how the
                    // player got out (the door normally blocks this, but this
                    // is the hard guarantee — e.g. a door left open earlier).
                    if (window.__bsl4Suited) {
                        window.dispatchEvent(new Event('bsl4-suit-forced-off'));
                    }
                }
            }

            if (inside) {
                activeCenter = entry.center;
                activeKey = entry.key;

                if (this.justPressed(this.keyE)) {
                    if (!window.__lectureOpen) {
                        window.dispatchEvent(new Event('lecture-required'));
                    } else if (entry.key === 'BSL-4' && (!window.__bsl4Ready || this.scene.bsl4Door?.isOpen)) {
                        window.dispatchEvent(new Event('bsl4-not-ready'));
                    } else if (entry.key === 'BSL-3' && this.scene.bsl3Door?.isOpen) {
                        window.dispatchEvent(new Event('bsl-door-required'));
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
                const pressELabel = this.scene.hintManager?.pressELabel || 'Press E';
                bslHint.setText(activeKey ? `${activeKey} — ${pressELabel}` : pressELabel);
                bslHint.setVisible(true);
                bslHint.setPosition(activeCenter.x - 28, hintY);
            } else {
                bslHint.setVisible(false);
            }
        }
    }
}