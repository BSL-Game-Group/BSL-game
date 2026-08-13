import { test, expect } from './fixtures/gameFixture';

test.describe('Game Flow and Validation', () => {

  test('displays feedback on incorrect answer', async ({ game, page }) => {
    await game.start();
    await page.waitForLoadState('networkidle');

    // No microbe has been handed out, so BSL-2 cannot be the right room and the
    // verdict has to come out negative — asserting the exact wording, since a
    // regex matching both verdicts would pass no matter what the popup says.
    await game.openAnswerPopup();

    await expect(game.answerPopup).toBeVisible();
    await expect(game.answerPopup).toContainText(/not quite/i);
  });

  test('visiting the lecture room unlocks the BSL rooms', async ({ game, page }) => {
    await game.start();
    await page.waitForLoadState('networkidle');

    // Phaser's BSL interactables can't read React state, so App mirrors the
    // lecture visit onto window.__lectureOpen. Until it flips, every BSL room
    // answers a click with "visit the lecture first" instead of the answer popup.
    await expect(
      page.evaluate(() => (window as unknown as { __lectureOpen?: boolean }).__lectureOpen)
    ).resolves.toBe(false);

    await game.enterLectureRoom();

    await page.waitForFunction(
      () => (window as unknown as { __lectureOpen?: boolean }).__lectureOpen === true
    );
  });
});
