const express = require('express')
const { Op } = require('sequelize')

const db = require('../models')

const router = express.Router()

const BOARD_SIZE = 20

router.get('/leaderboard', async (req, res) => {
  // Ordered best-first, then oldest-first, so the first row seen for a user IS
  // their best round and ties fall to whoever got there first. Keeping the pick
  // in JS rather than a window function keeps this in the same model-finder style
  // as the rest of the routes; if the rounds table ever outgrows one query's
  // worth of rows, this becomes a DISTINCT ON.
  //
  // `required: true` makes the join an INNER JOIN, so the Op.ne filter and the join
  // exclude unclaimed guest rounds independently — either one alone would do it.
  const rounds = await db.Round.findAll({
    attributes: ['score', 'correct_count', 'answer_count', 'createdAt'],
    where: { user_id: { [Op.ne]: null } },
    include: { model: db.User, as: 'user', attributes: ['id', 'username'], required: true },
    order: [['score', 'DESC'], ['createdAt', 'ASC']],
  })

  const seen = new Set()
  const board = []

  for (const round of rounds) {
    if (seen.has(round.user.id)) {
      continue
    }

    seen.add(round.user.id)
    board.push({
      username: round.user.username,
      score: round.score,
      correct_count: round.correct_count,
      answer_count: round.answer_count,
      createdAt: round.createdAt,
    })

    if (board.length === BOARD_SIZE) {
      break
    }
  }

  res.json(board)
})

module.exports = router
