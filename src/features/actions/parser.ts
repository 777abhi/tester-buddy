import { Action } from './interface';
import { ClickAction, FillAction, WaitAction, GotoAction, PressAction, ScrollAction, ExpectAction, LoopAction, ConditionAction } from './implementations';

export class ActionParser {
  static parse(actionString: string): Action {
    const firstColon = actionString.indexOf(':');
    if (firstColon === -1) {
      throw new Error(`Invalid action format: ${actionString}`);
    }

    const type = actionString.substring(0, firstColon);
    const params = actionString.substring(firstColon + 1);

    switch (type) {
      case 'click':
        return new ClickAction(this.unquote(params));
      case 'fill':
        return this.parseFill(params);
      case 'wait':
        return new WaitAction(parseInt(this.unquote(params)));
      case 'goto':
        return new GotoAction(this.unquote(params));
      case 'press':
        return new PressAction(this.unquote(params));
      case 'scroll':
        return new ScrollAction(this.unquote(params));
      case 'expect':
        return this.parseExpect(params);
      case 'loop':
        return this.parseLoop(params);
      case 'if':
        return this.parseCondition(params);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private static parseFill(params: string): FillAction {
    const [selector, valueRaw] = this.peelParam(params);
    if (!selector || !valueRaw) {
       throw new Error(`Invalid fill params: ${params}. Format: fill:selector:value`);
    }
    return new FillAction(selector, this.unquote(valueRaw));
  }

  private static parseExpect(params: string): ExpectAction {
    const [type, valueRaw] = this.peelParam(params);
    if (!type || !valueRaw) {
        throw new Error(`Invalid expect params: ${params}. Format: expect:type:value`);
    }
    return new ExpectAction(type, this.unquote(valueRaw));
  }

  private static parseLoop(params: string): LoopAction {
    const [countStr, actionStrRaw] = this.peelParam(params);
    const count = parseInt(countStr, 10);
    if (isNaN(count)) {
      throw new Error(`Invalid loop count: ${countStr}`);
    }
    if (!actionStrRaw) {
        throw new Error(`Invalid loop params: ${params}. Format: loop:count:action`);
    }
    const actionStr = this.unquote(actionStrRaw);
    const action = this.parse(actionStr);
    return new LoopAction(count, action);
  }

  private static parseCondition(params: string): ConditionAction {
    const [selector, actionStrRaw] = this.peelParam(params);
    if (!selector || !actionStrRaw) {
      throw new Error(`Invalid if params: ${params}. Format: if:selector:action`);
    }
    const actionStr = this.unquote(actionStrRaw);
    const action = this.parse(actionStr);
    return new ConditionAction(selector, action);
  }

  private static peelParam(params: string): [string, string] {
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
      // Return the whole string as the first param, empty string as remainder
      return [this.unquote(params), ''];
    }
    return [
      this.unquote(params.substring(0, firstColon)),
      params.substring(firstColon + 1)
    ];
  }

  private static unquote(str: string): string {
    if (str.length >= 2 && str.startsWith('"') && str.endsWith('"')) {
      try {
        return JSON.parse(str);
      } catch {
        // Fallback for simple cases if JSON parse fails
        return str.substring(1, str.length - 1).replace(/\\"/g, '"');
      }
    }
    return str;
  }

  private static findEndQuote(str: string, startIndex: number): number {
    let i = startIndex;
    while (i < str.length) {
      if (str[i] === '\\') {
        i += 2; // Skip escaped character
      } else if (str[i] === '"') {
        return i;
      } else {
        i++;
      }
    }
    return -1;
  }
}
