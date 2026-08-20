const { test } = require('node:test');
const assert = require('node:assert');

const { calculateScore } = require('../services/scoring');

test('BSL 1 Equipment & Room Scoring', async (t) => {
  await t.test('Round 1: Perfect score (Room + All Equipment)', () => {
    // BSL 1 has 4 equipment categories
    const categories = [true, true, true, true];
    const score = calculateScore({ bslLevel: 1, round: 1, roomCorrect: true, equipmentCategories: categories });
    // 30 (Room) + 60 (Equipment) = 90
    assert.strictEqual(score, 90);
  });

  await t.test('Round 1: Room correct + 1 incorrect equipment category', () => {
    // 3 correct (15 each), 1 incorrect
    const categories = [true, true, true, false];
    const score = calculateScore({ bslLevel: 1, round: 1, roomCorrect: true, equipmentCategories: categories });
    // 30 (Room) + (15 + 15 + 15 ) = 75
    assert.strictEqual(score, 75);
  });
});

test('BSL 2 & 3 Equipment Scoring (5 Categories)', async (t) => {
  await t.test('BSL 2 Round 1: Perfect equipment score', () => {
    const categories = [true, true, true, true, true];
    const score = calculateScore({ bslLevel: 2, round: 1, roomCorrect: false, equipmentCategories: categories });
    // 0 (Room) + 60 (Equipment: 12/12/12/12/12) = 60
    assert.strictEqual(score, 60);
  });

  await t.test('BSL 3 Round 1: 1 incorrect category', () => {
    const categories = [true, true, true, true, false];
    const score = calculateScore({ bslLevel: 3, round: 1, roomCorrect: false, equipmentCategories: categories });
    // 0 (Room) + (12 * 4) + 0 = 48
    assert.strictEqual(score, 48);
  });
});

test('BSL 4 Equipment Scoring (2 Categories)', async (t) => {
  await t.test('BSL 4 Round 1: Perfect score', () => {
    const categories = [true, true];
    const score = calculateScore({ bslLevel: 4, round: 1, roomCorrect: true, equipmentCategories: categories });
    // 30 (Room) + 60 (Equipment: 30/30) = 90
    assert.strictEqual(score, 90);
  });

  await t.test('BSL 4 Round 1: 1 incorrect category', () => {
    const categories = [true, false];
    const score = calculateScore({ bslLevel: 4, round: 1, roomCorrect: true, equipmentCategories: categories });
    // 30 (Room) + 30 + 0 = 60
    assert.strictEqual(score, 60);
  });
});

/*
test('Multi-Round Cumulative Scoring (Round 2 targets only failed items from Round 1)', async (t) => {
  await t.test('BSL 1: Room wrong in Round 1, fixed in Round 2; Equipment 3/4 correct in Round 1, 4th fixed in Round 2', () => {
    const rounds = [
      { round: 1, roomCorrect: false, equipmentCategories: [true, true, true, false] },
      { round: 2, roomCorrect: true, equipmentCategories: [true, true, true, true] },
    ];

    const score = calculateMultiRoundScore({ bslLevel: 1, rounds });
    assert.strictEqual(score, 67);
  });

  await t.test('BSL 2: Room correct in Round 1; Equipment 2/5 correct in Round 1, remaining 3 fixed in Round 2', () => {
    const rounds = [
      { round: 1, roomCorrect: true, equipmentCategories: [true, true, false, false, false] },
      { round: 2, roomCorrect: true, equipmentCategories: [true, true, true, true, true] },
    ];

    const score = calculateMultiRoundScore({ bslLevel: 2, rounds });
    assert.strictEqual(score, 72);
  });

  await t.test('BSL 4: Room correct in Round 1; Equipment 1/2 correct in Round 1, failed again in Round 2', () => {
    const rounds = [
      { round: 1, roomCorrect: true, equipmentCategories: [true, false] },
      { round: 2, roomCorrect: true, equipmentCategories: [true, false] },
    ];

    const score = calculateMultiRoundScore({ bslLevel: 4, rounds });
    assert.strictEqual(score, 75);
  });
});
*/