const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../app');
const db = require('../models');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

test('returns a microbe that has not been seen yet in the current session', async () => {
  const sessionId = 'session-normal-test';
  
  // 1. Fetch all microbes and pick one to mark as "seen"
  const allMicrobes = await db.Microbe.findAll();
  assert.ok(allMicrobes.length >= 2, 'Need at least two microbes for this test');
  const seenMicrobe = allMicrobes[0];
  
  // 2. Create a round and one answer
  const round = await db.Round.create({
    session_id: sessionId,
    score: 0,
    correct_count: 0,
    answer_count: 1,
  });

  await db.RoundAnswer.create({
    round_id: round.id,
    microbe_id: seenMicrobe.id,
    chosen_level: 1,
    chosen_equipment: [],
    level_correct: false,
    equipment_correct: false,
    attempt: 1,
  });

  // 3. Request a random microbe
  const response = await request(app)
    .get('/api/microbes/random')
    .query({ session_id: sessionId });

  assert.strictEqual(response.status, 200);
  assert.ok(response.body.id, 'Should return a valid microbe');
  assert.notStrictEqual(
    response.body.id, 
    seenMicrobe.id, 
    'Should NOT return the microbe that was already seen'
  );
});

test('resets the seen list automatically when all microbes have been gone through', async () => {
  const sessionId = 'session-exhausted-test';
  
  // 1. Get all available microbes from the database
  const allMicrobes = await db.Microbe.findAll();
  assert.ok(allMicrobes.length > 0, 'Database should be seeded with microbes');

  // 2. Create a round for this session
  const round = await db.Round.create({
    session_id: sessionId,
    score: 0,
    correct_count: 0,
    answer_count: allMicrobes.length,
  });

  // 3. Manually insert a RoundAnswer for EVERY single microbe to simulate 
  // a game where the player has seen all of them
  const answerRecords = allMicrobes.map((microbe) => ({
    round_id: round.id,
    microbe_id: microbe.id,
    chosen_level: 1,
    chosen_equipment: [],
    level_correct: false,
    equipment_correct: false,
    attempt: 1,
  }));
  await db.RoundAnswer.bulkCreate(answerRecords);

  // 4. Request a random microbe. Because all have been seen, the backend 
  // should gracefully reset its exclusion list and return a valid microbe.
  const response = await request(app)
    .get('/api/microbes/random')
    .query({ session_id: sessionId });

  assert.strictEqual(response.status, 200);
  assert.ok(response.body.id, 'It should return a valid microbe ID even after exhaustion');
});