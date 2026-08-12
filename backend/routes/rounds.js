const express = require('express')

const db = require('../models')
const { optionalAuth, requireAuth } = require('../middleware/auth')
const { gradeAnswer } = require('../services/grading')
const { scoreRound } = require('../services/scoring')

const router = express.Router()

const MAX_ANSWERS = 100
const EMPTY_RULES = { required: [], anyOf: [], optional: [] }

// round_answers.chosen_level is a Postgres INTEGER, so anything it cannot hold is a
// bad request, not a wrong answer. A plain isFinite check admits 3.5 and 1e21, and
// measured against the real column those fail in two different ways: bulkCreate
// silently ROUNDS 3.5 to 4, storing an answer that re-scores to a different verdict
// than the one already counted in the round's score, while 1e21 throws `integer out
// of range` and becomes a 500. Rejecting both here is the only place either is
// still cheap to catch.
//
// It measures `value`, never Number(value). Coercing first admitted null, false
// and [] — all of them Number() 0, and 0 is storable — so a request that named no
// level at all was answered 201 and recorded at level 0. A level arrives as a
// number, the same way microbe_id below always has.
const INT32_MAX = 2147483647

function isStorableInteger(value) {
  return Number.isInteger(value) && Math.abs(value) <= INT32_MAX
}

function isWellFormedAnswer(answer) {
  return (
    answer !== null &&
    typeof answer === 'object' &&
    Number.isInteger(answer.microbe_id) &&
    isStorableInteger(answer.chosen_level) &&
    Array.isArray(answer.chosen_equipment) &&
    answer.chosen_equipment.every((item) => typeof item === 'string')
  )
}

router.post('/rounds', optionalAuth, async (req, res) => {
  const { session_id: sessionId, answers } = req.body ?? {}

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return res.status(400).json({ error: 'Missing session_id', code: 'session_id_missing' })
  }

  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) {
    return res.status(400).json({
      error: `answers must be a non-empty array of at most ${MAX_ANSWERS} entries`,
      code: 'answers_invalid',
    })
  }

  if (!answers.every(isWellFormedAnswer)) {
    return res.status(400).json({ error: 'Malformed answer', code: 'answers_invalid' })
  }

  const microbeIds = [...new Set(answers.map((answer) => answer.microbe_id))]
  const microbes = await db.Microbe.findAll({ where: { id: microbeIds } })

  if (microbes.length !== microbeIds.length) {
    return res.status(400).json({ error: 'Unknown microbe', code: 'unknown_microbe' })
  }

  const microbeById = new Map(microbes.map((microbe) => [microbe.id, microbe]))
  const bslClasses = await db.BSLClass.findAll()
  const rulesByLevel = new Map(
    bslClasses.map((bslClass) => [bslClass.class_number, bslClass.required_equipment])
  )

  // Graded here, never taken from the request: score, correct_count and every
  // verdict are the server's answer, not the client's claim.
  //
  // A level with no rules row falls back to EMPTY_RULES, which nothing violates —
  // the same fallback getEquipmentRulesForBslLevel makes on the client. Choosing a
  // level that does not exist therefore costs the level, not the equipment.
  const graded = answers.map((answer) => ({
    microbe_id: answer.microbe_id,
    chosen_level: Number(answer.chosen_level),
    chosen_equipment: answer.chosen_equipment,
    ...gradeAnswer(
      answer,
      microbeById.get(answer.microbe_id),
      rulesByLevel.get(Number(answer.chosen_level)) ?? EMPTY_RULES
    ),
  }))

  const score = scoreRound(graded)
  const correctCount = graded.filter(
    (answer) => answer.level_correct && answer.equipment_correct
  ).length

  // One transaction, so a round never exists without the answers that justify its
  // score — which is what makes a stored round re-scorable.
  const round = await db.sequelize.transaction(async (transaction) => {
    const created = await db.Round.create(
      {
        user_id: req.user ? req.user.id : null,
        session_id: sessionId,
        score,
        correct_count: correctCount,
        answer_count: graded.length,
        claimed_at: null,
      },
      { transaction }
    )

    await db.RoundAnswer.bulkCreate(
      graded.map((answer) => ({ ...answer, round_id: created.id })),
      { transaction }
    )

    return created
  })

  res.status(201).json({
    id: round.id,
    score: round.score,
    correct_count: round.correct_count,
    answer_count: round.answer_count,
    owned: Boolean(req.user),
    answers: graded.map((answer) => ({
      microbe_id: answer.microbe_id,
      level_correct: answer.level_correct,
      equipment_correct: answer.equipment_correct,
    })),
  })
})

const MAX_HISTORY = 50

router.get('/me/rounds', requireAuth, async (req, res) => {
  const rounds = await db.Round.findAll({
    attributes: ['id', 'score', 'correct_count', 'answer_count', 'createdAt'],
    where: { user_id: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: MAX_HISTORY,
  })

  res.json(rounds)
})

module.exports = router
