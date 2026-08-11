// Placeholder until the scoring task lands: one fully correct answer, one point.
// It lives alone in this file precisely so that task changes one function and
// nothing else. Stored round_answers make historical rounds re-scorable, so
// replacing this formula does not orphan the rounds scored under the old one.
function scoreRound(gradedAnswers) {
  return gradedAnswers.filter((answer) => answer.level_correct && answer.equipment_correct).length
}

module.exports = { scoreRound }
