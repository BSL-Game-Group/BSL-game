// // @ts-check
import { test, expect } from '@playwright/test';

test('frontend loads', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // UI check
  await expect(page.getByText('BSL-game')).toBeVisible();
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

test('MainScene is active after starting the game', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForFunction(() => !!window.__phaserGame);
  const isSet = await page.evaluate(() => !!window.__phaserGame);
  expect(isSet).toBe(true);
});

test('lecture room zone has correct position and size', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForFunction(() => !!window.__gameData?.lectureRoomZone);
  const zone = await page.evaluate(() => window.__gameData.lectureRoomZone);
  expect(zone).toEqual({ x: 30, y: 30, width: 280, height: 250 });
});

test('PPE room zone has correct position and size', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForFunction(() => !!window.__gameData?.ppeRoomZone);
  const zone = await page.evaluate(() => window.__gameData.ppeRoomZone);
  expect(zone).toEqual({ x: 30, y: 440, width: 280, height: 250 });
});

test('BSL room zones have correct positions and sizes', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Start Game' }).click();
  await page.waitForFunction(() => !!window.__gameData?.bslRoomZones);
  const zones = await page.evaluate(() => window.__gameData.bslRoomZones);
  expect(zones).toHaveLength(4);
  expect(zones[0]).toEqual({ key: 'BSL-1', x: 330, y: 500, width: 200, height: 150 });
  expect(zones[1]).toEqual({ key: 'BSL-2', x: 550, y: 500, width: 200, height: 150 });
  expect(zones[2]).toEqual({ key: 'BSL-3', x: 770, y: 500, width: 200, height: 150 });
  expect(zones[3]).toEqual({ key: 'BSL-4', x: 990, y: 500, width: 200, height: 150 });
});