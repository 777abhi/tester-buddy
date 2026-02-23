import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { Page } from 'playwright';

export interface VisualResult {
  mismatch: number;
  diff: Buffer;
  width: number;
  height: number;
}

export class VisualMonitor {
  constructor() {}

  /**
   * Compares two image buffers and returns the mismatch count and diff image.
   * @param img1 Buffer of the first image (base)
   * @param img2 Buffer of the second image (current)
   * @param threshold Sensitivity threshold (0 to 1), default 0.1
   */
  compare(img1: Buffer, img2: Buffer, threshold: number = 0.1): VisualResult {
    const png1 = PNG.sync.read(img1);
    const png2 = PNG.sync.read(img2);

    const { width, height } = png1;

    if (png1.width !== png2.width || png1.height !== png2.height) {
        throw new Error(`Image dimensions do not match: ${png1.width}x${png1.height} vs ${png2.width}x${png2.height}`);
    }

    const diff = new PNG({ width, height });

    const mismatch = pixelmatch(
      png1.data,
      png2.data,
      diff.data,
      width,
      height,
      { threshold }
    );

    return {
      mismatch,
      diff: PNG.sync.write(diff),
      width,
      height
    };
  }

  /**
   * Captures a screenshot of the current page.
   * @param page Playwright Page object
   * @param options Screenshot options
   */
  async capture(page: Page, options: { fullPage?: boolean } = {}): Promise<Buffer> {
    return await page.screenshot({ fullPage: options.fullPage, type: 'png' });
  }
}
