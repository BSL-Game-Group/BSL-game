// backend/services/scoring.js

// Scoring function designed to support 1st and 2nd tries (kierros 1 / kierros 2)
// while gracefully defaulting to attempt 1 if retry tracking isn't active yet.
function scoreRound(gradedAnswers) {
  let totalScore = 0

  for (const answer of gradedAnswers) {
    const bslLevel = Number(answer.bsl_level || answer.microbe?.bsl_level || 1)

    // Fallback to attempt 1 if room_attempt or equipment_attempt aren't provided by the game yet
    const roomAttempt = Number(answer.room_attempt || 1)
    const equipmentAttempt = Number(answer.equipment_attempt || 1)

    let equipmentScore = 0
    let roomScore = 0

    // Use equipmentAttempt as the placeholder for kierros (round 1 or 2)
    const kierros = equipmentAttempt

    // Get the count of correctly chosen equipment items from the answer object
    const correctCount = Number(answer.correct_equipment_count || answer.correctEquipmentCount || 0)

    // --- 1. EQUIPMENT SCORE CALCULATION BASED ON TABLE ---
    if (bslLevel === 1) {
      // BSL-1 (4 items): Kierros 1 = 60/15/15/15/15, Kierros 2 = 28/7/7/7/7
      if (kierros === 1) {
        equipmentScore = calculateEquipmentScore(correctCount, [60, 15, 15, 15, 15])
      } else {
        equipmentScore = calculateEquipmentScore(correctCount, [28, 7, 7, 7, 7])
      }
    } else if (bslLevel === 2 || bslLevel === 3) {
      // BSL-2 / BSL-3 (5 items): Kierros 1 = 60/12/12/12/12/12, Kierros 2 = 30/6/6/6/6/6
      if (kierros === 1) {
        equipmentScore = calculateEquipmentScore(correctCount, [60, 12, 12, 12, 12, 12])
      } else {
        equipmentScore = calculateEquipmentScore(correctCount, [30, 6, 6, 6, 6, 6])
      }
    } else if (bslLevel === 4) {
      // BSL-4 (2 items): Kierros 1 = 60/30/30, Kierros 2 = 30/15/15
      if (kierros === 1) {
        equipmentScore = calculateEquipmentScore(correctCount, [60, 30, 30])
      } else {
        equipmentScore = calculateEquipmentScore(correctCount, [30, 15, 15])
      }
    }

    // --- 2. ROOM SCORE CALCULATION ---
    // BSL-1/2/3/4 share the same room points: 30 for Kierros 1, 15 for Kierros 2
    if (answer.room_correct) {
      roomScore = (kierros === 1) ? 30 : 15
    }

    totalScore += roomScore + equipmentScore
  }

  return totalScore
}

// --- HELPER FUNCTION TO SUM POINTS BASED ON CORRECT ITEMS ---
function calculateEquipmentScore(correctCount, pointsArray) {
  let score = 0
  // Sums up points based on how many items were correct, up to the length of the points array
  for (let i = 0; i <= correctCount && i < pointsArray.length; i++) {
    score += pointsArray[i]
  }
  return score
}

module.exports = { scoreRound }