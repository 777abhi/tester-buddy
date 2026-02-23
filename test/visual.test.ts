import { describe, it, expect, beforeAll } from 'bun:test';
import { VisualMonitor } from '../src/features/visual';
import { PNG } from 'pngjs';

describe('VisualMonitor', () => {
  let monitor: VisualMonitor;

  beforeAll(() => {
    monitor = new VisualMonitor();
  });

  it('should be defined', () => {
    expect(monitor).toBeDefined();
  });

  it('should compare identical images and return 0 mismatch', () => {
    const width = 10;
    const height = 10;
    const img1 = new PNG({ width, height });
    const img2 = new PNG({ width, height });

    // Fill with black
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        img1.data[idx] = 0;
        img1.data[idx + 1] = 0;
        img1.data[idx + 2] = 0;
        img1.data[idx + 3] = 255;

        img2.data[idx] = 0;
        img2.data[idx + 1] = 0;
        img2.data[idx + 2] = 0;
        img2.data[idx + 3] = 255;
      }
    }

    const buf1 = PNG.sync.write(img1);
    const buf2 = PNG.sync.write(img2);

    const result = monitor.compare(buf1, buf2);
    expect(result.mismatch).toBe(0);
    expect(result.diff).toBeDefined();
  });

  it('should detect differences', () => {
    const width = 10;
    const height = 10;
    const img1 = new PNG({ width, height });
    const img2 = new PNG({ width, height });

    // Fill img1 with black, img2 with white
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        img1.data[idx] = 0; img1.data[idx + 1] = 0; img1.data[idx + 2] = 0; img1.data[idx + 3] = 255;
        img2.data[idx] = 255; img2.data[idx + 1] = 255; img2.data[idx + 2] = 255; img2.data[idx + 3] = 255;
      }
    }

    const buf1 = PNG.sync.write(img1);
    const buf2 = PNG.sync.write(img2);

    const result = monitor.compare(buf1, buf2);
    expect(result.mismatch).toBeGreaterThan(0);
  });
});
