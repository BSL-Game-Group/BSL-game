const { test } = require('node:test');
const assert = require('node:assert');

const { evaluateEquipmentRules, gradeAnswer } = require('../services/grading');

const BSL1 = { required: ['lab_coat', 'glasses'], anyOf: [], optional: [] };
const BSL2 = { required: ['lab_coat', 'gloves'], anyOf: ['mask', 'face_shield'], optional: [] };
const BSL3 = {
  required: ['gloves', 'gloves_2'],
  anyOf: [
    { anyOf: ['closable_lab_coat', 'disposable_overall'] },
    {
      anyOf: [
        { allOf: ['mask', { anyOf: ['glasses', 'face_shield'] }] },
        'bsl3_respirator',
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
  const withRespirator = ['gloves', 'gloves_2', 'closable_lab_coat', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, withRespirator), true);
});

test('BSL-3 accepts mask plus either kind of eye protection', () => {
  const base = ['gloves', 'gloves_2', 'disposable_overall', 'mask'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, [...base, 'glasses']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL3, [...base, 'face_shield']), true);
});

test('BSL-3 needs both pairs of gloves', () => {
  const oneGlove = ['gloves', 'closable_lab_coat', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, oneGlove), false);
});

test('sibling anyOf branches are alternatives, so a single one is enough', () => {
  const noEyeProtection = ['gloves', 'gloves_2', 'disposable_overall', 'mask'];
  const noBodyCovering = ['gloves', 'gloves_2', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, noEyeProtection), true);
  assert.strictEqual(evaluateEquipmentRules(BSL3, noBodyCovering), true);

  // Not vacuous: satisfying NEITHER branch is still wrong, so anyOf is doing work.
  assert.strictEqual(evaluateEquipmentRules(BSL3, ['gloves', 'gloves_2']), false);
});

// The tests above use hand-written rule shapes to pin down the evaluator. These grade
// against the rules the game actually ships, where the branches are wrapped in a single
// allOf so that every group is mandatory.
test('the shipped BSL-3 rules need body covering, face protection and footwear', () => {
  const { REQUIRED_EQUIPMENT } = require('../seeders/20260622000001-seed-bsl-classes');
  const rules = REQUIRED_EQUIPMENT[3];
  const gloves = ['gloves', 'gloves_2'];
  const dressed = [...gloves, 'disposable_overall', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(rules, [...dressed, 'indoor_shoes']), true);
  assert.strictEqual(evaluateEquipmentRules(rules, [...dressed, 'disposable_foot_covers']), true);

  assert.strictEqual(evaluateEquipmentRules(rules, dressed), false);
  assert.strictEqual(
    evaluateEquipmentRules(rules, [...gloves, 'disposable_overall', 'indoor_shoes']),
    false
  );
  assert.strictEqual(
    evaluateEquipmentRules(rules, [...gloves, 'bsl3_respirator', 'indoor_shoes']),
    false
  );
});

test('junk arguments are false rather than a crash', () => {
  assert.strictEqual(evaluateEquipmentRules(undefined, undefined), true);
  assert.strictEqual(evaluateEquipmentRules(BSL1, undefined), false);
  assert.strictEqual(evaluateEquipmentRules(BSL1, 'lab_coat'), false);
});

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
