import { test, expect } from '@playwright/test';
import { BACKEND_BASE } from './helpers/api';
import { getEquipmentRulesForBslLevel } from '../frontend/src/utils/equipmentRules';

test('every BSL level grades the same on the client and on the server', async ({ request }) => {
  const response = await request.get(`${BACKEND_BASE}/api/bsl-classes`);

  expect(response.ok()).toBeTruthy();

  const classes = await response.json();

  expect(classes.length).toBeGreaterThan(0);

  for (const bslClass of classes) {
    expect(
      getEquipmentRulesForBslLevel(bslClass.class_number),
      `BSL-${bslClass.class_number} differs between frontend/src/utils/equipmentRules.js and bsl_classes.required_equipment`
    ).toEqual(bslClass.required_equipment);
  }
});
