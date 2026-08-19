import { test, expect } from '@playwright/test';
import {
  evaluateEquipmentSlots as clientEvaluate,
  getEquipmentRulesForBslLevel,
} from '../frontend/src/utils/equipmentRules';
import { EQUIPMENT_CATEGORIES } from '../frontend/src/utils/equipmentCategories';

// grading.js is CommonJS (backend/package.json declares no "type"), so this is an interop
// import. If a Playwright version stops resolving it, swap to createRequire:
//   import { createRequire } from 'node:module';
//   const { evaluateEquipmentSlots: serverEvaluate } =
//     createRequire(import.meta.url)('../backend/services/grading');
import { evaluateEquipmentSlots as serverEvaluate } from '../backend/services/grading';

function idsMentionedBy(rule: unknown): string[] {
  if (typeof rule === 'string') { return [rule]; }
  if (Array.isArray(rule)) { return rule.flatMap(idsMentionedBy); }
  if (!rule || typeof rule !== 'object') { return []; }

  const node = rule as Record<string, unknown>;

  return ['required', 'anyOf', 'allOf', 'optional'].flatMap((key) =>
    node[key] === undefined ? [] : idsMentionedBy(node[key])
  );
}

function subsets(items: string[]): string[][] {
  return items.reduce<string[][]>(
    (acc, item) => [...acc, ...acc.map((subset) => [...subset, item])],
    [[]]
  );
}

const ALL_ITEMS = Object.keys(EQUIPMENT_CATEGORIES);

// Rule shapes the shipped table never produces, so the malformed-node and unknown-id
// branches are compared too.
const EDGE_SHAPES = [
  { required: [], anyOf: [], optional: [] },
  { required: ['respirator'], anyOf: [], optional: [] },
  { required: [], anyOf: [null], optional: [] },
  { required: [], anyOf: [{ unknownOperator: ['mask'] }], optional: [] },
  { required: [], anyOf: [['mask', 'face_shield']], optional: [] },
];
const EDGE_OUTFITS = [[], ['mask'], ['mask', 'face_shield'], ['sombrero']];

test('the client and the server agree on every slot verdict', () => {
  let compared = 0;
  const worn = new Set<string>();

  const check = (rules: unknown, outfit: string[], label: string) => {
    expect(
      serverEvaluate(rules, outfit),
      `${label} with [${outfit.join(', ')}] differs between ` +
        'frontend/src/utils/equipmentRules.js and backend/services/grading.js'
    ).toEqual(clientEvaluate(rules, outfit));
    outfit.forEach((item) => worn.add(item));
    compared += 1;
  };

  for (const level of [1, 2, 3, 4]) {
    const rules = getEquipmentRulesForBslLevel(level);
    const mentioned = [...new Set(idsMentionedBy(rules))];
    const unmentioned = ALL_ITEMS.filter((item) => !mentioned.includes(item));

    // Every subset of the gear this level names, each also worn with one item it does
    // not name. The extras matter: an item the rules never mention can still diverge,
    // and it can only do so as somebody's wrongly-categorised extra.
    for (const outfit of subsets(mentioned)) {
      check(rules, outfit, `BSL-${level}`);

      for (const extra of unmentioned) {
        check(rules, [...outfit, extra], `BSL-${level}`);
      }
    }
  }

  for (const rules of EDGE_SHAPES) {
    for (const outfit of EDGE_OUTFITS) {
      check(rules, outfit, JSON.stringify(rules));
    }
  }

  // The universe comes from the category map, so a new closet item enters this table
  // automatically — asserted rather than assumed, because an item no compared outfit
  // ever wears is an item whose category is free to diverge.
  expect(
    ALL_ITEMS.filter((item) => !worn.has(item)),
    'every closet item is worn by some compared outfit'
  ).toEqual([]);

  // Guards against the table silently emptying.
  expect(compared).toBeGreaterThan(1000);
});
