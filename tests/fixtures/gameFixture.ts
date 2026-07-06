import { test as base, expect, Page } from '@playwright/test';
import { FRONTEND_BASE } from '../helpers/api';

class Game {
  constructor(public page: Page) {}

  async start() {
    // Mock the room entry API to prevent network errors during tests
    await this.page.route('**/api/rooms/enter', (route) => {
      route.abort('blockedbyclient');
    });

    await this.page.goto(FRONTEND_BASE);
    await this.page.getByRole('button', { name: /start game/i }).click();
  }

  // --- UI getters (centralized selectors) ---

  get canvas() {
    return this.page.locator('#game-container canvas');
  }

  get lecturePanel() {
    return this.page.getByTestId('lecture-panel');
  }

  get closetPopup() {
    return this.page.getByText(/equipment/i);
  }

  get closeButton() {
    return this.page.getByRole('button', { name: /close/i });
  }

  // --- high-level actions ---

  async openCloset() {
    await this.page.evaluate(() => {
      window.dispatchEvent(new Event('closet-popup-opened'));
    });
  }

  async closeCloset() {
    await this.closeButton.click();
  }
}

// Extend Playwright test with fixture
export const test = base.extend<{
  game: Game;
}>({
  game: async ({ page }, use) => {
    const game = new Game(page);
    await use(game);
  },
});

export { expect };