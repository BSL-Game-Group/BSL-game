const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const PASSWORD = 'test-password-123';

const BSL1_CORRECT = ['lab_coat', 'glasses', 'gloves'];

// Real seeded microbes, so grading runs against the real rule set.
async function microbeAtLevel(level) {
  const microbe = await db.Microbe.findOne({ where: { bsl_level: level } });
  assert.ok(microbe, `the seed data should contain a BSL-${level} microbe`);
  return microbe;
}

async function registerTestUser(sessionId) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ username: 'Test_User', password: PASSWORD, session_id: sessionId });
  return response.body;
}

test('an anonymous round is stored with no owner and graded on the server', async () => {
  const bsl1 = await microbeAtLevel(1);
  const bsl2 = await microbeAtLevel(2);

  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-a',
      answers: [
        { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT },
        { microbe_id: bsl2.id, chosen_level: 2, chosen_equipment: ['lab_coat'] },
      ],
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.score, 1);
  assert.strictEqual(response.body.correct_count, 1);
  assert.strictEqual(response.body.answer_count, 2);
  assert.strictEqual(response.body.owned, false);
  assert.deepStrictEqual(response.body.answers, [
    { microbe_id: bsl1.id, level_correct: true, equipment_correct: true },
    { microbe_id: bsl2.id, level_correct: true, equipment_correct: false },
  ]);

  const round = await db.Round.findByPk(response.body.id);
  assert.strictEqual(round.user_id, null);
  assert.strictEqual(round.session_id, 'session-a');
});

test('the client cannot assert its own score', async () => {
  const bsl1 = await microbeAtLevel(1);

  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-a',
      score: 999,
      correct_count: 999,
      answers: [{ microbe_id: bsl1.id, chosen_level: 4, chosen_equipment: [] }],
    });

  assert.strictEqual(response.body.score, 0);
  assert.strictEqual(response.body.correct_count, 0);
});

test('each answer is stored so the round can be re-scored later', async () => {
  const bsl1 = await microbeAtLevel(1);

  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-a',
      answers: [{ microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT }],
    });

  const answers = await db.RoundAnswer.findAll({ where: { round_id: response.body.id } });

  assert.strictEqual(answers.length, 1);
  assert.deepStrictEqual(answers[0].chosen_equipment, BSL1_CORRECT);
  assert.strictEqual(answers[0].level_correct, true);
  // The stored verdict is the one the player was shown, or a re-score would
  // disagree with the score already on the round.
  assert.strictEqual(answers[0].equipment_correct, true);
});

test('a round posted with a token is owned at creation and needs no claim', async () => {
  const bsl1 = await microbeAtLevel(1);
  const registered = await registerTestUser();

  const response = await request(app)
    .post('/api/rounds')
    .set('Authorization', `Bearer ${registered.token}`)
    .send({
      session_id: 'session-a',
      answers: [{ microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT }],
    });

  assert.strictEqual(response.body.owned, true);

  const round = await db.Round.findByPk(response.body.id);
  assert.strictEqual(round.user_id, registered.user.id);
  assert.strictEqual(round.claimed_at, null);
});

test('an unknown microbe id is a 400 and writes nothing', async () => {
  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-a',
      answers: [{ microbe_id: 999999, chosen_level: 1, chosen_equipment: [] }],
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.code, 'unknown_microbe');
  assert.strictEqual(await db.Round.count(), 0);
});

test('empty, oversized and malformed answer lists are 400s', async () => {
  const bsl1 = await microbeAtLevel(1);
  const tooMany = Array.from({ length: 101 }, () => ({
    microbe_id: bsl1.id,
    chosen_level: 1,
    chosen_equipment: [],
  }));

  const bodies = [
    { session_id: 'session-a', answers: [] },
    { session_id: 'session-a', answers: tooMany },
    { session_id: 'session-a', answers: 'nope' },
    { session_id: 'session-a' },
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: 'lab_coat' }] },
    { session_id: 'session-a', answers: [{ microbe_id: 'abc', chosen_level: 1, chosen_equipment: [] }] },
    { answers: [{ microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: [] }] },
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: 3.5, chosen_equipment: [] }] },
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: 1e21, chosen_equipment: [] }] },
    // Each of these coerces to a number, and 0 is a perfectly storable integer, so
    // a check that measured Number(value) instead of value called them well-formed
    // and quietly recorded an answer at level 0 rather than refusing the request.
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: null, chosen_equipment: [] }] },
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: false, chosen_equipment: [] }] },
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: [], chosen_equipment: [] }] },
    // A level is a number, the same way microbe_id already has to be one.
    { session_id: 'session-a', answers: [{ microbe_id: bsl1.id, chosen_level: '2', chosen_equipment: [] }] },
  ];

  for (const body of bodies) {
    const response = await request(app).post('/api/rounds').send(body);
    assert.strictEqual(response.status, 400, `expected 400 for ${JSON.stringify(body).slice(0, 60)}`);
  }

  const noBody = await request(app).post('/api/rounds');
  assert.strictEqual(noBody.status, 400);
  assert.strictEqual(noBody.body.code, 'session_id_missing');

  assert.strictEqual(await db.Round.count(), 0);
});

test('a level with no rules costs the level, not the equipment', async () => {
  const bsl1 = await microbeAtLevel(1);

  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-a',
      answers: [{ microbe_id: bsl1.id, chosen_level: 7, chosen_equipment: [] }],
    });

  assert.strictEqual(response.status, 201);
  assert.deepStrictEqual(response.body.answers, [
    { microbe_id: bsl1.id, level_correct: false, equipment_correct: true },
  ]);
  assert.strictEqual(response.body.score, 0);
});
