// // @ts-check
import { test, expect } from '@playwright/test';

test('frontend loads', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await expect(page).toHaveTitle(/.*/);
  await expect(page.getByText('BSL-game frontend')).toBeVisible();
});

test('backend loads', async ({ page }) => {
  await page.goto('http://localhost:3001');

  await expect(page).toHaveTitle(/.*/);
  await expect(page.getByText('Backend is running')).toBeVisible();
})