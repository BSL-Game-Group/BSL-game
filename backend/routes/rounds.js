const express = require('express')

const db = require('../models')
const { optionalAuth, requireAuth } = require('../middleware/auth')
const { gradeAnswer } = require('../services/grading')
const { scoreRound, calculateScore, calculateMultiRoundScore } = require('../services/scoring')
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

function isWellFormedAttempt(value) {
  return value === undefined || value === 1 || value === 2
}

function isWellFormedAnswer(answer) {
  return (
    answer !== null &&
    typeof answer === 'object' &&
    Number.isInteger(answer.microbe_id) &&
    isStorableInteger(answer.chosen_level) &&
    Array.isArray(answer.chosen_equipment) &&
    answer.chosen_equipment.every((item) => typeof item === 'string') &&
    isWellFormedAttempt(answer.attempt)
  )
}

async function validateAndGrade(body) {
  const { session_id: sessionId, answers } = body ?? {}

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return {
      error: {
        status: 400,
        body: { error: 'Missing session_id', code: 'session_id_missing' },
      },
    }
  }

  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) {
    return {
      error: {
        status: 400,
        body: {
          error: `answers must be a non-empty array of at most ${MAX_ANSWERS} entries`,
          code: 'answers_invalid',
        },
      },
    }
  }

  if (!answers.every(isWellFormedAnswer)) {
    return {
      error: { status: 400, body: { error: 'Malformed answer', code: 'answers_invalid' } },
    }
  }

  const microbeIds = [...new Set(answers.map((answer) => answer.microbe_id))]
  const microbes = await db.Microbe.findAll({ where: { id: microbeIds } })

  if (microbes.length !== microbeIds.length) {
    return {
      error: { status: 400, body: { error: 'Unknown microbe', code: 'unknown_microbe' } },
    }
  }

  const microbeById = new Map(microbes.map((microbe) => [microbe.id, microbe]))
  const bslClasses = await db.BSLClass.findAll()
  const rulesByLevel = new Map(
    bslClasses.map((bslClass) => [bslClass.class_number, bslClass.required_equipment])
  )

  let totalScore = 0

  const graded = answers.map((answer) => {
    const chosenLevelNum = Number(answer.chosen_level)
    const grade = gradeAnswer(
      answer,
      microbeById.get(answer.microbe_id),
      rulesByLevel.get(chosenLevelNum) ?? EMPTY_RULES
    )

    // Extract category correctness array from grade.equipment_slots
    const slots = grade.equipment_slots || {}
    const categoryIds = Object.keys(slots)
    const equipmentCategories = categoryIds.map((id) => slots[id].status === 'ok')

    // Calculate points using your scoring.js calculateScore engine with proper data parameters
    const answerScore = calculateScore({
      bslLevel: chosenLevelNum,
      round: answer.attempt ?? 1,
      roomCorrect: grade.level_correct,
      equipmentCategories: equipmentCategories,
    })

    totalScore += answerScore

    return {
      microbe_id: answer.microbe_id,
      chosen_level: chosenLevelNum,
      chosen_equipment: answer.chosen_equipment,
      attempt: answer.attempt ?? 1,
      ...grade,
    }
  })

  return {
    sessionId,
    graded,
    score: totalScore,
    correctCount: graded.filter((answer) => answer.level_correct && answer.equipment_correct)
      .length,
  }
}

function storableAnswer(answer, roundId) {
  return {
    round_id: roundId,
    microbe_id: answer.microbe_id,
    chosen_level: answer.chosen_level,
    chosen_equipment: answer.chosen_equipment,
    attempt: answer.attempt,
    level_correct: answer.level_correct,
    equipment_correct: answer.equipment_correct,
  }
}

function roundResponse(round, graded, owned) {
  return {
    id: round.id,
    score: round.score,
    correct_count: round.correct_count,
    answer_count: round.answer_count,
    owned,
    answers: graded.map((answer) => ({
      microbe_id: answer.microbe_id,
      level_correct: answer.level_correct,
      equipment_correct: answer.equipment_correct,
    })),
  }
}

router.post('/rounds', optionalAuth, async (req, res) => {
  const result = await validateAndGrade(req.body)

  if (result.error) {
    return res.status(result.error.status).json(result.error.body)
  }

  const round = await db.sequelize.transaction(async (transaction) => {
    const created = await db.Round.create(
      {
        user_id: req.user ? req.user.id : null,
        session_id: result.sessionId,
        score: result.score,
        correct_count: result.correctCount,
        answer_count: result.graded.length,
        claimed_at: null,
      },
      { transaction }
    )

    await db.RoundAnswer.bulkCreate(
      result.graded.map((answer) => storableAnswer(answer, created.id)),
      { transaction }
    )

    return created
  })

  res.status(201).json(roundResponse(round, result.graded, Boolean(req.user)))
})

router.patch('/rounds/:id', optionalAuth, async (req, res) => {
  const roundId = Number(req.params.id)

  if (!Number.isInteger(roundId) || roundId < 1 || roundId > INT32_MAX) {
    return res.status(404).json({ error: 'Round not found', code: 'round_not_found' })
  }

  const round = await db.Round.findByPk(roundId)

  if (!round) {
    return res.status(404).json({ error: 'Round not found', code: 'round_not_found' })
  }

  const { session_id: sessionId } = req.body ?? {}
  const authorized =
    round.user_id === null
      ? typeof sessionId === 'string' && sessionId === round.session_id
      : Boolean(req.user) && req.user.id === round.user_id

  if (!authorized) {
    return res.status(403).json({ error: 'Not your round', code: 'not_your_round' })
  }

  const result = await validateAndGrade(req.body)

  if (result.error) {
    return res.status(result.error.status).json(result.error.body)
  }

  await db.sequelize.transaction(async (transaction) => {
    await round.update(
      {
        score: result.score,
        correct_count: result.correctCount,
        answer_count: result.graded.length,
      },
      { transaction }
    )

    await db.RoundAnswer.destroy({ where: { round_id: round.id }, transaction })

    await db.RoundAnswer.bulkCreate(
      result.graded.map((answer) => storableAnswer(answer, round.id)),
      { transaction }
    )
  })

  res.json(roundResponse(round, result.graded, round.user_id !== null))
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
module.exports.storableAnswer = storableAnswer