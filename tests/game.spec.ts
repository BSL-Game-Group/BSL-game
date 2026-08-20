import { test, expect } from './fixtures/gameFixture';

test('game starts without crashing', async ({ game }) => {
  const errors: string[] = [];

  game.page.on('pageerror', (err) => errors.push(err.message));

  await game.start();

  await game.page.waitForLoadState('networkidle');

  expect(errors).toHaveLength(0);
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

test('lecture material popup opens via event and shows the fetched material', async ({ game }) => {
  await game.start();

  await game.openLectureMaterial();

  await expect(game.lectureMaterialPopup).toBeVisible();
  // The title renders while the material is still loading too, so assert on a
  // section that only exists once /api/bsl-material has answered.
  await expect(game.page.getByRole('heading', { name: /^sources$/i })).toBeVisible();
});

test('lecture material popup closes via button', async ({ game }) => {
  await game.start();

  await game.openLectureMaterial();
  await expect(game.lectureMaterialPopup).toBeVisible();

  await game.closeButton.click();

  await expect(game.lectureMaterialPopup).not.toBeVisible();
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
