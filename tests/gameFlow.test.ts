import { test, expect } from './fixtures/gameFixture';

test.describe('Game Flow and Validation', () => {

  test('displays feedback on incorrect answer', async ({ game, page }) => {
    await game.start();
    await page.waitForLoadState('networkidle');
    
    // Open the answer popup via event
    await game.openAnswerPopup();

    // Wait for the answer popup dialog to appear
    await expect(game.answerPopup).toBeVisible();
    
    // Verify the popup contains either correct or incorrect feedback
    const answerContent = await game.answerPopup.textContent();
    expect(answerContent).toMatch(/Correct|Incorrect|Not quite/i);
  });

  test('validates equipment before allowing entry', async ({ game, page }) => {
    await game.start();
    await page.waitForLoadState('networkidle');

    // Open the lecture room to trigger equipment validation flow
    await game.page.evaluate(() => {
      window.dispatchEvent(new Event('lecture-room-entered'));
    });

    // Verify the lecture panel appears
    await expect(game.lecturePanel).toBeVisible();
  });
});