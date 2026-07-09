import { test, expect } from './fixtures/gameFixture';

test('game starts without crashing', async ({ game }) => {
  const errors: string[] = [];

  game.page.on('pageerror', (err) => errors.push(err.message));

  await game.start();

  await game.page.waitForLoadState('networkidle');

  expect(errors).toHaveLength(0);
});

test('lecture room shows UI panel', async ({ game }) => {
  await game.start();

  // simulate entering lecture room
  await game.page.evaluate(() => {
    window.dispatchEvent(new Event('lecture-room-entered'));
  });

  await expect(game.lecturePanel).toBeVisible();
});

test('closet opens via event', async ({ game }) => {
  await game.start();

  await game.openCloset();

  await expect(game.closetPopup).toBeVisible();
});

test('closet closes via button', async ({ game }) => {
  await game.start();

  await game.openCloset();
  await game.closeCloset();

  await expect(game.closetPopup).not.toBeVisible();
});

test('entering the lecture room shows the task in the lecture panel', async ({ game }) => {
  await game.start();
  await game.page.evaluate(() => {
    window.dispatchEvent(new Event('lecture-room-entered'));
  });
  await expect(game.lecturePanel).toContainText('The microbe you will handle');

  const LiElements = await game.page
    .getByText('The microbe you will handle')
    .locator('..')
    .locator('ul > li')
    .all();
  for (const microbeInfo of LiElements) {
    await expect(microbeInfo).not.toBeEmpty();
  }
});

test('info popup opens via event and shows the instructions', async ({ game }) => {
  await game.start();

  await game.page.evaluate(() => {
    window.dispatchEvent(new Event('info-popup-opened'));
  });

  await expect(
    game.page.getByRole('heading', { name: /how to play/i })
  ).toBeVisible();
});
