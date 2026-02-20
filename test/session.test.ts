import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { SessionManager, ActionRecord } from '../src/features/session';
import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import { BrowserContext } from 'playwright';

const TEST_SESSION_FILE = 'test-session.json';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    if (existsSync(TEST_SESSION_FILE)) {
      unlinkSync(TEST_SESSION_FILE);
    }
  });

  it('should load legacy Playwright state correctly', async () => {
    const legacyState = {
      cookies: [{ name: 'test', value: '123', domain: 'example.com', path: '/' }],
      origins: []
    };
    writeFileSync(TEST_SESSION_FILE, JSON.stringify(legacyState));

    const session = await sessionManager.loadSession(TEST_SESSION_FILE);
    expect(session.cookies).toEqual(legacyState.cookies);
    expect(session.history).toEqual([]);
  });

  it('should load new session format with history', async () => {
    const history: ActionRecord[] = [
      { action: 'goto:https://example.com', timestamp: 123 },
      { action: 'click:#btn', timestamp: 124 }
    ];
    const newState = {
      cookies: [{ name: 'test', value: '123', domain: 'example.com', path: '/' }],
      origins: [],
      history
    };
    writeFileSync(TEST_SESSION_FILE, JSON.stringify(newState));

    const session = await sessionManager.loadSession(TEST_SESSION_FILE);
    expect(session.cookies).toEqual(newState.cookies);
    expect(session.history).toEqual(newState.history);
  });

  it('should save session with history', async () => {
    const state = {
      cookies: [{ name: 'test', value: '123', domain: 'example.com', path: '/' }],
      origins: []
    };
    const history: ActionRecord[] = [{ action: 'goto:https://example.com', timestamp: 123 }];

    // Mock BrowserContext
    const mockContext = {
      storageState: async () => state
    } as unknown as BrowserContext;

    await sessionManager.saveSession(TEST_SESSION_FILE, mockContext, history);

    const content = JSON.parse(readFileSync(TEST_SESSION_FILE, 'utf-8'));
    expect(content.cookies).toEqual(state.cookies);
    expect(content.history).toEqual(history);
  });

  it('should handle missing file gracefully', async () => {
    const session = await sessionManager.loadSession('non-existent.json');
    expect(session.cookies).toEqual([]);
    expect(session.origins).toEqual([]);
    expect(session.history).toEqual([]);
  });
});
