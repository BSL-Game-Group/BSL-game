'use strict';

/**
 * Calculates the score for a single round / answers based on granular equipment categories and room correctness.
 */
function scoreRound(gradedAnswers = []) {
  let totalScore = 0;

  for (const answer of gradedAnswers) {
    // 1. Room points: 30 points for a correct BSL level
    if (answer.level_correct) {
      totalScore += 30;
    }

    // 2. Equipment points: 60 total points distributed evenly across categories
    const slots = answer.equipment_slots || {};
    const categoryIds = Object.keys(slots);

    if (categoryIds.length > 0) {
      const pointsPerCategory = 60 / categoryIds.length;

      for (const id of categoryIds) {
        if (slots[id].status === 'ok') {
          totalScore += pointsPerCategory;
        }
      }
    }
  }

  return Math.round(totalScore);
}

function calculateScore({ bslLevel, round = 1, roomCorrect, equipmentCategories }) {
  // Room points: 30 for round 1 if correct[cite: 12]
  let score = roomCorrect ? 30 : 0;

  const categoryPointsTotal = 60;
  const numCategories = equipmentCategories ? equipmentCategories.length : 1;
  const pointsPerCategory = categoryPointsTotal / (numCategories || 1);

  if (equipmentCategories && Array.isArray(equipmentCategories)) {
    for (const isCorrect of equipmentCategories) {
      if (isCorrect) {
        score += pointsPerCategory;
      }
    }
  }

  return Math.round(score);
}

function calculateMultiRoundScore({ bslLevel, rounds }) {
  let totalScore = 0;
  let previouslyCorrectRoom = false;
  let previouslyCorrectCategories = [];

  if (!rounds || !Array.isArray(rounds)) { return 0; }

  rounds.forEach((rd, index) => {
    let roundScore = 0;

    if (rd.roomCorrect && !previouslyCorrectRoom) {
      roundScore += 30;
      previouslyCorrectRoom = true;
    }

    const categoryPointsTotal = 60;
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
  scoreRound,
  calculateScore,
  calculateMultiRoundScore,
};