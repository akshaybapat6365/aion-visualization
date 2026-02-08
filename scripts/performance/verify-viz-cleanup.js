import { chromium } from 'playwright';

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    window.__AION_VIZ_MAP__ = {
      'chapter-2': {
        path: '/src/visualizations/testing/MockViz.js',
        className: 'MockViz'
      }
    };

    const module = await import('/src/core/simple-viz-loader.js');

    const container = document.createElement('div');
    document.body.appendChild(container);

    module.setupVisualizationIntent('chapter-2', container);

    const trigger = container.querySelector('.viz-intent-trigger');
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 50));

    document.dispatchEvent(new CustomEvent('aion:routeChange', {
      detail: {
        route: { path: '/chapter3.html' },
        previousRoute: { path: '/chapter2.html' }
      }
    }));

    return {
      lifecycle: window.__aionVizLifecycle,
      disposeCalls: window.__mockVizDisposeCalls || 0,
      listenerRemovals: window.__mockListenerRemovals || 0
    };
  });

  await browser.close();

  if (!result.lifecycle || result.lifecycle.disposeCalls < 1) {
    throw new Error('Expected visualization dispose() to be called on route change.');
  }

  if (result.listenerRemovals < 1) {
    throw new Error('Expected listener cleanup to run on route change.');
  }

  if (result.lifecycle.routeCleanupCalls < 1) {
    throw new Error('Expected route cleanup lifecycle counter to increment.');
  }

  console.log('Visualization cleanup verification passed:', result);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
