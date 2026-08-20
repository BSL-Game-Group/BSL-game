const { test } = require('node:test');
const assert = require('node:assert');

const {
  evaluateEquipmentRules,
  evaluateEquipmentSlots,
  gradeAnswer,
} = require('../services/grading');

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

test('extra equipment now spoils an otherwise correct answer', () => {
  assert.strictEqual(evaluateEquipmentRules(BSL1, ['lab_coat', 'glasses']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL1, ['lab_coat', 'glasses', 'gloves']), false);
});

test('a flat anyOf needs exactly one of its options', () => {
  assert.strictEqual(evaluateEquipmentRules(BSL2, ['lab_coat', 'gloves', 'mask']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL2, ['lab_coat', 'gloves', 'face_shield']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL2, ['lab_coat', 'gloves']), false);
});

test('BSL-3 accepts a respirator in place of mask-plus-eye-protection', () => {
  const withRespirator = ['gloves', 'gloves_2', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, withRespirator), true);

  // Adding body covering satisfies the OTHER sibling branch, so one of the two is
  // always redundant — and redundant gear is now wrong.
  assert.strictEqual(
    evaluateEquipmentRules(BSL3, [...withRespirator, 'closable_lab_coat']),
    false
  );
});

test('BSL-3 accepts mask plus either kind of eye protection', () => {
  const base = ['gloves', 'gloves_2', 'mask'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, [...base, 'glasses']), true);
  assert.strictEqual(evaluateEquipmentRules(BSL3, [...base, 'face_shield']), true);
});

test('BSL-3 needs both pairs of gloves', () => {
  const oneGlove = ['gloves', 'closable_lab_coat', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, oneGlove), false);
});

test('sibling anyOf branches are alternatives, so a single one is enough', () => {
  const bodyOnly = ['gloves', 'gloves_2', 'disposable_overall'];
  const respiratorOnly = ['gloves', 'gloves_2', 'bsl3_respirator'];

  assert.strictEqual(evaluateEquipmentRules(BSL3, bodyOnly), true);
  assert.strictEqual(evaluateEquipmentRules(BSL3, respiratorOnly), true);

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

  assert.deepStrictEqual(
    { level_correct: graded.level_correct, equipment_correct: graded.equipment_correct },
    { level_correct: true, equipment_correct: true }
  );

  // routes/rounds.js splits this object into stored columns and derived fields, so a
  // key appearing here that nobody knows about is a silent gap.
  assert.deepStrictEqual(Object.keys(graded).sort(), [
    'equipment_correct',
    'equipment_slots',
    'equipment_wrong_count',
    'level_correct',
  ]);
});

test('the two verdicts are independent', () => {
  const graded = gradeAnswer(
    { chosen_level: 1, chosen_equipment: ['lab_coat', 'glasses'] },
    { bsl_level: 3 },
    BSL1
  );

  assert.deepStrictEqual(
    { level_correct: graded.level_correct, equipment_correct: graded.equipment_correct },
    { level_correct: false, equipment_correct: true }
  );
});

test('a level sent as a string still compares correctly', () => {
  const graded = gradeAnswer(
    { chosen_level: '2', chosen_equipment: [] },
    { bsl_level: 2 },
    BSL2
  );

  assert.strictEqual(graded.level_correct, true);
});

test('the breakdown names categories, breaks ties on the first branch, and can be unwinnable', () => {
  const missingMask = evaluateEquipmentSlots(BSL2, ['lab_coat', 'gloves']);

  assert.strictEqual(missingMask.wrongCount, 1);
  assert.deepStrictEqual(missingMask.slots.masks, {
    status: 'wrong',
    missing: ['mask'],
    extra: [],
  });
  assert.deepStrictEqual(missingMask.slots.body, { status: 'ok', missing: [], extra: [] });
  assert.deepStrictEqual(
    Object.keys(missingMask.slots).sort(),
    ['body', 'eyewear', 'footwear', 'gloves', 'masks']
  );

  const bothWorn = evaluateEquipmentSlots(
    { required: [], anyOf: ['mask', 'face_shield'], optional: [] },
    ['mask', 'face_shield']
  );

  assert.deepStrictEqual(bothWorn.slots.eyewear, {
    status: 'wrong',
    missing: [],
    extra: ['face_shield'],
  });

  const unwinnable = evaluateEquipmentSlots({ required: ['respirator'], anyOf: [] }, []);

  assert.strictEqual(unwinnable.wrongCount, 5);
});

test('gradeAnswer carries the breakdown the scoring formula needs', () => {
  const graded = gradeAnswer(
    { chosen_level: 2, chosen_equipment: ['lab_coat', 'gloves'] },
    { bsl_level: 2 },
    BSL2
  );

  assert.strictEqual(graded.equipment_wrong_count, 1);
  assert.strictEqual(graded.equipment_slots.masks.status, 'wrong');
  assert.strictEqual(graded.equipment_correct, false);
});
