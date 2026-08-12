const express = require('express')

const db = require('../models')
const { optionalAuth, requireAuth } = require('../middleware/auth')
const { gradeAnswer } = require('../services/grading')
const { scoreRound } = require('../services/scoring')

const router = express.Router()

const MAX_ANSWERS = 100
const EMPTY_RULES = { required: [], anyOf: [], optional: [] }

const INT32_MAX = 2147483647

function isStorableInteger(value) {
  const asNumber = Number(value)

  return Number.isInteger(asNumber) && Math.abs(asNumber) <= INT32_MAX
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

  return {
    sessionId,
    graded,
    score: scoreRound(graded),
    correctCount: graded.filter((answer) => answer.level_correct && answer.equipment_correct)
      .length,
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

  // One transaction, so a round never exists without the answers that justify its
  // score — which is what makes a stored round re-scorable.
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
      result.graded.map((answer) => ({ ...answer, round_id: created.id })),
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
      result.graded.map((answer) => ({ ...answer, round_id: round.id })),
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
