import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import budgets from './performance-budgets.json' with { type: 'json' };

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:3000';
const outPath = path.resolve('tests/reports/performance/runtime-metrics.json');

async function measureRoute(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });

  const metrics = await page.evaluate(async () => {
    const nav = performance.getEntriesByType('navigation')[0];

    const fps = await new Promise(resolve => {
      let frames = 0;
      const start = performance.now();
      const run = () => {
        frames += 1;
        const elapsed = performance.now() - start;
        if (elapsed < 1200) {
          requestAnimationFrame(run);
        } else {
          resolve((frames / elapsed) * 1000);
        }
      };
      requestAnimationFrame(run);
    });

    const usedJSHeapSize = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return {
      domCompleteMs: nav ? nav.domComplete : null,
      fps,
      usedJSHeapSize
    };
  });

  return {
    route,
    fps: Number(metrics.fps.toFixed(2)),
    memoryMb: Number((metrics.usedJSHeapSize / (1024 * 1024)).toFixed(2)),
    domCompleteMs: metrics.domCompleteMs
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];
  for (const route of budgets.routes) {
    results.push(await measureRoute(page, route));
  }

  await browser.close();

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), routes: results }, null, 2));

  const failures = [];
  for (const result of results) {
    if (result.fps < budgets.runtime.minFps) {
      failures.push(`${result.route} FPS ${result.fps} < ${budgets.runtime.minFps}`);
    }
    if (result.memoryMb > budgets.runtime.maxMemoryMb) {
      failures.push(`${result.route} memory ${result.memoryMb}MB > ${budgets.runtime.maxMemoryMb}MB`);
    }
  }

  if (failures.length) {
    throw new Error(`Runtime budget regression:\n${failures.join('\n')}`);
  }

  console.log(`Runtime metrics written to ${outPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
