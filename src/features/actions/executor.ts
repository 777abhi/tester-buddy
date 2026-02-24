import { Page } from 'playwright';
import { ActionResult } from './types';
import { ActionParser } from './parser';

export class ActionExecutor {
  async performActions(page: Page, actionStrings: string[]): Promise<{ action: string, result?: ActionResult }[]> {
    const results: { action: string, result?: ActionResult }[] = [];

    for (const actionStr of actionStrings) {
      try {
        const action = ActionParser.parse(actionStr);
        const res = await action.execute(page);
        results.push({ action: actionStr, result: res });
      } catch (e: any) {
        console.error(`Error executing ${actionStr}:`, e);
        results.push({ action: actionStr, result: { success: false, error: String(e) } });
      }
    }
    return results;
  }

  async checkExpectations(page: Page, expectationStrings: string[]) {
    console.log('Verifying expectations...');
    for (const expStr of expectationStrings) {
      try {
        // Prepend 'expect:' because ActionParser expects 'expect:type:value'
        const fullActionStr = `expect:${expStr}`;
        const action = ActionParser.parse(fullActionStr);
        await action.execute(page);
      } catch (e) {
        console.error(`Error checking expectation ${expStr}:`, e);
      }
    }
  }
}
