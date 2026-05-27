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