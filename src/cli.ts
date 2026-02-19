import { Command } from 'commander';
import { Buddy } from './buddy';
import { ConfigLoader } from './config';
import { generateMermaidGraph } from './features';

const program = new Command();
let buddy: Buddy | undefined;

program
  .name('tester-buddy')
  .description('A helper tool for manual exploratory testers')
  .version('1.0.0');

program
  .command('explore <url>')
  .description('Explore a web page and list interactive elements')
  .option('--json', 'Output in JSON format')
  .option('--screenshot', 'Save a screenshot')
  .option('--show-all', 'Show all elements even if many')
  .option('--do <action>', 'Action to perform: click:selector, fill:selector:value, wait:ms, goto:url, press:key, scroll:target. Can be repeated.', (value, previous) => previous.concat([value]), [] as string[])
  .option('--expect <criteria>', 'Expectation to verify: text:value, selector:value, url:value. Can be repeated.', (value, previous) => previous.concat([value]), [] as string[])
  .option('--session <path>', 'Path to session file (JSON) to save/load state')
  .option('--monitor-errors', 'Fail if console errors or network errors (4xx/5xx) occur')
  .action(async (url, options) => {
    try {
      const config = await ConfigLoader.load();
      buddy = new Buddy(config);
      const results = await buddy.explore(url, {
        json: options.json,
        screenshot: options.screenshot,
        showAll: options.showAll,
        actions: options.do,
        expectations: options.expect,
        session: options.session,
        monitorErrors: options.monitorErrors
      });

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`Current URL: ${results.url}`);
        console.log(`Page Title: ${results.title}\n`);

        // Markdown output similar to weblens.py
        const data = results.elements;
        if (data.length > 50 && !options.showAll) {
          console.log(`Found ${data.length} interactive elements. Summarizing main functional areas...\n`);
          const regions: { [key: string]: number } = {};
          data.forEach(item => {
            regions[item.region] = (regions[item.region] || 0) + 1;
          });
          console.log("| Functional Area | Interactive Elements Count |");
          console.log("|---|---|");
          Object.entries(regions).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
            console.log(`| ${region} | ${count} |`);
          });
        } else {
          // Sort alerts to top
          data.sort((a, b) => (b.isAlert ? 1 : 0) - (a.isAlert ? 1 : 0));

          console.log("| Tag | Text/Value | ID | Class | ARIA-label |");
          console.log("|---|---|---|---|---|");
          data.forEach(item => {
            let text = item.text.replace(/\s+/g, ' ');
            if (text.length > 40) text = text.substring(0, 37) + "...";
            let elClass = item.className;
            if (elClass.length > 30) elClass = elClass.substring(0, 27) + "...";
            let aria = item.ariaLabel;
            if (aria.length > 30) aria = aria.substring(0, 27) + "...";

            const alertPrefix = item.isAlert ? "🚨 " : "";
            console.log(`| ${item.tag} | ${alertPrefix}${text} | ${item.id} | ${elClass} | ${aria} |`);
          });
        }
      }
      await buddy.close();
    } catch (e) {
      console.error('Error:', e);
      await buddy?.close();
      process.exit(1);
    }
  });

program
  .command('crawl <url>')
  .description('Crawl a website and map its structure')
  .option('--depth <number>', 'Depth of crawl (default: 2)', parseInt, 2)
  .option('--json', 'Output in JSON format')
  .option('--visual', 'Output visual graph (Mermaid)')
  .action(async (url, options) => {
    try {
      const config = await ConfigLoader.load();
      buddy = new Buddy(config);
      const results = await buddy.crawl(url, options.depth);

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else if (options.visual) {
        const graph = generateMermaidGraph(results);
        console.log(graph);
      } else {
        console.log(`\nCrawling complete. Found ${results.length} pages.\n`);

        console.log("| Status | URL | Links Found | Error |");
        console.log("|---|---|---|---|");
        results.forEach(res => {
          let error = res.error ? res.error : "";
          if (error.length > 20) error = error.substring(0, 17) + "...";
          const statusIcon = res.status >= 200 && res.status < 300 ? "✅" : (res.status === 404 ? "❌" : "⚠️");
          console.log(`| ${statusIcon} ${res.status} | ${res.url} | ${res.links.length} | ${error} |`);
        });

        const brokenLinks = results.filter(r => r.status >= 400 || r.error);
        if (brokenLinks.length > 0) {
            console.log(`\n🚨 Found ${brokenLinks.length} broken links/errors!`);
        }
      }
      await buddy.close();
    } catch (e) {
      console.error('Error:', e);
      await buddy?.close();
      process.exit(1);
    }
  });

program
  .command('forms <url>')
  .description('Analyze forms on a page')
  .option('--json', 'Output in JSON format')
  .option('--session <path>', 'Path to session file (JSON) to save/load state')
  .action(async (url, options) => {
    try {
      const config = await ConfigLoader.load();
      buddy = new Buddy(config);
      const results = await buddy.analyzeForms(url, {
        json: options.json,
        session: options.session
      });

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        if (results.length === 0) {
          console.log("No forms or interactive inputs found.");
        } else {
          results.forEach(group => {
            console.log(`### ${group.name} (ID: ${group.id})`);
            console.log("| Label | Type | Name | ID | Required | Current Value |");
            console.log("|---|---|---|---|---|---|");
            group.inputs.forEach(item => {
              let label = item.label;
              if (label.length > 30) label = label.substring(0, 27) + "...";
              let val = item.value;
              if (val.length > 20) val = val.substring(0, 17) + "...";
              console.log(`| ${label} | ${item.type} | ${item.name} | ${item.id} | ${item.required} | ${val} |`);
            });
            console.log("\n");
          });
        }
      }
      await buddy.close();
    } catch (e) {
      console.error('Error:', e);
      await buddy?.close();
      process.exit(1);
    }
  });

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
        await buddy.seedData(options.seedItems);
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
