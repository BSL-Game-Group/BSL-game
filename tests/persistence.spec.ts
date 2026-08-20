import { test, expect } from './fixtures/gameFixture';
import { FRONTEND_BASE } from './helpers/api';

const SAVED_GAME_KEY = 'bsl-game.saved-state.v1';

test.describe('reloading the page', () => {
  test('resumes the game instead of returning to the start screen', async ({ game, page }) => {
    await game.start();
    await game.waitForSceneReady();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /start game/i })).toHaveCount(0);
    await expect(game.canvas).toBeVisible();
  });

  test('keeps equipment worn across a reload', async ({ game, page }) => {
    await game.start();
    await game.openCloset();
    // The closet opens on the Eyewear tab, so switch to Body to reach the coat.
    await page.getByRole('button', { name: 'Body' }).click();
    await page.getByRole('button', { name: 'Lab coat', exact: true }).click();
    await game.waitForSceneReady();

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    console.log('DOM loaded after reload');

    await game.waitForSceneReady();

    console.log('Scene ready after reload');

    await game.openCloset();

    console.log('Closet opened');

    // Equipped items render on the character, not inside a tab, so the tab
    // resetting to Eyewear after the reload does not hide it.
    await expect(
      page.getByRole('button', { name: 'Lab coat', exact: true, pressed: true })
    ).toBeVisible();
  });

  // Guards the snapshot key round-trip: App has to write the popup under the
  // same key loadSavedGame() hands back, or the popup quietly fails to reopen.
  test('keeps the lecture material popup open across a reload', async ({ game, page }) => {
    await game.start();
    await game.openLectureMaterial();
    await expect(game.lectureMaterialPopup).toBeVisible();
    await game.waitForSceneReady();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(game.lectureMaterialPopup).toBeVisible();
  });

  // Cmd+R / Ctrl+R reloads the page, and Phaser reports the bare "R" regardless
  // of modifiers — so without a guard the reload shortcut also triggered the
  // dressing room's "R = wash up", stripping every piece of worn PPE.
  test('the Cmd+R / Ctrl+R reload shortcut does not strip worn gear', async ({ page }) => {
    await page.route('**/api/rooms/enter', (route) => route.abort('blockedbyclient'));
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          savedAt: Date.now(),
          sessionId: 'session_shortcut_test',
          player: { x: 300, y: 600 }, // standing in the dressing room
          equipped: {
            lab_coat: true, mask: true, closable_lab_coat: false,
            pressurized_suit: false, glasses: false, bsl3_respirator: false,
            sunglasses: false, disposable_overall: false, face_shield: false,
            wow_helmet: false, gloves: false, gloves_2: false,
          },
          microbe: null,
          progress: { lectureVisited: true, materialsUnlocked: false, awaitingUndress: false },
          popups: {
            closet: false, lectureMaterial: false, info: false, answer: false,
            answerLevel: '', lectureWarning: false, airlockWarning: false,
          },
        })
      );
    }, SAVED_GAME_KEY);

    await page.goto(FRONTEND_BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    for (const modifier of ['Meta', 'Control']) {
      await page.keyboard.down(modifier);
      await page.keyboard.press('r');
      await page.keyboard.up(modifier);
    }
    await page.waitForTimeout(500);

    const worn = await page.evaluate((key) => {
      const snap = JSON.parse(window.localStorage.getItem(key) as string);
      return Object.keys(snap.equipped).filter((k) => snap.equipped[k]);
    }, SAVED_GAME_KEY);

    expect(worn.sort()).toEqual(['lab_coat', 'mask']);
  });

  test('a stale saved game falls back to the start screen', async ({ page }) => {
    await page.route('**/api/rooms/enter', (route) => route.abort('blockedbyclient'));
    await page.goto(FRONTEND_BASE);
    await page.waitForLoadState('networkidle');

    // Age the snapshot past the two-hour limit without waiting for it.
    await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      const snapshot = raw ? JSON.parse(raw) : { version: 1, player: { x: 590, y: 150 } };
      snapshot.savedAt = Date.now() - 3 * 60 * 60 * 1000;
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    }, SAVED_GAME_KEY);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible();
  });
});
