import { Page } from 'playwright';
import { ActionResult } from './types';

export interface Action {
  execute(page: Page): Promise<ActionResult>;
  toCode(semanticLocator?: string): string;
}
