import { Page } from 'playwright';
import { ActionStrategy, ExpectationStrategy } from './types';
import { ClickAction, FillAction, WaitAction, GotoAction, PressAction, ScrollAction, TextExpectation, SelectorExpectation, UrlExpectation } from './strategies';

export class ActionExecutor {
  private actions: ActionStrategy[] = [
    new ClickAction(),
    new FillAction(),
    new WaitAction(),
    new GotoAction(),
    new PressAction(),
    new ScrollAction()
  ];

  private expectations: ExpectationStrategy[] = [
    new TextExpectation(),
    new SelectorExpectation(),
    new UrlExpectation()
  ];

  async performActions(page: Page, actionStrings: string[]) {
    for (const actionStr of actionStrings) {
      const firstColon = actionStr.indexOf(':');
      let actionType = actionStr;
      let params = '';
      
      if (firstColon !== -1) {
        actionType = actionStr.substring(0, firstColon);
        params = actionStr.substring(firstColon + 1);
      }

      const strategy = this.actions.find(s => s.matches(actionType));
      if (strategy) {
        try {
          await strategy.execute(page, params);
        } catch (e) {
          console.error(`Error executing ${actionStr}:`, e);
        }
      } else {
        console.warn(`Unknown action type: ${actionType}`);
      }
    }
  }

  async checkExpectations(page: Page, expectationStrings: string[]) {
    console.log('Verifying expectations...');
    for (const expStr of expectationStrings) {
      const firstColon = expStr.indexOf(':');
      let type = expStr;
      let value = '';

      if (firstColon !== -1) {
        type = expStr.substring(0, firstColon);
        value = expStr.substring(firstColon + 1);
      }

      const strategy = this.expectations.find(e => e.matches(type));
      if (strategy) {
        try {
          const result = await strategy.verify(page, value);
          if (!result) {
            process.exitCode = 1;
          }
        } catch (e) {
          console.error(`Error checking expectation ${expStr}:`, e);
        }
      } else {
        console.warn(`Unknown expectation type: ${type}`);
      }
    }
  }
}
