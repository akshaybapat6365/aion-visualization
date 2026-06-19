import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

const distDir = path.resolve('dist');
const basePath = normalizeBase(process.env.PAGES_BASE || '/aion-visualization');
const port = Number(process.env.PAGES_ARTIFACT_SMOKE_PORT || 4188);
const baseUrl = `http://127.0.0.1:${port}${basePath}`;

const canonicalRoutes = [
  '/',
  '/chapters',
  '/atlas',
  '/timeline',
  '/symbols',
  '/about',
  ...Array.from({ length: 14 }, (_, index) => `/journey/chapter/ch${index + 1}`),
];

const mobileRoutes = ['/', '/chapters', '/atlas', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch5', '/journey/chapter/ch6', '/journey/chapter/ch8', '/journey/chapter/ch9', '/journey/chapter/ch10', '/journey/chapter/ch11', '/journey/chapter/ch12', '/journey/chapter/ch13', '/journey/chapter/ch14'];

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
]);

function normalizeBase(value) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (trimmed && !/^[A-Za-z0-9._~/-]+$/.test(trimmed)) {
    throw new Error(`Invalid Pages base path: ${value}`);
  }
  return trimmed ? `/${trimmed}` : '';
}

async function resolveArtifactFile(requestUrl) {
  let routePath = decodeURIComponent(requestUrl.split('?')[0]);
  if (!routePath.startsWith(basePath)) return null;

  routePath = routePath.slice(basePath.length) || '/';
  const segments = routePath.split('/').filter(Boolean);
  let filePath = path.join(distDir, ...segments);
  const initialStat = await stat(filePath).catch(() => null);

  if (initialStat?.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!initialStat && !path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  const finalStat = await stat(filePath).catch(() => null);
  return finalStat?.isFile() ? filePath : null;
}

function createArtifactServer() {
  return http.createServer(async (request, response) => {
    const filePath = await resolveArtifactFile(request.url || '/');
    if (!filePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes.get(path.extname(filePath)) || 'application/octet-stream',
    });
    response.end(await readFile(filePath));
  });
}

async function countCanvasPixels(canvas) {
  return canvas.evaluate((element) => new Promise((resolve) => {
    requestAnimationFrame(() => {
      const gl = element.getContext('webgl2')
        || element.getContext('webgl')
        || element.getContext('experimental-webgl');

      if (!gl) {
        resolve(0);
        return;
      }

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const pixel = new Uint8Array(4);
      let visiblePixels = 0;

      for (let y = 0; y < 24; y += 1) {
        for (let x = 0; x < 24; x += 1) {
          const px = Math.max(0, Math.min(width - 1, Math.round((x / 23) * (width - 1))));
          const py = Math.max(0, Math.min(height - 1, Math.round((y / 23) * (height - 1))));
          gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          if (pixel[3] > 0 && pixel[0] + pixel[1] + pixel[2] > 18) visiblePixels += 1;
        }
      }

      resolve(visiblePixels);
    });
  }));
}

function watchRouteFailures(page) {
  const consoleErrors = [];
  const notFound = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  page.on('response', (response) => {
    if (response.status() === 404 && !response.url().endsWith('/favicon.ico')) {
      notFound.push(response.url());
    }
  });

  return { consoleErrors, notFound };
}

async function checkShellRoute(page, route, failures) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (response?.status() !== 200) failures.push(`${route} returned ${response?.status()}`);

  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 15_000 });

  const navVisible = await page.locator('header[aria-label="Global navigation"]').isVisible();
  const primaryVisible = await page.locator('nav[aria-label="Primary"]').isVisible();
  const jumpVisible = await page.locator('#chapter-jump-select').isVisible();

  if (!navVisible) failures.push(`missing global navigation: ${route}`);
  if (!primaryVisible) failures.push(`missing primary navigation: ${route}`);
  if (!jumpVisible) failures.push(`missing chapter jump: ${route}`);
}

async function checkChapterCanvas(page, route, failures) {
  const canvas = page.locator('.scene-host canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(700);
  const pixels = await countCanvasPixels(canvas);
  if (pixels <= 8) failures.push(`blank or near-blank chapter canvas: ${route} (${pixels} sampled pixels)`);
}

async function runSmoke() {
  const server = createArtifactServer();
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const failures = [];
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const desktopFailures = watchRouteFailures(desktop);

    for (const route of canonicalRoutes) {
      await checkShellRoute(desktop, route, failures);
      if (route.startsWith('/journey/chapter/')) {
        await checkChapterCanvas(desktop, route, failures);
      }
    }

    const legacyChapter = await desktop.goto(`${baseUrl}/chapters/chapter-7.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    if (legacyChapter?.status() !== 200) failures.push(`legacy chapter returned ${legacyChapter?.status()}`);
    await desktop.waitForURL(/\/journey\/chapter\/ch7$/, { timeout: 15_000 }).catch(() => {});
    if (!/\/journey\/chapter\/ch7$/.test(desktop.url())) {
      failures.push(`legacy chapter redirect landed at ${desktop.url()}`);
    }

    const legacyQuery = await desktop.goto(`${baseUrl}/journey/chapter/index.html?id=ch8`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    if (legacyQuery?.status() !== 200) failures.push(`legacy query chapter returned ${legacyQuery?.status()}`);
    await desktop.waitForURL(/\/journey\/chapter\/ch8$/, { timeout: 15_000 }).catch(() => {});
    if (!/\/journey\/chapter\/ch8$/.test(desktop.url())) {
      failures.push(`legacy query redirect landed at ${desktop.url()}`);
    }

    if (desktopFailures.consoleErrors.length) {
      failures.push(`desktop console errors: ${desktopFailures.consoleErrors.join(' | ')}`);
    }
    if (desktopFailures.notFound.length) {
      failures.push(`desktop unexpected 404s: ${[...new Set(desktopFailures.notFound)].join(' | ')}`);
    }
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const mobileFailures = watchRouteFailures(mobile);
    for (const route of mobileRoutes) {
      await checkShellRoute(mobile, route, failures);
    }
    if (mobileFailures.consoleErrors.length) {
      failures.push(`mobile console errors: ${mobileFailures.consoleErrors.join(' | ')}`);
    }
    if (mobileFailures.notFound.length) {
      failures.push(`mobile unexpected 404s: ${[...new Set(mobileFailures.notFound)].join(' | ')}`);
    }
    await mobile.close();

    if (failures.length > 0) throw new Error(failures.join('\n'));

    console.log(`Pages artifact smoke passed: ${canonicalRoutes.length} direct routes, mobile shell checks, and legacy redirects.`);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

runSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
