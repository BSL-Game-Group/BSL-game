const { test } = require('node:test');
const assert = require('node:assert');

const { calculateMultiRoundScore } = require('../services/scoring');

// routes/rounds.js builds this from Object.keys(equipment_slots), which is always the
// same five whatever the level. A shorter array is a shape production never produces.
const ALL_OK = [true, true, true, true, true];

function wrongAt(...positions) {
  return ALL_OK.map((_, index) => !positions.includes(index));
}

function attempt(roomCorrect, equipmentCategories) {
  return { roomCorrect, equipmentCategories };
}

function score(...rounds) {
  return calculateMultiRoundScore({ rounds });
}

test('a single attempt', async (t) => {
  await t.test('the room and all five categories make 90', () => {
    assert.strictEqual(score(attempt(true, ALL_OK)), 90);
  });

  await t.test('each category is worth 12', () => {
    assert.strictEqual(score(attempt(true, wrongAt(4))), 78);
  });

  await t.test('the room is worth 30', () => {
    assert.strictEqual(score(attempt(false, ALL_OK)), 60);
  });

  await t.test('the wrong room in the wrong gear scores nothing', () => {
    assert.strictEqual(score(attempt(false, wrongAt(0, 1, 2, 3, 4))), 0);
  });
});

test('a retry', async (t) => {
  await t.test('a category fixed on the retry is worth half: 6', () => {
    assert.strictEqual(score(attempt(true, wrongAt(4)), attempt(true, ALL_OK)), 84);
  });

  await t.test('two categories fixed on the retry are worth 12 between them', () => {
    assert.strictEqual(score(attempt(true, wrongAt(3, 4)), attempt(true, ALL_OK)), 78);
  });

  await t.test('the room fixed on the retry is worth half: 15', () => {
    assert.strictEqual(score(attempt(false, ALL_OK), attempt(true, ALL_OK)), 75);
  });

  await t.test('what was already right is banked, not paid twice', () => {
    assert.strictEqual(score(attempt(true, ALL_OK), attempt(true, ALL_OK)), 90);
  });

  await t.test('what is still wrong on the retry earns nothing', () => {
    assert.strictEqual(score(attempt(true, wrongAt(4)), attempt(true, wrongAt(4))), 78);
  });

  await t.test('a retry that gets it wrong again does not take back the first attempt', () => {
    assert.strictEqual(
      score(attempt(true, ALL_OK), attempt(false, wrongAt(0, 1, 2, 3, 4))),
      90
    );
  });
});
