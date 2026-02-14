
import { chromium } from 'playwright';
import path from 'path';

async function generateScreenshots() {
  console.log('Generating screenshots...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Interactive Session Example
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('https://example.com');

  // Add some visual flair to make it look like "Tester Buddy" context if possible,
  // but for now, just the page is fine.
  // Maybe we can inject a "console" overlay to simulate the "audit" output?
  // Let's try to inject a fake overlay.
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.bottom = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = 'rgba(0,0,0,0.8)';
    div.style.color = '#0f0';
    div.style.padding = '10px';
    div.style.fontFamily = 'monospace';
    div.style.zIndex = '9999';
    div.innerHTML = '> Buddy Session Active<br>> Audit complete. No violations found.<br>> Ready for commands...';
    document.body.appendChild(div);
  });

  await page.screenshot({ path: path.join(__dirname, '../docs/images/session_example.png') });
  console.log('Saved docs/images/session_example.png');

  await browser.close();
}

generateScreenshots().catch(console.error);
