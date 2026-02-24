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
}
