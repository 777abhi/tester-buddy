import { Action } from './interface';
import { ClickAction, FillAction, WaitAction, GotoAction, PressAction, ScrollAction, ExpectAction } from './implementations';

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
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private static parseFill(params: string): FillAction {
    // If params starts with a quote, we attempt to parse a quoted selector
    if (params.startsWith('"')) {
      const endQuote = this.findEndQuote(params, 1);
      if (endQuote !== -1) {
        // Check if the character after the quote is the delimiter
        if (params[endQuote + 1] === ':') {
          const selector = this.unquote(params.substring(0, endQuote + 1));
          const value = this.unquote(params.substring(endQuote + 2));
          return new FillAction(selector, value);
        }
      }
    }

    // Fallback: Split by first colon (legacy behavior)
    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
      throw new Error(`Invalid fill params: ${params}. Format: fill:selector:value`);
    }
    const selector = this.unquote(params.substring(0, firstColon));
    const value = this.unquote(params.substring(firstColon + 1));
    return new FillAction(selector, value);
  }

  private static parseExpect(params: string): ExpectAction {
    // Expectation format: expect:type:value
    // We assume 'type' doesn't contain colons, so we split on first colon.
    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
        throw new Error(`Invalid expect params: ${params}. Format: expect:type:value`);
    }
    const type = this.unquote(params.substring(0, firstColon));
    const value = this.unquote(params.substring(firstColon + 1));
    return new ExpectAction(type, value);
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
