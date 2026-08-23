import { test, expect } from './fixtures/gameFixture';

const SAVED_GAME_KEY = 'bsl-game.saved-state.v1';

const snap = (page) =>
  page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, SAVED_GAME_KEY);

// The microbe is fetched after the scene is created, so a snapshot read any earlier
// reports microbe: null and makes every later comparison look like a change.
const waitForMicrobe = (page) =>
  page.waitForFunction(
    (key) => typeof JSON.parse(window.localStorage.getItem(key) || '{}')?.microbe?.id === 'number',
    SAVED_GAME_KEY,
    { timeout: 15000 }
  );

// Reloading is the case the jest suite cannot cover: main_scene re-emits
// current-microbe-updated with the RESTORED microbe on every create, which is
// indistinguishable from a new one being handed out unless the reset lives on
// the request instead of the event.
test('a reload mid-retry keeps the same microbe and the spent attempt', async ({ game, page }) => {
  await game.start();
  await game.waitForSceneReady();
  await waitForMicrobe(page);

  const before = await snap(page);
  const wrongLevel = before.microbe.bsl_level === 1 ? 3 : 1;

  await page.evaluate((level) => {
    window.dispatchEvent(new CustomEvent('answer-popup-opened', { detail: { level: `BSL-${level}` } }));
  }, wrongLevel);

  await page.getByRole('button', { name: /try again/i }).click();

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await game.waitForSceneReady();

  const restored = await snap(page);

  expect(restored.progress.attempt, 'the spent attempt survives the reload').toBe(2);
  expect(restored.progress.retryPending, 'the redo is still owed').toBe(true);
  expect(restored.microbe.id).toBe(before.microbe.id);

  await page.evaluate(() => window.dispatchEvent(new Event('quick-undress')));

  await expect
    .poll(async () => (await snap(page)).progress.retryPending)
    .toBe(false);

  const washed = await snap(page);

  expect(washed.microbe.id, 'washing up mid-retry must NOT hand out a new microbe').toBe(
    before.microbe.id
  );
});
