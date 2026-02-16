import { Page } from 'playwright';

export interface ActionStrategy {
  execute(page: Page, params: string): Promise<void>;
  matches(actionType: string): boolean;
}

export interface ExpectationStrategy {
  verify(page: Page, value: string): Promise<boolean>;
  matches(expectationType: string): boolean;
}
