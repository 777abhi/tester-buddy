import { describe, it, expect, mock } from 'bun:test';
import { Healer } from '../src/features/actions/healer';
import { Page } from 'playwright';

describe('Healer', () => {
  it('should heal a failed button selector by finding matching text', async () => {
    const mockPage = {
      evaluate: mock(async (fn: any) => {
        // Mock the evaluate call to simulate finding an element with text "Submit"
        return 'text="Submit"';
      })
    } as unknown as Page;

    const healer = new Healer();
    const healedSelector = await healer.heal(mockPage, '#btn-submit');

    expect(mockPage.evaluate).toHaveBeenCalled();
    expect(healedSelector).toBe('text="Submit"');
  });

  it('should heal a failed input selector by finding matching name attribute', async () => {
    const mockPage = {
      evaluate: mock(async (fn: any) => {
        // Mock the evaluate call to simulate finding an input with name "username"
        return 'input[name="username"]';
      })
    } as unknown as Page;

    const healer = new Healer();
    const healedSelector = await healer.heal(mockPage, '#user_name_input');

    expect(healedSelector).toBe('input[name="username"]');
  });

  it('should return null if it cannot heal the selector', async () => {
     const mockPage = {
      evaluate: mock(async (fn: any) => {
        return null;
      })
    } as unknown as Page;

    const healer = new Healer();
    const healedSelector = await healer.heal(mockPage, '#unknown-element');

    expect(healedSelector).toBeNull();
  });
});
