'use strict';

/**
 * Scores one microbe across its attempts. Every answer is graded on all five equipment
 * categories whatever the level, so a category is worth the same everywhere and a
 * microbe is worth 90: 30 for the room and 60 across the five. A retry is worth half,
 * and only for what was still wrong. Mirrored by frontend/src/utils/scoring.js.
 */
function calculateMultiRoundScore({ rounds }) {
  let totalScore = 0;
  let previouslyCorrectRoom = false;
  let previouslyCorrectCategories = [];

  if (!rounds || !Array.isArray(rounds)) { return 0; }

  rounds.forEach((rd, index) => {
    let roundScore = 0;
    const roomPointsValue = index === 0 ? 30 : 15;

    if (rd.roomCorrect && !previouslyCorrectRoom) {
      roundScore += roomPointsValue;
      previouslyCorrectRoom = true;
    }

    const categoryPointsTotal = index === 0 ? 60 : 30;
    const numCategories = rd.equipmentCategories ? rd.equipmentCategories.length : 1;
    const pointsPerCategory = categoryPointsTotal / (numCategories || 1);

    if (index === 0) {
      previouslyCorrectCategories = [...(rd.equipmentCategories || [])];
      (rd.equipmentCategories || []).forEach((isCorrect) => {
        if (isCorrect) {
          roundScore += pointsPerCategory;
        }
      });
    } else {
      (rd.equipmentCategories || []).forEach((isCorrect, idx) => {
        const wasWrongBefore = !previouslyCorrectCategories[idx];
        if (wasWrongBefore) {
          if (isCorrect) {
            roundScore += pointsPerCategory;
            previouslyCorrectCategories[idx] = true;
          }
        }
      });
    }

    totalScore += roundScore;
  });

  return Math.round(totalScore);
}

module.exports = {
  calculateMultiRoundScore,
};
