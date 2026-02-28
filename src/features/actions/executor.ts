import { Page } from 'playwright';
import { ActionResult } from './types';
import { ActionParser } from './parser';
import { Healer } from './healer';

export class ActionExecutor {
  private healer = new Healer();

  async performActions(page: Page, actionStrings: string[]): Promise<{ action: string, result?: ActionResult }[]> {
    const results: { action: string, result?: ActionResult }[] = [];

    for (const actionStr of actionStrings) {
      try {
        const action = ActionParser.parse(actionStr);
        const res = await action.execute(page);

        if (!res.success && this.isHealable(actionStr)) {
           const healedRes = await this.tryHeal(page, actionStr);
           if (healedRes) {
             results.push(healedRes);
             continue;
           }
        }

        results.push({ action: actionStr, result: res });
      } catch (e: any) {
        if (this.isHealable(actionStr)) {
           const healedRes = await this.tryHeal(page, actionStr);
           if (healedRes) {
             results.push(healedRes);
             continue;
           }
        }

        console.error(`Error executing ${actionStr}:`, e);
        results.push({ action: actionStr, result: { success: false, error: String(e) } });
      }
    }
    return results;
  }

  private isHealable(actionStr: string): boolean {
    return actionStr.startsWith('click:') || actionStr.startsWith('fill:');
  }

  private async tryHeal(page: Page, actionStr: string): Promise<{ action: string, result?: ActionResult } | null> {
    const firstColon = actionStr.indexOf(':');
    if (firstColon === -1) return null;

    const type = actionStr.substring(0, firstColon);
    const params = actionStr.substring(firstColon + 1);

    // Extract the selector based on action type. We only support click and fill for healing.
    let failedSelector = '';
    let remainder = '';

    if (type === 'click') {
        failedSelector = this.unquote(params);
    } else if (type === 'fill') {
        // Find the next colon
        const [selector, value] = this.peelParam(params);
        failedSelector = selector;
        remainder = value;
    }

    if (!failedSelector) return null;

    console.log(`Action failed: ${actionStr}. Attempting to heal...`);
    const healedSelector = await this.healer.heal(page, failedSelector);

    if (healedSelector) {
        console.log(`Healing successful! New selector: ${healedSelector}`);

        // Reconstruct the action string
        let healedActionStr = '';
        if (type === 'click') {
            healedActionStr = `click:"${healedSelector.replace(/"/g, '\\"')}"`;
        } else if (type === 'fill') {
            healedActionStr = `fill:"${healedSelector.replace(/"/g, '\\"')}":${remainder}`;
        }

        try {
            const newAction = ActionParser.parse(healedActionStr);
            const res = await newAction.execute(page);
            return { action: healedActionStr, result: res };
        } catch (e) {
            console.warn(`Execution of healed action failed: ${healedActionStr}`, e);
            return null;
        }
    }

    console.log(`Healing failed for: ${actionStr}`);
    return null;
  }

  private peelParam(params: string): [string, string] {
    if (params.startsWith('"')) {
      const endQuote = this.findEndQuote(params, 1);
      if (endQuote !== -1) {
        if (params[endQuote + 1] === ':') {
          return [
            this.unquote(params.substring(0, endQuote + 1)),
            params.substring(endQuote + 2)
          ];
        }
      }
    }

    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
      return [this.unquote(params), ''];
    }
    return [
      this.unquote(params.substring(0, firstColon)),
      params.substring(firstColon + 1)
    ];
  }

  private unquote(str: string): string {
    if (str.length >= 2 && str.startsWith('"') && str.endsWith('"')) {
      try {
        return JSON.parse(str);
      } catch {
        return str.substring(1, str.length - 1).replace(/\\"/g, '"');
      }
    }
    return str;
  }

  private findEndQuote(str: string, startIndex: number): number {
    let i = startIndex;
    while (i < str.length) {
      if (str[i] === '\\') {
        i += 2;
      } else if (str[i] === '"') {
        return i;
      } else {
        i++;
      }
    }
    return -1;
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
