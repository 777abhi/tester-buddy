import { Page } from 'playwright';

export interface ActionResult {
  success: boolean;
  semanticLocator?: string;
  error?: string;
}

export interface ActionStrategy {
  execute(page: Page, params: string): Promise<ActionResult>;
  matches(actionType: string): boolean;
}

export interface ExpectationStrategy {
  verify(page: Page, value: string): Promise<boolean>;
  matches(expectationType: string): boolean;
}
