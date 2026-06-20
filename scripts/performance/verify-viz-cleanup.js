import { chromium } from 'playwright';

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:3000';
const ROUTES = [
  '/journey/chapter/ch1',
  '/journey/chapter/ch14',
  '/journey/chapter/ch13',
  '/journey/chapter/ch14',
  '/journey/chapter/ch12',
];
const TRACKED_WINDOW_EVENTS = ['mousemove', 'pointermove', 'wheel'];

function getChapterId(route) {
  const match = route.match(/\/journey\/chapter\/(ch\d+)$/);
  if (!match) {
    throw new Error(`Route ${route} does not contain a chapter id.`);
  }
  return match[1];
}

async function waitForScene(page, route) {
  const expectedChapterId = getChapterId(route);
  const chapterLocator = page.locator(`.chapter-experience[data-chapter-id="${expectedChapterId}"]`);
  await chapterLocator.waitFor({ state: 'visible', timeout: 15_000 });
  await chapterLocator.locator('.scene-host__mount[data-state="ready"]')
    .waitFor({ state: 'visible', timeout: 15_000 });

  const result = await page.evaluate(({ expectedRoute, expectedChapterId }) => {
    const chapter = document.querySelector(`.chapter-experience[data-chapter-id="${expectedChapterId}"]`);
    const canvasCount = chapter?.querySelectorAll('.scene-host canvas').length || 0;
    const totalCanvasCount = document.querySelectorAll('.scene-host canvas').length;
    const mountState = chapter?.querySelector('.scene-host__mount')?.getAttribute('data-state') || null;
    const fallbackVisible = Boolean(chapter?.querySelector('.scene-host__fallback'));
    const reduced = chapter?.getAttribute('data-reduced-motion') || null;
    return {
      route: window.location.pathname,
      expectedRoute,
      expectedChapterId,
      canvasCount,
      totalCanvasCount,
      mountState,
      fallbackVisible,
      reduced,
    };
  }, { expectedRoute: route, expectedChapterId });

  if (result.route !== route) {
    throw new Error(`Expected route ${route} but browser is at ${result.route}`);
  }

  if (result.reduced === 'true') {
    throw new Error(`Expected animated scene on ${route}, but reduced-motion fallback is active.`);
  }

  if (result.mountState !== 'ready') {
    throw new Error(`Expected ready scene mount on ${route}, found ${result.mountState}.`);
  }

  if (result.fallbackVisible) {
    throw new Error(`Expected no fallback scene on ${route} during cleanup verification.`);
  }

  if (result.canvasCount !== 1) {
    throw new Error(`Expected exactly one scoped canvas on ${route}, found ${result.canvasCount}.`);
  }

  if (result.totalCanvasCount !== 1) {
    throw new Error(`Expected exactly one active canvas after ${route}, found ${result.totalCanvasCount}.`);
  }

  return result;
}

async function routeTo(page, route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  return waitForScene(page, route);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    const trackedEvents = new Set(['mousemove', 'pointermove', 'wheel']);
    window.__aionCleanupProbe = {
      webglContextsCreated: 0,
      webglContextsLost: 0,
      windowEventAdds: {},
      windowEventRemovals: {},
    };

    EventTarget.prototype.addEventListener = function patchedAddEventListener(type, listener, options) {
      if (this === window && trackedEvents.has(type)) {
        window.__aionCleanupProbe.windowEventAdds[type] =
          (window.__aionCleanupProbe.windowEventAdds[type] || 0) + 1;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function patchedRemoveEventListener(type, listener, options) {
      if (this === window && trackedEvents.has(type)) {
        window.__aionCleanupProbe.windowEventRemovals[type] =
          (window.__aionCleanupProbe.windowEventRemovals[type] || 0) + 1;
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };

    HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...args) {
      const context = originalGetContext.call(this, type, ...args);
      if (!context || !String(type).startsWith('webgl') || context.__aionCleanupPatched) {
        return context;
      }

      context.__aionCleanupPatched = true;
      window.__aionCleanupProbe.webglContextsCreated += 1;

      const originalGetExtension = context.getExtension.bind(context);
      context.getExtension = function patchedGetExtension(name) {
        const extension = originalGetExtension(name);
        if (name === 'WEBGL_lose_context' && extension && !extension.__aionCleanupPatched) {
          extension.__aionCleanupPatched = true;
          const originalLoseContext = extension.loseContext.bind(extension);
          extension.loseContext = function patchedLoseContext(...loseArgs) {
            window.__aionCleanupProbe.webglContextsLost += 1;
            return originalLoseContext(...loseArgs);
          };
        }
        return extension;
      };

      return context;
    };
  });

  await page.goto(`${BASE_URL}${ROUTES[0]}`, { waitUntil: 'domcontentloaded' });
  const snapshots = [await waitForScene(page, ROUTES[0])];

  for (const route of ROUTES.slice(1)) {
    snapshots.push(await routeTo(page, route));
  }

  const result = await page.evaluate(() => ({
    ...window.__aionCleanupProbe,
    canvasCount: document.querySelectorAll('.scene-host canvas').length,
  }));

  await browser.close();

  if (result.webglContextsCreated < 2) {
    throw new Error(`Expected multiple WebGL contexts during route cycling, saw ${result.webglContextsCreated}.`);
  }

  if (result.webglContextsLost < ROUTES.length - 1) {
    throw new Error(`Expected context loss on route cleanup. Lost ${result.webglContextsLost} of ${ROUTES.length - 1} transitions.`);
  }

  if (result.canvasCount > 1) {
    throw new Error(`Expected no more than one canvas after route cycling, found ${result.canvasCount}.`);
  }

  for (const eventType of TRACKED_WINDOW_EVENTS) {
    const additions = result.windowEventAdds[eventType] || 0;
    const removals = result.windowEventRemovals[eventType] || 0;
    const activeListeners = additions - removals;
    if (activeListeners > 1) {
      throw new Error(
        `Expected at most one active ${eventType} listener after route cycling, ` +
        `found ${activeListeners} (${additions} added, ${removals} removed).`
      );
    }
  }

  console.log('Visualization cleanup verification passed:', {
    routes: snapshots.map((snapshot) => snapshot.route),
    chapters: snapshots.map((snapshot) => snapshot.expectedChapterId),
    ...result,
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
