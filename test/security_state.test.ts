import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { StateManager } from '../src/features/state';
import { ConfigLoader } from '../src/config';
import { BrowserContext, Page } from 'playwright';

describe('StateManager Security', () => {
  let stateManager: StateManager;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = { roles: {} };
    stateManager = new StateManager(mockConfig);
    // Mock ConfigLoader.save to do nothing
    spyOn(ConfigLoader, 'save').mockImplementation(async () => {});
  });

  it('should handle malicious localStorage data gracefully', async () => {
    const maliciousData = JSON.stringify({
      "__proto__": { "polluted": "yes" },
      "validKey": "validValue",
      "numberKey": 123
    });

    const mockContext = {
      cookies: async () => []
    } as unknown as BrowserContext;

    const mockPage = {
      evaluate: async (fn: any) => {
        if (typeof fn === 'function' && fn.toString().includes('localStorage')) {
          return maliciousData;
        }
        return null;
      }
    } as unknown as Page;

    // We want to ensure that capturedRole.localStorage only contains string values
    // and doesn't have dangerous keys like __proto__

    await stateManager.dumpState(mockContext, mockPage, 'test-role');

    const capturedRole = mockConfig.roles['test-role'];
    expect(capturedRole).toBeDefined();

    const storage = capturedRole.localStorage;

    // Check for pollution
    expect(storage.__proto__).toBe(Object.prototype);
    expect(storage.polluted).toBeUndefined();

    // Check for string values only
    expect(typeof storage.validKey).toBe('string');
    // This currently FAILS to be a string (it's a number), demonstrating lack of validation
    expect(typeof storage.numberKey).toBe('string');
  });
});
