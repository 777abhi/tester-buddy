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
        return new ClickAction(params);
      case 'fill':
        return this.parseFill(params);
      case 'wait':
        return new WaitAction(parseInt(params));
      case 'goto':
        return new GotoAction(params);
      case 'press':
        return new PressAction(params);
      case 'scroll':
        return new ScrollAction(params);
      case 'expect':
        return this.parseExpect(params);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private static parseFill(params: string): FillAction {
    // Current logic: Split by first colon.
    // This is consistent with existing ActionExecutor and CodeGenerator logic.
    // Known limitation: Cannot use colons in selector (e.g. pseudo-classes) without breaking value.
    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
      // Fallback: If no colon, treat entire params as selector and empty value? Or error?
      // CodeGenerator: split(':') -> length >= 2. So it requires value.
      // ActionExecutor: indexOf(':') -> -1 -> Error.
      throw new Error(`Invalid fill params: ${params}. Format: fill:selector:value`);
    }
    const selector = params.substring(0, firstColon);
    const value = params.substring(firstColon + 1);
    return new FillAction(selector, value);
  }

  private static parseExpect(params: string): ExpectAction {
    const firstColon = params.indexOf(':');
    if (firstColon === -1) {
        throw new Error(`Invalid expect params: ${params}. Format: expect:type:value`);
    }
    const type = params.substring(0, firstColon);
    const value = params.substring(firstColon + 1);
    return new ExpectAction(type, value);
  }
}
