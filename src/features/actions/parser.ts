import { Action } from './interface';
import { ClickAction, FillAction, WaitAction, GotoAction, PressAction, ScrollAction, ExpectAction, LoopAction, ConditionAction, RetryAction } from './implementations';

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
      case 'retry':
        return this.parseRetry(params);
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

  private static parseRetry(params: string): RetryAction {
    const [countStr, remainder] = this.peelParam(params);
    const count = parseInt(countStr, 10);
    if (isNaN(count)) {
      throw new Error(`Invalid retry count: ${countStr}`);
    }
    if (!remainder) {
        throw new Error(`Invalid retry params: ${params}. Format: retry:count:[interval:]action:[fallback_action]`);
    }

    // Try parsing the next parameter as an interval
    const [potentialIntervalStr, actionStrRaw] = this.peelParam(remainder);

    let interval = 500;
    let actionStrToParse = remainder;

    // Check if the potential interval is a valid number and there's an action string following it
    if (actionStrRaw && /^\d+$/.test(potentialIntervalStr)) {
      interval = parseInt(potentialIntervalStr, 10);
      actionStrToParse = actionStrRaw;
    }

    // Now actionStrToParse contains the main action, and potentially a fallback action.
    // We can use the same logic as peeling params, but based on action types.
    // A simpler approach is to try parsing actions until we consume the string.

    // Let's implement a more robust split by finding the next valid action boundary.
    // Actually, we can use a simpler approach. If we assume the fallback action starts with a known action keyword,
    // we could scan for it. But nested actions make it hard.

    // Let's rethink peelAction. An action is fundamentally a tree.
    // But since our action strings are flat, separated by colons:
    // `retry:count:interval:action_type:param1:...:fallback_type:param1:...`

    // Since we don't know where the first action ends and the fallback action begins without parsing,
    // let's create an `extractActionAndRest` method.
    const [action, fallbackStr] = this.extractActionAndRest(actionStrToParse);

    let fallbackAction: Action | undefined = undefined;
    if (fallbackStr) {
      // The rest is the fallback action
      fallbackAction = this.parse(this.unquote(fallbackStr));
    }

    return new RetryAction(count, interval, action, fallbackAction);
  }

  private static extractActionAndRest(params: string): [Action, string] {
    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
      throw new Error(`Invalid action format: ${params}`);
    }

    const type = params.substring(0, firstColon);
    const remaining = params.substring(firstColon + 1);

    switch (type) {
      case 'click':
      case 'wait':
      case 'goto':
      case 'press':
      case 'scroll': {
        const [param, rest] = this.peelRawParam(remaining);
        const actionStr = `${type}:${param}`;
        return [this.parse(actionStr), rest];
      }
      case 'fill':
      case 'expect':
      case 'if': {
        const [param1, rest1] = this.peelRawParam(remaining);
        const [param2, rest2] = this.peelRawParam(rest1);
        const actionStr = `${type}:${param1}:${param2}`;
        return [this.parse(actionStr), rest2];
      }
      case 'loop': {
        const [countStr, rest1] = this.peelRawParam(remaining);
        const [innerAction, rest2] = this.extractActionAndRest(rest1);
        // innerAction is already parsed, we can just create the LoopAction directly
        const count = parseInt(this.unquote(countStr), 10);
        return [new LoopAction(count, innerAction), rest2];
      }
      case 'retry': {
        const [countStr, rest1] = this.peelRawParam(remaining);
        const [potentialIntervalStr, rest2] = this.peelRawParam(rest1);

        let intervalStr = '';
        let restAfterInterval = rest1;

        if (rest2 && /^\d+$/.test(this.unquote(potentialIntervalStr))) {
           intervalStr = potentialIntervalStr;
           restAfterInterval = rest2;
        }

        const [innerAction, rest3] = this.extractActionAndRest(restAfterInterval);

        // This won't easily support nested fallbacks inside retry.
        // For now, let's keep it simple and just reconstruct the string for parse
        // Actually, creating the action directly is better.
        const count = parseInt(this.unquote(countStr), 10);
        const interval = intervalStr ? parseInt(this.unquote(intervalStr), 10) : 500;

        // Let's assume retry inside retry doesn't have a fallback, or if it does, it consumes it.
        // It's ambiguous: retry:3:click:#btn:click:#fallback. Is fallback for inner or outer?
        // It's always for the innermost retry that supports it.
        // Let's just consume the fallback if present for the inner retry.
        // To be safe, let's just let ActionParser parse the reconstructed string if possible,
        // or just return the constructed action.
        return [new RetryAction(count, interval, innerAction), rest3]; // Nested fallbacks not supported in this simple extraction
      }
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  // Like peelParam but returns the raw string with quotes intact, so it can be reassembled
  private static peelRawParam(params: string): [string, string] {
    if (!params) return ['', ''];
    if (params.startsWith('"')) {
      const endQuote = this.findEndQuote(params, 1);
      if (endQuote !== -1) {
        if (params.length === endQuote + 1) {
          return [params, ''];
        }
        if (params[endQuote + 1] === ':') {
          return [
            params.substring(0, endQuote + 1),
            params.substring(endQuote + 2)
          ];
        }
      }
    }

    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
      return [params, ''];
    }
    return [
      params.substring(0, firstColon),
      params.substring(firstColon + 1)
    ];
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
