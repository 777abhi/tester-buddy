import { Page, ConsoleMessage, Request, Response } from 'playwright';
import { FormAnalyzer, FormResult } from './forms';

export interface FuzzResult {
  formId: string;
  payloadType: string;
  payload: string;
  status: 'success' | 'error' | 'crash';
  error?: string;
  executionTime: number;
}

const FUZZ_PAYLOADS = {
  'SQL Injection': "' OR '1'='1",
  'XSS': "<script>alert('XSS')</script>",
  'Buffer Overflow': "A".repeat(10000),
  'Format String': "%s%s%s%s%s",
  'Integer Overflow': "999999999999999999999",
  'Boundary Zero': "0",
  'Boundary Negative': "-1"
};

export class Fuzzer {
  private formAnalyzer: FormAnalyzer;

  constructor() {
    this.formAnalyzer = new FormAnalyzer();
  }

  async fuzz(page: Page, options: { timeout?: number } = {}): Promise<FuzzResult[]> {
    const timeout = options.timeout || 2000;
    const results: FuzzResult[] = [];

    // Capture initial state to reset between iterations
    const initialUrl = page.url();
    const initialForms = await this.formAnalyzer.analyze(page);

    if (initialForms.length === 0) {
      console.log('No forms found to fuzz.');
      return [];
    }

    console.log(`Found ${initialForms.length} forms. Starting fuzzing...`);

    for (const form of initialForms) {
      // Skip standalone inputs for now, focus on actual forms
      if (form.type === 'standalone') continue;

      for (const [payloadType, payload] of Object.entries(FUZZ_PAYLOADS)) {
        // We use console.log to provide feedback during the potentially long process
        console.log(`Fuzzing form ${form.id} with ${payloadType}...`);

        // Reset state: Navigate back if URL changed, or reload to clear inputs
        try {
          if (page.url() !== initialUrl) {
            await page.goto(initialUrl, { waitUntil: 'domcontentloaded' });
          } else {
            await page.reload({ waitUntil: 'domcontentloaded' });
          }
        } catch (e) {
          console.warn(`Failed to reset page state for ${payloadType}. Attempting to proceed...`, e);
        }

        const start = Date.now();
        let status: FuzzResult['status'] = 'success';
        let errorMsg: string | undefined;

        try {
          // Identify form locator
          let formLocator;
          if (typeof form.index === 'number') {
            formLocator = page.locator('form').nth(form.index);
          } else if (form.id && !form.id.startsWith('form-')) {
            formLocator = page.locator(`#${form.id}`);
          } else {
             if (form.name) {
                 formLocator = page.locator(`form[name="${form.name}"]`);
             } else {
                 continue;
             }
          }

          if (await formLocator.count() === 0) {
            console.warn(`Form ${form.id} not found on page. Skipping.`);
            continue;
          }

          // Fill inputs
          let filledCount = 0;
          for (const input of form.inputs) {
            if (input.type === 'submit' || input.tag === 'button' || input.type === 'hidden') continue;

            let inputLocator = formLocator.locator(`[name="${input.name}"]`);
            if (input.id) {
                 inputLocator = page.locator(`#${input.id}`);
            }

            if (await inputLocator.count() > 0 && await inputLocator.isVisible()) {
                 try {
                     await inputLocator.fill(payload);
                     filledCount++;
                 } catch (e) {
                     // ignore fill errors (e.g. readonly)
                 }
            }
          }

          if (filledCount === 0) {
              console.warn(`Could not fill any inputs for form ${form.id} with ${payloadType}.`);
          }

          // Find submit button
          const submitBtn = form.inputs.find(i => i.type === 'submit' || i.tag === 'button');
          if (submitBtn) {
             let submitLocator;
             if (submitBtn.id) {
                 submitLocator = page.locator(`#${submitBtn.id}`);
             } else if (submitBtn.name) {
                 submitLocator = formLocator.locator(`[name="${submitBtn.name}"]`);
             } else {
                 submitLocator = formLocator.locator('[type="submit"], button');
             }

             if (await submitLocator.count() > 0 && await submitLocator.isVisible()) {
                 const btn = submitLocator.first();

                 // Setup error listener with cleanup
                 const errorPromise = new Promise<string | null>(resolve => {
                     let timeoutId: NodeJS.Timeout;

                     const cleanup = () => {
                         page.off('console', handleConsole);
                         page.off('requestfailed', handleRequestFailed);
                         page.off('response', handleResponse);
                         clearTimeout(timeoutId);
                     };

                     const handleConsole = (msg: ConsoleMessage) => {
                         if (msg.type() === 'error') {
                             cleanup();
                             resolve(msg.text());
                         }
                     };
                     const handleRequestFailed = (req: Request) => {
                         if (req.failure()) {
                             cleanup();
                             resolve(req.failure()?.errorText || 'Network Fail');
                         }
                     };
                     const handleResponse = (res: Response) => {
                         if (res.status() >= 500) {
                             cleanup();
                             resolve(`Server Error ${res.status()}`);
                         }
                     };

                     page.on('console', handleConsole);
                     page.on('requestfailed', handleRequestFailed);
                     page.on('response', handleResponse);

                     timeoutId = setTimeout(() => {
                         cleanup();
                         resolve(null);
                     }, timeout);
                 });

                 await btn.click({ timeout });

                 try {
                     await page.waitForLoadState('networkidle', { timeout });
                 } catch (e) {
                     // Timeout expected
                 }

                 const detectedError = await errorPromise;
                 if (detectedError) {
                     status = 'error';
                     errorMsg = detectedError;
                 }
             }
          }

        } catch (e: any) {
          status = 'crash';
          errorMsg = e.message;
        }

        results.push({
          formId: form.id,
          payloadType,
          payload,
          status,
          error: errorMsg,
          executionTime: Date.now() - start
        });
      }
    }

    return results;
  }
}
