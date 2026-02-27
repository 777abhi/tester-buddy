import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { Buddy } from '../src/buddy';
import { REPL } from '../src/features/repl';

describe('REPL', () => {
  let buddy: Buddy;
  let repl: REPL;
  let consoleLogMock: any;
  let consoleErrorMock: any;

  beforeEach(() => {
    // Mock Buddy
    buddy = new Buddy();
    // Mock executeAction method on Buddy
    (buddy as any).executeAction = mock(async (action: string) => {
        if (action === 'click:#error') throw new Error('Failed to click');
        return { success: true };
    });
    (buddy as any).close = mock(async () => {});

    repl = new REPL(buddy);

    // Mock console
    consoleLogMock = mock();
    consoleErrorMock = mock();
    global.console.log = consoleLogMock;
    global.console.error = consoleErrorMock;
  });

  afterEach(() => {
    mock.restore();
  });

  it('should process a valid command', async () => {
    const input = ['click:#btn', 'exit'];

    // We need to simulate the rl.on('line') and rl.on('close') events properly.
    // The REPL.start() awaits a promise that resolves on 'close'.

    let lineCallback: (line: string) => void = () => {};
    let closeCallback: () => void = () => {};

    const rlMock = {
      close: mock(() => {
          closeCallback(); // Trigger close when called
      }),
      on: mock((event: string, callback: any) => {
         if (event === 'line') {
             lineCallback = callback;
         } else if (event === 'close') {
             closeCallback = callback;
         }
         return rlMock;
      }),
      prompt: mock(() => {
          // When prompt is called, we simulate input if we have any left
          if (input.length > 0) {
              const line = input.shift();
              // Execute async to allow the loop to proceed
              Promise.resolve().then(async () => {
                  if (line) await lineCallback(line);
              });
          }
      })
    };

    // Inject mock readline
    repl['createInterface'] = () => rlMock as any;

    await repl.start();

    expect((buddy as any).executeAction).toHaveBeenCalledWith('click:#btn');
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('✅ Success'));
  });

  it('should handle errors gracefully', async () => {
    const input = ['click:#error', 'exit'];

    let lineCallback: (line: string) => void = () => {};
    let closeCallback: () => void = () => {};

    const rlMock = {
      close: mock(() => {
          closeCallback();
      }),
      on: mock((event: string, callback: any) => {
         if (event === 'line') {
             lineCallback = callback;
         } else if (event === 'close') {
             closeCallback = callback;
         }
         return rlMock;
      }),
      prompt: mock(() => {
          if (input.length > 0) {
              const line = input.shift();
              Promise.resolve().then(async () => {
                  if (line) await lineCallback(line);
              });
          }
      })
    };

    repl['createInterface'] = () => rlMock as any;

    await repl.start();

    expect((buddy as any).executeAction).toHaveBeenCalledWith('click:#error');
    expect(consoleErrorMock).toHaveBeenCalledWith(expect.stringContaining('❌ Error'));
  });

  it('should handle help command', async () => {
    const input = ['help', 'exit'];

    let lineCallback: (line: string) => void = () => {};
    let closeCallback: () => void = () => {};

    const rlMock = {
      close: mock(() => {
          closeCallback();
      }),
      on: mock((event: string, callback: any) => {
         if (event === 'line') {
             lineCallback = callback;
         } else if (event === 'close') {
             closeCallback = callback;
         }
         return rlMock;
      }),
      prompt: mock(() => {
          if (input.length > 0) {
              const line = input.shift();
              Promise.resolve().then(async () => {
                  if (line) await lineCallback(line);
              });
          }
      })
    };

    repl['createInterface'] = () => rlMock as any;

    await repl.start();

    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Available commands:'));
    expect((buddy as any).executeAction).not.toHaveBeenCalled();
  });
});
