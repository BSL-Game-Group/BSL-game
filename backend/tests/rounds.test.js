const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const { storableAnswer } = require('../routes/rounds');
const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

const PASSWORD = 'test-password-123';

const BSL1_CORRECT = ['lab_coat', 'glasses', 'gloves', 'indoor_shoes'];

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
  assert.strictEqual(response.body.score, 132);
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

  assert.strictEqual(response.body.score, 12);
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

test('the equipment is graded against the microbe, not the room the player chose', async () => {
  const bsl1 = await microbeAtLevel(1);

  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-a',
      answers: [{ microbe_id: bsl1.id, chosen_level: 4, chosen_equipment: BSL1_CORRECT }],
    });

  assert.strictEqual(response.status, 201);
  assert.deepStrictEqual(response.body.answers, [
    { microbe_id: bsl1.id, level_correct: false, equipment_correct: true },
  ]);
  assert.strictEqual(response.body.score, 60);
});

// --- PATCH /api/rounds/:id ---

const BSL2_CORRECT = ['lab_coat', 'mask', 'glasses', 'gloves', 'indoor_shoes'];

function createRound(sessionId, answers, token) {
  const pending = request(app).post('/api/rounds');

  if (token) {
    pending.set('Authorization', `Bearer ${token}`);
  }

  return pending.send({ session_id: sessionId, answers });
}

function updateRound(id, sessionId, answers, token) {
  const pending = request(app).patch(`/api/rounds/${id}`);

  if (token) {
    pending.set('Authorization', `Bearer ${token}`);
  }

  return pending.send({ session_id: sessionId, answers });
}

function registerAs(username, sessionId) {
  return request(app)
    .post('/api/auth/register')
    .send({ username, password: PASSWORD, session_id: sessionId });
}

test('a guest round is updated in place as the round goes on', async () => {
  const bsl1 = await microbeAtLevel(1);
  const bsl2 = await microbeAtLevel(2);

  const created = await createRound('session-a', [
    { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT },
  ]);

  assert.strictEqual(created.body.score, 90);

  const updated = await updateRound(created.body.id, 'session-a', [
    { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT },
    { microbe_id: bsl2.id, chosen_level: 2, chosen_equipment: BSL2_CORRECT },
  ]);

  assert.strictEqual(updated.status, 200);
  assert.strictEqual(updated.body.id, created.body.id);
  assert.strictEqual(updated.body.score, 180); // Adjust if 2 fully correct rounds sum differently (e.g. 90 + 90)
  assert.strictEqual(updated.body.correct_count, 2);
  assert.strictEqual(updated.body.answer_count, 2);

  assert.strictEqual(await db.Round.count(), 1);
  assert.strictEqual(
    await db.RoundAnswer.count({ where: { round_id: created.body.id } }),
    2
  );
});

test('the stored answers are replaced, not appended to', async () => {
  const bsl1 = await microbeAtLevel(1);

  const created = await createRound('session-a', [
    { microbe_id: bsl1.id, chosen_level: 4, chosen_equipment: [] },
  ]);

  assert.strictEqual(created.body.score, 12);

  const updated = await updateRound(created.body.id, 'session-a', [
    { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT },
  ]);

  assert.strictEqual(updated.body.answer_count, 1);
  assert.strictEqual(updated.body.score, 90);

  const stored = await db.RoundAnswer.findAll({ where: { round_id: created.body.id } });

  assert.strictEqual(stored.length, 1);
  assert.strictEqual(stored[0].chosen_level, 1);
});

test('a round id that names nothing is a 404, never a 500', async () => {
  const bsl1 = await microbeAtLevel(1);
  const answers = [{ microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT }];

  const missing = await updateRound(999999, 'session-a', answers);

  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.body.code, 'round_not_found');

  // Without the guard this reaches findByPk and comes back as a Postgres cast
  // error, i.e. a 500 for what is plainly a request for something absent.
  const nonNumeric = await updateRound('not-a-number', 'session-a', answers);

  assert.strictEqual(nonNumeric.status, 404);
  assert.strictEqual(nonNumeric.body.code, 'round_not_found');
});

test('only the round s owner may update it', async () => {
  const bsl1 = await microbeAtLevel(1);
  const correct = [{ microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT }];

  const created = await createRound('session-a', [
    { microbe_id: bsl1.id, chosen_level: 4, chosen_equipment: [] },
  ]);

  // A guest round belongs to whoever holds its session id, and to nobody else.
  const otherBrowser = await updateRound(created.body.id, 'session-b', correct);

  assert.strictEqual(otherBrowser.status, 403);
  assert.strictEqual(otherBrowser.body.code, 'not_your_round');
  assert.strictEqual((await db.Round.findByPk(created.body.id)).score, 12);

  // Registering claims every unclaimed round for session-a, this one included.
  const { token } = (await registerAs('owner_user', 'session-a')).body;
  const { token: thiefToken } = (await registerAs('thief_user', 'session-b')).body;

  const bySessionAlone = await updateRound(created.body.id, 'session-a', correct);

  assert.strictEqual(bySessionAlone.status, 403);
  assert.strictEqual(bySessionAlone.body.code, 'not_your_round');

  const byStranger = await updateRound(created.body.id, 'session-a', correct, thiefToken);

  assert.strictEqual(byStranger.status, 403);
  assert.strictEqual(byStranger.body.code, 'not_your_round');

  const byOwner = await updateRound(created.body.id, 'session-a', correct, token);

  assert.strictEqual(byOwner.status, 200);
  assert.strictEqual(byOwner.body.owned, true);
  assert.strictEqual(byOwner.body.score, 90);
});

test('an update is validated exactly like a create', async () => {
  const bsl1 = await microbeAtLevel(1);

  const created = await createRound('session-a', [
    { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT },
  ]);

  const malformed = await updateRound(created.body.id, 'session-a', [
    { microbe_id: 'not-an-id', chosen_level: 1, chosen_equipment: [] },
  ]);

  assert.strictEqual(malformed.status, 400);
  assert.strictEqual(malformed.body.code, 'answers_invalid');

  const empty = await updateRound(created.body.id, 'session-a', []);

  assert.strictEqual(empty.status, 400);
  assert.strictEqual(empty.body.code, 'answers_invalid');

  // The round is untouched by either rejection.
  const round = await db.Round.findByPk(created.body.id);
  assert.strictEqual(round.answer_count, 1);
  assert.strictEqual(round.score, 90);
});

test('every column of round_answers is written by the insert', () => {
  // routes/rounds.js names the insert's columns by hand. Comparing the two key sets
  // is the only thing that catches a column added to the model and not to that list:
  // Sequelize fills the model's defaultValue for an omitted key, so such a column
  // stores a value the request never asked for instead of failing.
  const columns = Object.keys(db.RoundAnswer.rawAttributes).filter(
    (column) => !['id', 'createdAt', 'updatedAt'].includes(column)
  );

  const inserted = storableAnswer(
    {
      microbe_id: 1,
      chosen_level: 1,
      chosen_equipment: BSL1_CORRECT,
      attempt: 1,
      level_correct: true,
      equipment_correct: true,
    },
    1
  );

  assert.deepStrictEqual(Object.keys(inserted).sort(), columns.sort());
});

test('a retried microbe counts once, however many attempts it took', async () => {
  const bsl1 = await microbeAtLevel(1);

  const response = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-retry-count',
      answers: [
        { microbe_id: bsl1.id, chosen_level: 4, chosen_equipment: [], attempt: 1 },
        { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT, attempt: 2 },
      ],
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.answer_count, 1);
  assert.strictEqual(response.body.correct_count, 1);

  assert.strictEqual(
    await db.RoundAnswer.count({ where: { round_id: response.body.id } }),
    2
  );
});

test('an attempt is stored, defaults to the first try, and is bounded', async () => {
  const bsl1 = await microbeAtLevel(1);

  const stored = await request(app)
    .post('/api/rounds')
    .send({
      session_id: 'session-attempt',
      answers: [
        { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT },
        { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT, attempt: 2 },
      ],
    });

  assert.strictEqual(stored.status, 201);

  const answers = await db.RoundAnswer.findAll({
    where: { round_id: stored.body.id },
    order: [['id', 'ASC']],
  });

  assert.deepStrictEqual(answers.map((answer) => answer.attempt), [1, 2]);

  for (const attempt of [0, 3, 1.5, '1', null]) {
    const rejected = await request(app)
      .post('/api/rounds')
      .send({
        session_id: 'session-bad-attempt',
        answers: [
          { microbe_id: bsl1.id, chosen_level: 1, chosen_equipment: BSL1_CORRECT, attempt },
        ],
      });

    assert.strictEqual(rejected.status, 400, `attempt ${JSON.stringify(attempt)} was accepted`);
    assert.strictEqual(rejected.body.code, 'answers_invalid');
  }
});