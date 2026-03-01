import { ActionRecord } from './session';
import { ActionParser } from './actions/parser';

export class CodeGenerator {
  static generate(history: ActionRecord[]): string {
    const lines: string[] = [
      "import { test, expect } from '@playwright/test';",
      "",
      "test('generated test', async ({ page }) => {",
    ];

    // Remove consecutive duplicate gotos to the same URL
    const cleanHistory: ActionRecord[] = [];
    let lastGoto: string | null = null;

    for (const record of history) {
      if (record.action.startsWith('goto:')) {
        const url = record.action.substring(5);
        if (url === lastGoto) {
          continue;
        }
        lastGoto = url;
      } else {
        lastGoto = null;
      }
      cleanHistory.push(record);
    }

    for (const record of cleanHistory) {
      try {
        const actionObj = ActionParser.parse(record.action);
        const code = actionObj.toCode(record.semantic);
        lines.push(`  ${code}`);
      } catch (e: any) {
        lines.push(`  // Warning: Failed to generate code for '${record.action}': ${e.message}`);
      }
    }

    lines.push("});");
    return lines.join('\n');
  }

  static generatePrompt(history: ActionRecord[]): string {
    const lines: string[] = [
      "Please generate a comprehensive Playwright test suite for the following sequence of actions.",
      "The test should use semantic locators where possible and include standard imports and test blocks.",
      "",
      "Actions History:"
    ];

    for (const record of history) {
      lines.push(`- Action: ${record.action}`);
      if (record.semantic) {
        lines.push(`  Semantic Locator: ${record.semantic}`);
      }
    }

    lines.push("");
    lines.push("Ensure the code follows best practices for Playwright testing.");
    return lines.join('\n');
  }
}
