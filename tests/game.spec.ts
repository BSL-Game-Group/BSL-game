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
  await expect(game.lectureMaterialSources).toBeVisible();
});

test('lecture material popup closes via button', async ({ game }) => {
  await game.start();

  await game.openLectureMaterial();
  await expect(game.lectureMaterialPopup).toBeVisible();
  // The popup grows from its 320px loading size to 85vh when the material
  // lands, which moves the absolutely-positioned close button ~146px up. A
  // click issued before that happens is dispatched at the old coordinates and
  // lands on the text that has taken their place, leaving the popup open.
  await expect(game.lectureMaterialSources).toBeVisible();

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
