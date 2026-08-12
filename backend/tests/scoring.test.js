const { test } = require('node:test');
const assert = require('node:assert');

const { scoreRound } = require('../services/scoring');

test('an answer scores only when the level and the equipment are both right', () => {
  const score = scoreRound([
    { level_correct: true, equipment_correct: true },
    { level_correct: true, equipment_correct: false },
    { level_correct: false, equipment_correct: true },
    { level_correct: false, equipment_correct: false },
  ]);

  assert.strictEqual(score, 1);
});

test('an empty round scores zero', () => {
  assert.strictEqual(scoreRound([]), 0);
});
