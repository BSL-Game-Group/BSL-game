// backend/services/scoring.js

// Point mapping per BSL level and round attempt
const ITEM_POINTS = {
  1: { round1: 15, round2: 7 },
  2: { round1: 12, round2: 6 },
  3: { round1: 12, round2: 6 },
  4: { round1: 30, round2: 15 },
};

/**
 * Calculates score for a single round attempt.
 */
function calculateScore({ bslLevel, round = 1, roomCorrect, equipmentCategories = [] }) {
  let score = 0;

  // 1. Room Score
  if (roomCorrect) {
    score += round === 1 ? 30 : 15;
  }

  // 2. Equipment Score lookup
  const levelConfig = ITEM_POINTS[bslLevel] || ITEM_POINTS[1];
  const pointsPerItem = round === 2 ? levelConfig.round2 : levelConfig.round1;

  equipmentCategories.forEach((isCorrect) => {
    if (isCorrect) {
      score += pointsPerItem;
    }
  });

  return score;
}

/**
 * Calculates cumulative score across multi-round attempts.
 * Round 2 points are only awarded for items that failed/missed in Round 1.
 */
function calculateMultiRoundScore({ bslLevel, rounds = [] }) {
  let totalScore = 0;

  const round1 = rounds.find((r) => r.round === 1);
  const round2 = rounds.find((r) => r.round === 2);

  // Process Round 1 base score
  if (round1) {
    totalScore += calculateScore({ bslLevel, ...round1 });
  }

  // Process Round 2 delta score
  if (round2) {
    // Room: Award 15 pts only if missed in R1 and corrected in R2
    if (!round1?.roomCorrect && round2.roomCorrect) {
      totalScore += 15;
    }

    const r1Categories = round1?.equipmentCategories || [];
    const r2Categories = round2.equipmentCategories || [];

    const levelConfig = ITEM_POINTS[bslLevel] || ITEM_POINTS[1];
    const retryPointsPerItem = levelConfig.round2;

    r2Categories.forEach((isCorrectInR2, index) => {
      const failedInR1 = !r1Categories[index];

      // Only score items that were incorrect/failed in Round 1
      if (failedInR1) {
        if (isCorrectInR2) {
          totalScore += retryPointsPerItem;
        } else if (bslLevel === 4) {
          // BSL 4 special case: 15 points on retry attempt
          totalScore += 15;
        }
      }
    });
  }

  return totalScore;
}

module.exports = {
  calculateScore,
  calculateMultiRoundScore,
};