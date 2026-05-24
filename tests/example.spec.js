// @ts-check
import { test, expect } from '@playwright/test';

test('frontend loads and shows hello world', async ({ page }) => {
  await page.goto('http://bsl-frontend-route-bsl-game-ohtu-k2026.apps.okd-cs-test-0.k8s.cs.helsinki.fi');

  // Check page loads
  await expect(page).toHaveTitle(/.*/);

  // Check actual app content
  await expect(page.getByText('Hello world')).toBeVisible();
});
