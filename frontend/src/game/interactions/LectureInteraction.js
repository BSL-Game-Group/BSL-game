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
            lectureMaterialGlowTween,
            lectureMaterialPoint,
            lectureMaterialHint,
            pressEText,
            openmicrobeInfoHint,
        } = this.scene;
        if (!lectureRoomZone) {
            return;
        }

        // The height value hardcoded as a new zone. If you change this, remember to update movement.test.jsx
        const lectureRoomZoneModified = {...lectureRoomZone, height: 250}
        const inside = this.isInside(lectureRoomZoneModified);

        // Track zone entry
        if (inside && !this.playerInsideLectureRoom) {
            window.dispatchEvent(new Event('lecture-room-entered'));
            this.playerInsideLectureRoom = true;
        } else if (!inside) {
            this.playerInsideLectureRoom = false;
        }

        // Microbe info proximity glow & prompt
        if (lectureGlow && lecturePoint) {
            lectureGlow.setVisible(inside);
            openmicrobeInfoHint.setVisible(false); // Hide the hint by default
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
                }
            }
        }

        // Lecture material proximity glow & prompt
        if (lectureMaterialGlow) {
            lectureMaterialGlow.setVisible(inside);
            lectureMaterialHint.setVisible(false); // Hide the hint by default
            if (lectureMaterialGlowTween) {
                inside ? lectureMaterialGlowTween.resume() : lectureMaterialGlowTween.pause();
            }
            if (inside) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, lectureMaterialPoint.x, lectureMaterialPoint.y
                );
                const closeEnough = dist < 100;

                if (closeEnough) {
                    lectureMaterialHint.setVisible(true);
                    lectureMaterialHint.setPosition(lectureMaterialPoint.x - 40, lectureMaterialPoint.y + 45);
                    if (this.justPressed(this.keyE)) {
                        window.dispatchEvent(new Event('lecture-material-popup-opened'));
                    }
                }
            }
        }
    }
}