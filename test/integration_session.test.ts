import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Buddy } from '../src/buddy';
import { ConfigLoader } from '../src/config';
import { existsSync, unlinkSync, readFileSync } from 'fs';

const SESSION_FILE = 'integration-session.json';
const PORT = 3005; // Use a different port
const URL = `http://localhost:${PORT}/`;

describe('Session Integration', () => {
    let server: any;

    beforeEach(() => {
        server = Bun.serve({
            port: PORT,
            fetch(req) {
                return new Response(`
                  <html>
                    <body>
                      <h1>Integration Test</h1>
                      <button id="btn">Click Me</button>
                      <input id="inp" type="text" />
                    </body>
                  </html>
                `, { headers: { 'Content-Type': 'text/html' } });
            }
        });
    });

    afterEach(() => {
        server.stop();
        if (existsSync(SESSION_FILE)) unlinkSync(SESSION_FILE);
    });

    it('should record actions in session file', async () => {
        const config = await ConfigLoader.load();
        const buddy = new Buddy(config);

        // Run 1: Navigate
        await buddy.explore(URL, { session: SESSION_FILE });

        let content = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
        expect(content.history.find((h: any) => h.action === `goto:${URL}`)).toBeTruthy();

        // Run 2: Actions
        await buddy.explore(URL, {
            session: SESSION_FILE,
            actions: ['click:#btn', 'fill:#inp:hello']
        });

        content = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
        expect(content.history.find((h: any) => h.action === 'click:#btn')).toBeTruthy();
        expect(content.history.find((h: any) => h.action === 'fill:#inp:hello')).toBeTruthy();

        await buddy.close();
    }, 30000); // 30s timeout
});
