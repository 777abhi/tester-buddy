import * as readline from 'readline';
import { Buddy } from '../buddy';

export class REPL {
  constructor(private buddy: Buddy) {}

  private createInterface() {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'scout> '
    });
  }

  async start() {
    console.log('Starting Scout REPL...');
    console.log('Type "help" for commands, "exit" to quit.');

    const rl = this.createInterface();

    rl.prompt();

    return new Promise<void>((resolve) => {
      rl.on('line', async (line) => {
        const input = line.trim();

        if (input === 'exit') {
          rl.close();
          return;
        }

        if (input === 'help') {
          this.showHelp();
          rl.prompt();
          return;
        }

        if (input === '') {
          rl.prompt();
          return;
        }

        try {
          const result = await this.buddy.executeAction(input);
          if (result.success) {
            console.log('✅ Success');
            if (result.semanticLocator) {
              console.log(`   Semantic Locator: ${result.semanticLocator}`);
            }
          } else {
            console.error(`❌ Error: ${result.error}`);
          }
        } catch (e: any) {
          console.error(`❌ Error: ${e.message}`);
        }

        rl.prompt();
      }).on('close', () => {
        console.log('Exiting REPL.');
        resolve();
      });
    });
  }

  private showHelp() {
    console.log(`
Available commands:
  click:<selector>       Click an element
  fill:<selector>:<val>  Fill an input
  press:<key>            Press a key
  scroll:<target>        Scroll to element or 'top'/'bottom'
  wait:<ms>              Wait for X milliseconds
  goto:<url>             Navigate to URL
  expect:<type>:<val>    Verify state (text/selector/url)
  exit                   Exit the REPL
`);
  }
}
