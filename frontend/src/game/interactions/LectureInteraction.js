import Phaser from 'phaser';
import { BaseInteraction } from './BaseInteraction';

export class LectureInteraction extends BaseInteraction {
    constructor(scene) {
        super(scene);
        this.playerInsideLectureRoom = false;
    }

    seedPresence() {
        if (this.scene.lectureRoomZone) {
            this.playerInsideLectureRoom = this.isInside(this.scene.lectureRoomZone);
        }
    }

    update() {
        const {
            lectureRoomZone,
            lectureGlow,
            lecturePoint,
            lectureGlowTween,
            lectureMaterialGlow,
            lectureMaterialPoint,
            lectureMaterialGlowTween,
            openmicrobeInfoHint,
            lectureMaterialHint,
        } = this.scene;
        if (!lectureRoomZone) {
            return;
        }

        const inside = this.isInside(lectureRoomZone);

        // Track zone entry
        if (inside && !this.playerInsideLectureRoom) {
            window.dispatchEvent(new Event('lecture-room-entered'));
            this.playerInsideLectureRoom = true;
        } else if (!inside) {
            this.playerInsideLectureRoom = false;
        }

        // Proximity glow & prompt
        if (lectureGlow && lecturePoint) {
            lectureGlow.setVisible(inside);
            if (lectureGlowTween) {
                inside ? lectureGlowTween.resume() : lectureGlowTween.pause();
            }

            if (inside) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, lecturePoint.x, lecturePoint.y
                );
                const closeEnough = dist < 100;

                if (closeEnough) {
                    openmicrobeInfoHint.setVisible(true);
                    openmicrobeInfoHint.setPosition(lecturePoint.x - 40, lecturePoint.y + 45);
                    if (this.justPressed(this.keyE)) {
                        window.dispatchEvent(new Event('microbe-info-popup-opened'));
                    }
                } else {
                    openmicrobeInfoHint.setVisible(false);
                }
            }
        }

        // Lecture-room right-side Lecture material button glow
        if (lectureMaterialGlow) {
            lectureMaterialGlow.setVisible(inside);
            if (lectureMaterialGlowTween) {
                inside ? lectureMaterialGlowTween.resume() : lectureMaterialGlowTween.pause();
            }

            if (inside && lectureMaterialPoint && lectureMaterialHint) {
                const materialDist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, lectureMaterialPoint.x, lectureMaterialPoint.y
                );
                const closeToMaterial = materialDist < 80;

                if (closeToMaterial) {
                    lectureMaterialHint.setVisible(true);
                    lectureMaterialHint.setPosition(lectureMaterialPoint.x - 55, lectureMaterialPoint.y + 35);
                    if (this.justPressed(this.keyE)) {
                        window.dispatchEvent(new Event('lecture-material-popup-opened'));
                    }
                } else {
                    lectureMaterialHint.setVisible(false);
                }
            } else if (lectureMaterialHint) {
                lectureMaterialHint.setVisible(false);
            }
        }
    }
}