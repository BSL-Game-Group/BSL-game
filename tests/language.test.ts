import { FRONTEND_BASE } from './helpers/api';
import { test, expect } from './fixtures/gameFixture';

test.describe('Language Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_BASE);
    await page.waitForLoadState('networkidle');
  });

  test('switches language and updates UI labels', async ({ page }) => {
    // 1. Start button in English
    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible();

    // 2. Switch to Swedish (SV)
    await page.getByRole('button', { name: /SV/i }).click();
    await page.waitForTimeout(500);
    // In Swedish: "Starta spelet"
    await expect(page.getByRole('button', { name: /starta spelet/i })).toBeVisible();

    // 3. Switch to Finnish (FI)
    await page.getByRole('button', { name: /FI/i }).click();
    await page.waitForTimeout(500);
    // In Finnish: "Aloita peli"
    await expect(page.getByRole('button', { name: /aloita peli/i })).toBeVisible();

    // 4. Switch back to English (EN)
    await page.getByRole('button', { name: /EN/i }).click();
    await page.waitForTimeout(500);
    // Back to English: "Start Game"
    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible();
  });
});