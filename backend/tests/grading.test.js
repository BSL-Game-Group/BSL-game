const { test } = require('node:test');
const assert = require('node:assert');

const { evaluateEquipmentRules, gradeAnswer } = require('../services/grading');

// Fixtures for the three shapes of rule tree the grammar has to handle: plain
// `required` only, a flat `anyOf`, and a nested one. They are named after the
// levels those shapes were taken from, but they are NOT the authoritative rule
// sets — BSL-1's real server rules also require gloves (decided 2026-08-07), and
// backend/tests/requiredEquipment.test.js is what guards the real data. Do not
// "correct" these to match the database; these tests are about the grammar.
const BSL1 = { required: ['lab_coat', 'glasses'], anyOf: [], optional: [] };
const BSL2 = { required: ['lab_coat', 'gloves'], anyOf: ['mask', 'face_shield'], optional: [] };
const BSL3 = {
  required: ['gloves', 'gloves_2'],
  anyOf: [
    { anyOf: ['closable_lab_coat', 'disposable_overall'] },
    {
      anyOf: [
        { allOf: ['mask', { anyOf: ['glasses', 'face_shield'] }] },
        'respirator',
      ],
    },
  ],
  optional: [],
};

test('every required item must be worn', () => {
  assert.strictEqual(evaluateEquipmentRules(BSL1, ['lab_coat', 'glasses']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL1, ['lab_coat']), false);
});

test('extra equipment does not spoil a correct answer', () => {
  assert.strictEqual(evaluateEquipmentRules(BSL1, ['lab_coat', 'glasses', 'gloves']), true);
});

test('a flat anyOf needs exactly one of its options', () => {
  assert.strictEqual(evaluateEquipmentRules(BSL2, ['lab_coat', 'gloves', 'mask']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL2, ['lab_coat', 'gloves', 'face_shield']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL2, ['lab_coat', 'gloves']), false);
});

test('BSL-3 accepts a respirator in place of mask-plus-eye-protection', () => {
  const withRespirator = ['gloves', 'gloves_2', 'closable_lab_coat', 'respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, withRespirator), true);
});

test('BSL-3 accepts mask plus either kind of eye protection', () => {
  const base = ['gloves', 'gloves_2', 'disposable_overall', 'mask'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, [...base, 'glasses']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL3, [...base, 'face_shield']), true);
});

test('BSL-3 needs both pairs of gloves', () => {
  const oneGlove = ['gloves', 'closable_lab_coat', 'respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, oneGlove), false);
});

// The top-level anyOf is an OR across its branches, so satisfying EITHER the body
// covering or the breathing branch satisfies the whole set. The nesting reads like
// "both groups are needed", and for real BSL-3 work both are — but that is not what
// the evaluator does, on the client or here.
//
// This is inherited deliberately, not overlooked. The client is the thing that
// tells a player whether they are right, and frontend/tests/equipmentRules.test.js
// (its 'supports nested anyOf and allOf equipment groups' case) already locks this
// behaviour by asserting that gloves + a closable lab coat, with nothing at all for
// breathing, is correct. A stricter server would grade an answer the game has just
// called correct as wrong — the failure mode the plan's PR 2 prerequisite exists to
// prevent. Tightening it means changing the client, its test and this test together.
//
// Both assertions below were `false` in the plan's version of this task; they are
// the two tests that failed against the plan's own implementation.
test('a single anyOf branch is enough, which grades BSL-3 more leniently than reality', () => {
  const noEyeProtection = ['gloves', 'gloves_2', 'disposable_overall', 'mask'];
  const noBodyCovering = ['gloves', 'gloves_2', 'respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, noEyeProtection), true);
  assert.strictEqual(evaluateEquipmentRules(BSL3, noBodyCovering), true);

  // Not vacuous: satisfying NEITHER branch is still wrong, so anyOf is doing work.
  assert.strictEqual(evaluateEquipmentRules(BSL3, ['gloves', 'gloves_2']), false);
});

test('junk arguments are false rather than a crash', () => {
  assert.strictEqual(evaluateEquipmentRules(undefined, undefined), true);
  assert.strictEqual(evaluateEquipmentRules(BSL1, undefined), false);
  assert.strictEqual(evaluateEquipmentRules(BSL1, 'lab_coat'), false);
});

// A malformed rule NODE must fail closed. This is the lesson of Task 10, where
// required_equipment held a JSON string instead of an object and the grader
// answered `true` for every equipment answer ever submitted — silently marking
// everyone correct. "Unrecognised means not satisfied" is the safe direction, and
// these are the branches of the rule walker no valid rule tree reaches.
test('an unrecognisable rule node is not satisfied', () => {
  const withNode = (node) => evaluateEquipmentRules({ required: [], anyOf: [node] }, ['mask']);

  assert.strictEqual(withNode(null), false);
  assert.strictEqual(withNode(42), false);
  assert.strictEqual(withNode({ unknownOperator: ['mask'] }), false);

  // A bare nested array is read as alternatives, the same as the client reads it.
  assert.strictEqual(withNode(['mask', 'face_shield']), true);
  assert.strictEqual(withNode(['respirator']), false);
});

test('the level is right when it matches the microbe', () => {
  const graded = gradeAnswer(
    { chosen_level: 2, chosen_equipment: ['lab_coat', 'gloves', 'mask'] },
    { bsl_level: 2 },
    BSL2
  );

  assert.deepStrictEqual(graded, { level_correct: true, equipment_correct: true });
});

test('the two verdicts are independent', () => {
  const graded = gradeAnswer(
    { chosen_level: 1, chosen_equipment: ['lab_coat', 'glasses'] },
    { bsl_level: 3 },
    BSL1
  );

  assert.deepStrictEqual(graded, { level_correct: false, equipment_correct: true });
});

test('a level sent as a string still compares correctly', () => {
  const graded = gradeAnswer(
    { chosen_level: '2', chosen_equipment: [] },
    { bsl_level: 2 },
    BSL2
  );

  assert.strictEqual(graded.level_correct, true);
});
