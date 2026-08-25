import { test as base, expect, Page } from '@playwright/test';
import { FRONTEND_BASE } from '../helpers/api';

class Game {
  constructor(public page: Page) {}

// fixtures/gameFixture.ts
  async start() {
    // Mock the room entry API to prevent network errors during tests
    await this.page.route('**/api/rooms/enter', (route) => {
      route.abort('blockedbyclient');
    });

    await this.page.goto(FRONTEND_BASE);
    await this.page.getByRole('button', { name: /start game/i }).click();
    
    // The canvas only exists once <Game/> has mounted, which means React has
    // finished the commit that attaches App's window listeners.
    await this.canvas.waitFor({ state: 'visible' });
  }

  // Phaser's create() runs after its async asset preload, and setting the session
  // id is the last thing it does — so this is the signal that the scene is fully
  // up. Reloading mid-preload can wedge WebKit with an internal navigation error.
  async waitForSceneReady() {
    await this.canvas.waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      () => Boolean((window as unknown as { __gameData?: { sessionId?: string } }).__gameData?.sessionId)
    );
  }

  async openAnswerPopup() {
    await this.page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('answer-popup-opened', { detail: { level: 'BSL-2' } }));
    });
  }

  // --- UI getters (centralized selectors) ---
  get canvas() {
    return this.page.locator('#game-container canvas');
  }

  // The popups are plain overlay divs (no role="dialog"), so they're located by
  // their heading — the same way the specs have always found the closet.
  get infoPopup() {
    return this.page.getByRole('heading', { name: /how to play/i });
  }

  get lectureMaterialPopup() {
    return this.page.getByRole('heading', {
      name: /BSL Game Material \(Biosafety Levels\)/i,
    });
  }

  // Only rendered once /api/bsl-material has answered — the popup's title is
  // already on screen during the loading state, so it can't stand in for this.
  get lectureMaterialSources() {
    return this.page.getByRole('heading', { name: /^sources$/i });
  }

  get closetPopup() {
    return this.page.getByRole('heading', { level: 2, name: /closet/i });
  }

  get closeButton() {
    return this.page.getByRole('button', { name: /close/i });
  }
  
  get answerPopup() {
    return this.page.locator('.popup-overlay').first();
  }

  // --- high-level actions ---

  // One-shot, not addInitScript: an init script would re-run on reload and wipe
  // the very snapshot the persistence tests are checking.
  async clearSavedGame() {
    await this.page.evaluate(() => {
      window.localStorage.removeItem('bsl-game.saved-state.v1');
    });
  }

  async openCloset() {
    await this.page.evaluate(() => {
      window.dispatchEvent(new Event('closet-popup-opened'));
    });
  }

  async enterLectureRoom() {
    await this.page.evaluate(() => {
      window.dispatchEvent(new Event('lecture-room-entered'));
    });
  }

  // The same event the lecture room's material point dispatches on click
  // (rooms.js, setupLectureMaterialButton).
  async openLectureMaterial() {
    await this.page.evaluate(() => {
      window.dispatchEvent(new Event('lecture-material-popup-opened'));
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