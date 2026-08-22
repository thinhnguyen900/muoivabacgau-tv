import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs/promises';

const url = process.env.V11_URL || 'http://127.0.0.1:4173';
await fs.mkdir('evidence', { recursive: true });

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => window.__BACGAU_V11__?.ready === true, null, { timeout: 20000 });
  const state = await page.evaluate(() => ({
    ready: document.querySelector('.app')?.dataset.appReady,
    stage: document.querySelector('#stage')?.getBoundingClientRect().toJSON(),
    v11: window.__BACGAU_V11__,
    canvas: (() => {
      const c = document.querySelector('canvas');
      return c ? { width: c.width, height: c.height } : null;
    })(),
  }));
  if (state.ready !== 'true' || state.stage.width < 500 || state.stage.height < 400) {
    throw new Error(`${engine.name()} layout gate failed ${JSON.stringify(state)}`);
  }
  if (!state.v11?.model) {
    throw new Error(`${engine.name()} V11 is not reviewable: rigged GLB did not load ${JSON.stringify(state.v11)}`);
  }
  if (!state.canvas || state.canvas.width < 800 || state.canvas.height < 500) {
    throw new Error(`${engine.name()} WebGL canvas gate failed ${JSON.stringify(state.canvas)}`);
  }
  if (errors.length) throw new Error(`${engine.name()} errors: ${errors.join(' | ')}`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `evidence/${engine.name()}-v11.png`, fullPage: true });
  await browser.close();
  console.log(engine.name(), 'PASS', JSON.stringify(state.v11));
}
