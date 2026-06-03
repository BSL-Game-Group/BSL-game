// // @ts-check
import { test, expect } from '@playwright/test';

test('frontend loads', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // UI check
  await expect(page.getByText('BSL-game frontend')).toBeVisible();
});

test('backend root endpoint works', async ({ request }) => {
  const response = await request.get('http://localhost:3001/');

  expect(response.ok()).toBeTruthy();

  const text = await response.text();

  expect(text).toContain('Backend is running');
});

test('backend API + database works', async ({ request }) => {
  const response = await request.get('http://localhost:3001/api/test');

  expect(response.ok()).toBeTruthy();

  const body = await response.json();

  expect(body.message).toBe('Database connection works');
  expect(body.time).toBeDefined();
});

test('clicking Start Game renders 800x600 canvas', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start Game' }).click();
  const canvas = page.locator('#game-container canvas');
  await expect(canvas).toBeVisible();
  const width = await canvas.evaluate(el => el.width);
  const height = await canvas.evaluate(el => el.height);
  expect(width).toBe(1280);
  expect(height).toBe(720);
});

test('game starts without JavaScript errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});