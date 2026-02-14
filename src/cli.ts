import { Command } from 'commander';
import { Buddy } from './buddy';
import { ConfigLoader } from './config';

const program = new Command();
let buddy: Buddy | undefined;

program
  .name('tester-buddy')
  .description('A helper tool for manual exploratory testers')
  .version('1.0.0');

program
  .option('--open', 'Launch the interactive browser session')
  .option('--url <url>', 'Start session at a specific URL')
  .option('--role <role>', 'Inject a specific user role (e.g., admin, customer)')
  .option('--seed-items <count>', 'Seed a specific number of items', parseInt)
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load();
      buddy = new Buddy(config);

      if (options.open) {
        await buddy.launchInteractive(options.url);
      }

      if (options.role) {
        if (!options.open) {
          console.error('Error: --role requires --open to be used.');
          process.exit(1);
        }
        await buddy.injectState(options.role);
        if (options.open) {
          if (options.url) {
            await buddy.navigate(options.url);
          } else {
            // Fallback if no URL provided (unlikely given validation, but safe)
            await buddy.reload();
          }
        }
      }

      if (options.seedItems) {
        // Mock endpoint
        await buddy.seedData('https://api.example.com/items', { count: options.seedItems });
      }

      // If open, we want to keep the process alive until user closes it or we can provide a command to run audit.
      if (options.open) {
        console.log('Press Ctrl+C to exit and save trace.');
        console.log('Type "audit" to run a quick audit.');
        console.log('Type "dump [role-name]" to save current state (default: captured-session).');

        // Listen to stdin for commands like "audit"
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', async (text) => {
          const input = text.toString().trim();
          if (input === 'audit') {
            await buddy?.quickAudit();
          } else if (input.startsWith('dump')) {
            const parts = input.split(' ');
            const roleName = parts.length > 1 ? parts[1] : undefined;
            await buddy?.dumpState(roleName);
          } else if (input === 'exit') {
            await cleanup();
            process.exit(0);
          }
        });

        // Prevent the process from exiting immediately
        await new Promise(() => { });
      } else {
        if (!options.seedItems) {
          console.log('No action specified. Use --help for options.');
        }
      }

    } catch (error) {
      console.error('An error occurred:', error);
      await cleanup();
      process.exit(1);
    }
  });

let isClosing = false;
async function cleanup() {
  if (isClosing) return;
  isClosing = true;
  console.log('\nClosing Tester Buddy...');
  if (buddy) {
    await buddy.close();
  }
}

// Handle exit signals
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

program.parse();
