import { Page } from 'playwright';
import { BuddyConfig } from '../config';

export class NetworkManager {
  constructor(private config: BuddyConfig) {}

  async applyMocks(page: Page) {
    if (!this.config.mocks || this.config.mocks.length === 0) {
      return;
    }

    console.log(`Applying ${this.config.mocks.length} network mocks...`);

    for (const mockConfig of this.config.mocks) {
      await page.route(mockConfig.urlPattern, async (route) => {
        const request = route.request();
        if (mockConfig.method && request.method() !== mockConfig.method.toUpperCase()) {
          // Method mismatch, continue to next handler or network
          await route.continue();
          return;
        }

        console.log(`Mocking request: ${request.method()} ${request.url()}`);

        let body = mockConfig.response.body;
        if (typeof body !== 'string') {
          body = JSON.stringify(body);
        }

        await route.fulfill({
          status: mockConfig.response.status,
          contentType: mockConfig.response.contentType,
          body: body,
        });
      });
    }
  }
}
