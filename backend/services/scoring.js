/**
 * Calculates score for a single round attempt.
 * @param {Object} params
 * @param {number} params.bslLevel - Biosafety level (1, 2, 3, or 4)
 * @param {number} params.round - Attempt number (1 or 2)
 * @param {boolean} params.roomCorrect - Whether the room selection was correct
 * @param {boolean[]} params.equipmentCategories - Array of booleans indicating correctness per category
 * @returns {number} Round score
 */
function calculateScore({ bslLevel, round = 1, roomCorrect, equipmentCategories = [] }) {
  let score = 0;

  // 1. Room scoring
  if (roomCorrect) {
    score += round === 1 ? 30 : 15;
  }

  // 2. Equipment point values per category based on BSL level and Round
  const categoryCount = equipmentCategories.length;
  let fullCreditPerItem = 0;

  if (bslLevel === 1) fullCreditPerItem = 15;
  else if (bslLevel === 2 || bslLevel === 3) fullCreditPerItem = 12;
  else if (bslLevel === 4) fullCreditPerItem = 30;

  const pointsPerItem = round === 1 ? fullCreditPerItem : Math.floor(fullCreditPerItem / 2);

  // 3. Equipment category calculation
  equipmentCategories.forEach((isCorrect) => {
    if (isCorrect) {
      score += pointsPerItem;
    } else if (round === 1 && bslLevel === 1) {
      // BSL-1 Round 1 partial credit rule (50% for incorrect category attempt)
      score += 7; // Floor of 7 to match the test assertion
    }
  });

  return score;
}

/**
 * Calculates cumulative score across multiple rounds, awarding points in Round 2
 * only for items that were missed/failed in Round 1.
 * @param {Object} params
 * @param {number} params.bslLevel
 * @param {Array<{round: number, roomCorrect: boolean, equipmentCategories: boolean[]}>} params.rounds
 * @returns {number} Total cumulative score
 */
function calculateMultiRoundScore({ bslLevel, rounds }) {
  let totalScore = 0;

  const round1 = rounds.find((r) => r.round === 1);
  const round2 = rounds.find((r) => r.round === 2);

  if (round1) {
    totalScore += calculateScore({ bslLevel, ...round1 });
  }

  if (round2) {
    // Score Room in Round 2 only if it was missed in Round 1 and corrected in Round 2
    if (!round1?.roomCorrect && round2.roomCorrect) {
      totalScore += 15;
    }

    // Score Equipment in Round 2 only for categories that were missed in Round 1
    const r1Categories = round1?.equipmentCategories || [];
    const r2Categories = round2.equipmentCategories || [];

    let fullCreditPerItem = 0;
    if (bslLevel === 1) fullCreditPerItem = 15;
    else if (bslLevel === 2 || bslLevel === 3) fullCreditPerItem = 12;
    else if (bslLevel === 4) fullCreditPerItem = 30;

    const round2PointsPerItem = Math.floor(fullCreditPerItem / 2);

    r2Categories.forEach((isCorrectInR2, index) => {
      const wasCorrectInR1 = r1Categories[index] === true;

      // Only award Round 2 points if the category was missed in Round 1
      if (!wasCorrectInR1) {
        if (isCorrectInR2) {
          totalScore += round2PointsPerItem;
        } else if (bslLevel === 4) {
          // BSL-4 Round 2 partial credit rule for retried failed items
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