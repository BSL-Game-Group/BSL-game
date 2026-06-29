import { test, expect } from './fixtures/gameFixture';

test('frontend loads main screen', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await expect(page.getByText('BSL-game')).toBeVisible();
});

test('game canvas appears after start', async ({ game }) => {
  await game.start();

  await expect(game.canvas).toBeVisible();
});