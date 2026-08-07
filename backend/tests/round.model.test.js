const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const USERNAME = 'Test_User';

test('a guest round has no owner', async () => {
  const round = await db.Round.create({
    session_id: 'session-a',
    score: 3,
    correct_count: 3,
    answer_count: 5,
  });

  assert.strictEqual(round.user_id, null);
  assert.strictEqual(round.claimed_at, null);
});

test('a round belongs to a user and the user has many rounds', async () => {
  const user = await db.User.create({ username: USERNAME, password_hash: 'x' });
  await db.Round.create({
    user_id: user.id,
    session_id: 'session-a',
    score: 1,
    correct_count: 1,
    answer_count: 1,
  });

  const withRounds = await db.User.findByPk(user.id, {
    include: { model: db.Round, as: 'rounds' },
  });

  assert.strictEqual(withRounds.rounds.length, 1);
  assert.strictEqual(withRounds.rounds[0].score, 1);
});

test('answers hang off a round and carry the chosen equipment as an array', async () => {
  const microbe = await db.Microbe.findOne();
  const round = await db.Round.create({
    session_id: 'session-a',
    score: 0,
    correct_count: 0,
    answer_count: 1,
  });

  await db.RoundAnswer.create({
    round_id: round.id,
    microbe_id: microbe.id,
    chosen_level: 2,
    chosen_equipment: ['lab_coat', 'gloves'],
    level_correct: false,
    equipment_correct: true,
  });

  const withAnswers = await db.Round.findByPk(round.id, {
    include: { model: db.RoundAnswer, as: 'answers' },
  });

  assert.strictEqual(withAnswers.answers.length, 1);
  assert.deepStrictEqual(withAnswers.answers[0].chosen_equipment, ['lab_coat', 'gloves']);
});

// JSONB, not a stringified array — the same failure mode that made every BSL class
// hold a JSON string. An array stored as a string would still round-trip through
// Sequelize but be unusable to anything reading it in SQL.
test('chosen_equipment is stored as a JSON array, not a JSON string', async () => {
  const microbe = await db.Microbe.findOne();
  const round = await db.Round.create({
    session_id: 'session-a',
    score: 0,
    correct_count: 0,
    answer_count: 1,
  });
  await db.RoundAnswer.create({
    round_id: round.id,
    microbe_id: microbe.id,
    chosen_level: 1,
    chosen_equipment: ['lab_coat'],
    level_correct: true,
    equipment_correct: true,
  });

  const [rows] = await db.sequelize.query(
    'SELECT jsonb_typeof(chosen_equipment) AS json_type FROM round_answers'
  );

  assert.strictEqual(rows[0].json_type, 'array');
});

test('deleting a round takes its answers with it', async () => {
  const microbe = await db.Microbe.findOne();
  const round = await db.Round.create({
    session_id: 'session-a',
    score: 0,
    correct_count: 0,
    answer_count: 1,
  });
  await db.RoundAnswer.create({
    round_id: round.id,
    microbe_id: microbe.id,
    chosen_level: 1,
    chosen_equipment: [],
    level_correct: false,
    equipment_correct: false,
  });

  await round.destroy();

  assert.strictEqual(await db.RoundAnswer.count(), 0);
});

test('deleting a user orphans their rounds instead of deleting them', async () => {
  const user = await db.User.create({ username: USERNAME, password_hash: 'x' });
  const round = await db.Round.create({
    user_id: user.id,
    session_id: 'session-a',
    score: 2,
    correct_count: 2,
    answer_count: 2,
  });

  await user.destroy();
  await round.reload();

  assert.strictEqual(round.user_id, null);
  // The round survives: losing the account must not lose the play history.
  assert.strictEqual(await db.Round.count(), 1);
});
