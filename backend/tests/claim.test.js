const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert');

const db = require('../models');
const { claimRoundsForSession } = require('../services/claim');
const { resetGameTables, closeDb } = require('./helpers/db');

beforeEach(resetGameTables);
after(closeDb);

function guestRound(sessionId, score = 1) {
  return db.Round.create({
    session_id: sessionId,
    score,
    correct_count: score,
    answer_count: 5,
  });
}

function makeUser(username) {
  return db.User.create({ username, password_hash: 'x' });
}

test('claims every unclaimed round for the session, not just the last one', async () => {
  const user = await makeUser('Test_User');
  await guestRound('session-a', 1);
  await guestRound('session-a', 2);
  await guestRound('session-a', 3);

  const claimed = await claimRoundsForSession('session-a', user.id);

  assert.strictEqual(claimed, 3);
  assert.strictEqual(await db.Round.count({ where: { user_id: user.id } }), 3);
});

test('stamps claimed_at so a rescued round is distinguishable later', async () => {
  const user = await makeUser('Test_User');
  await guestRound('session-a');

  await claimRoundsForSession('session-a', user.id);

  const round = await db.Round.findOne({ where: { user_id: user.id } });
  assert.notStrictEqual(round.claimed_at, null);
});

test('is idempotent — signing in again claims nothing', async () => {
  const user = await makeUser('Test_User');
  await guestRound('session-a');

  await claimRoundsForSession('session-a', user.id);
  const second = await claimRoundsForSession('session-a', user.id);

  assert.strictEqual(second, 0);
});

test('cannot steal a round that already belongs to someone else', async () => {
  const owner = await makeUser('owner_user');
  const thief = await makeUser('thief_user');
  const round = await guestRound('session-a');
  await claimRoundsForSession('session-a', owner.id);

  const claimed = await claimRoundsForSession('session-a', thief.id);

  assert.strictEqual(claimed, 0);
  await round.reload();
  assert.strictEqual(round.user_id, owner.id);
});

test('leaves other sessions alone', async () => {
  const user = await makeUser('Test_User');
  await guestRound('session-a');
  const other = await guestRound('session-b');

  const claimed = await claimRoundsForSession('session-a', user.id);

  assert.strictEqual(claimed, 1);
  await other.reload();
  assert.strictEqual(other.user_id, null);
});

test('a session with nothing to claim is not an error', async () => {
  const user = await makeUser('Test_User');

  assert.strictEqual(await claimRoundsForSession('never-played', user.id), 0);
  assert.strictEqual(await claimRoundsForSession(undefined, user.id), 0);
  assert.strictEqual(await claimRoundsForSession('', user.id), 0);
  assert.strictEqual(await claimRoundsForSession(null, user.id), 0);
  assert.strictEqual(await claimRoundsForSession(42, user.id), 0);
});

test('honours a caller supplied transaction, so a rollback un-claims', async () => {
  const user = await makeUser('Test_User');
  await guestRound('session-a');

  const transaction = await db.sequelize.transaction();
  const claimed = await claimRoundsForSession('session-a', user.id, { transaction });
  assert.strictEqual(claimed, 1);
  await transaction.rollback();

  assert.strictEqual(await db.Round.count({ where: { user_id: user.id } }), 0);
  assert.strictEqual(await db.Round.count({ where: { user_id: null } }), 1);
});
