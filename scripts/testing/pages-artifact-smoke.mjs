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

const mobileRoutes = ['/', '/chapters', '/atlas', '/timeline', '/symbols', '/about', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch5', '/journey/chapter/ch6', '/journey/chapter/ch8', '/journey/chapter/ch9', '/journey/chapter/ch10', '/journey/chapter/ch11', '/journey/chapter/ch12', '/journey/chapter/ch13', '/journey/chapter/ch14'];

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

async function checkTimelineArtifact(page, failures) {
  await checkShellRoute(page, '/timeline', failures);

  const title = await page.locator('h1').first().textContent();
  const railCount = await page.locator('.timeline-rail__item').count();
  const fieldNodeCount = await page.locator('.timeline-field__node').count();
  const chipCount = await page.locator('.timeline-controls__chip').count();
  const phaseCount = await page.locator('.timeline-field__phase').count();
  const beamVisible = await page.locator('.timeline-field__selected-beam').isVisible();
  const detailVisible = await page.locator('#timeline-selected-detail').isVisible();
  const lensText = await page.locator('.timeline-detail__lens').textContent();
  const fieldLabel = await page.getByRole('group', { name: /Timeline field:/ }).getAttribute('aria-label');

  if (!title?.includes('Jung in symbolic time')) failures.push(`/timeline artifact title mismatch: ${title}`);
  if (railCount !== 22) failures.push(`/timeline artifact rail count mismatch: ${railCount}`);
  if (fieldNodeCount !== 22) failures.push(`/timeline artifact field count mismatch: ${fieldNodeCount}`);
  if (chipCount !== 5) failures.push(`/timeline artifact chip count mismatch: ${chipCount}`);
  if (phaseCount !== 4) failures.push(`/timeline artifact phase count mismatch: ${phaseCount}`);
  if (!beamVisible) failures.push('/timeline artifact selected beam is not visible');
  if (!detailVisible) failures.push('/timeline artifact detail is not visible');
  if (!lensText?.includes('1875') || !lensText?.includes('Clinical roots')) failures.push(`/timeline artifact lens mismatch: ${lensText}`);
  if (!fieldLabel?.includes('22 of 22 events visible')) failures.push(`/timeline artifact field label mismatch: ${fieldLabel}`);
}

async function checkSymbolsArtifact(page, failures) {
  await checkShellRoute(page, '/symbols', failures);

  const title = await page.locator('h1').first().textContent();
  const orbitCount = await page.locator('.symbol-orbit__node').count();
  const panelCount = await page.locator('.symbol-panel').count();
  const markCount = await page.locator('.symbol-mark').count();
  const specimenVisible = await page.locator('.symbol-field__specimen').isVisible();
  const threadCount = await page.locator('.symbol-field__thread').count();
  const fieldLabel = await page.getByRole('img', { name: /Fish symbol field/ }).getAttribute('aria-label');
  const detailTitle = await page.locator('#symbol-selected-detail h2').textContent();
  const detailSpecimen = await page.locator('.symbol-detail__specimen').textContent();
  const chapterHrefs = await page.locator('.symbol-detail__chapter-links a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));

  if (!title?.includes('Lexicon of recurring images')) failures.push(`/symbols artifact title mismatch: ${title}`);
  if (orbitCount !== 9) failures.push(`/symbols artifact orbit count mismatch: ${orbitCount}`);
  if (panelCount !== 9) failures.push(`/symbols artifact panel count mismatch: ${panelCount}`);
  if (markCount < 20) failures.push(`/symbols artifact mark count too low: ${markCount}`);
  if (!specimenVisible) failures.push('/symbols artifact active specimen is not visible');
  if (threadCount < 2) failures.push(`/symbols artifact chapter thread count too low: ${threadCount}`);
  if (!fieldLabel?.includes('Piscean fish pair') || !fieldLabel?.includes('Chapter 6')) failures.push(`/symbols artifact field label mismatch: ${fieldLabel}`);
  if (!detailTitle?.includes('Fish')) failures.push(`/symbols artifact initial detail mismatch: ${detailTitle}`);
  if (!detailSpecimen?.includes('Aeon / shadow')) failures.push(`/symbols artifact specimen mismatch: ${detailSpecimen}`);
  if (!chapterHrefs.length || chapterHrefs.some((href) => !href?.startsWith(`${basePath}/journey/chapter/ch`))) {
    failures.push(`/symbols artifact chapter hrefs are not base-aware: ${chapterHrefs.join(', ')}`);
  }

  const sophia = page.getByRole('button', { name: /Select Sophia:/ });
  await sophia.click();
  await page.waitForTimeout(100);

  const sophiaPressed = await sophia.getAttribute('aria-pressed');
  const sophiaFieldLabel = await page.getByRole('img', { name: /Sophia symbol field/ }).getAttribute('aria-label');
  const sophiaLink = await page.getByRole('link', { name: /03 · The Syzygy/ }).getAttribute('href');
  const activeOrbitCount = await page.locator('.symbol-orbit__node[aria-pressed="true"]').count();

  if (sophiaPressed !== 'true') failures.push(`/symbols artifact Sophia orbit did not become active: ${sophiaPressed}`);
  if (!sophiaFieldLabel?.includes('Sophia / wisdom figure') || !sophiaFieldLabel?.includes('The Syzygy')) failures.push(`/symbols artifact Sophia field label mismatch: ${sophiaFieldLabel}`);
  if (sophiaLink !== `${basePath}/journey/chapter/ch3`) failures.push(`/symbols artifact Sophia link mismatch: ${sophiaLink}`);
  if (activeOrbitCount !== 1) failures.push(`/symbols artifact active orbit count mismatch: ${activeOrbitCount}`);

  const lapis = page.getByRole('button', { name: /Focus Lapis in the symbol field/ });
  await lapis.click();
  await page.waitForTimeout(100);

  const lapisPressed = await lapis.getAttribute('aria-pressed');
  const lapisDetail = await page.locator('#symbol-selected-detail h2').textContent();
  const activePanelCount = await page.locator('.symbol-panel__activate[aria-pressed="true"]').count();
  if (lapisPressed !== 'true') failures.push(`/symbols artifact Lapis panel did not become active: ${lapisPressed}`);
  if (!lapisDetail?.includes('Lapis')) failures.push(`/symbols artifact Lapis detail mismatch: ${lapisDetail}`);
  if (activePanelCount !== 1) failures.push(`/symbols artifact active panel count mismatch: ${activePanelCount}`);
}

async function checkChaptersArtifact(page, failures) {
  await checkShellRoute(page, '/chapters', failures);

  const title = await page.locator('h1').first().textContent();
  const arcCount = await page.locator('.chapters-arc-map__cluster').count();
  const orbitCount = await page.locator('.chapters-orbit__node').count();
  const cardCount = await page.locator('.chapter-card').count();
  const selectedDetail = page.locator('#chapters-selected-detail');
  const initialChapter = await selectedDetail.getAttribute('data-selected-chapter');

  if (!title?.includes('Fourteen chapters as one psyche arc')) failures.push(`/chapters artifact title mismatch: ${title}`);
  if (arcCount !== 7) failures.push(`/chapters artifact arc count mismatch: ${arcCount}`);
  if (orbitCount !== 14) failures.push(`/chapters artifact orbit count mismatch: ${orbitCount}`);
  if (cardCount !== 14) failures.push(`/chapters artifact card count mismatch: ${cardCount}`);
  if (initialChapter !== 'ch1') failures.push(`/chapters artifact initial selected chapter mismatch: ${initialChapter}`);

  await page.getByRole('button', { name: /Synthesis\s+14–14/ }).click();
  await page.waitForTimeout(100);
  const selectedChapter = await selectedDetail.getAttribute('data-selected-chapter');
  const selectedLink = await page.locator('.chapters-selected-panel__link').getAttribute('href');
  const pressedCount = await page.locator('.chapters-orbit__node[aria-pressed="true"]').count();

  if (selectedChapter !== 'ch14') failures.push(`/chapters artifact selected chapter did not update: ${selectedChapter}`);
  if (selectedLink !== `${basePath}/journey/chapter/ch14`) failures.push(`/chapters artifact selected link mismatch: ${selectedLink}`);
  if (pressedCount !== 1) failures.push(`/chapters artifact pressed orbit count mismatch: ${pressedCount}`);
}

async function checkAboutArtifact(page, failures) {
  await checkShellRoute(page, '/about', failures);

  const title = await page.locator('h1').first().textContent();
  const fieldVisible = await page.getByRole('img', { name: /Aion learning orientation field/ }).isVisible();
  const modeCount = await page.locator('.about-orientation-node').count();
  const routeCardCount = await page.locator('.about-route-card').count();
  const routeCardHrefs = await page.locator('.about-route-card').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const initialMode = await page.locator('#about-orientation-detail').getAttribute('data-active-mode');

  if (!title?.includes('Aion visual atlas')) failures.push(`/about artifact title mismatch: ${title}`);
  if (!fieldVisible) failures.push('/about artifact orientation field is not visible');
  if (modeCount !== 4) failures.push(`/about artifact mode count mismatch: ${modeCount}`);
  if (routeCardCount !== 4) failures.push(`/about artifact route card count mismatch: ${routeCardCount}`);
  if (initialMode !== 'study') failures.push(`/about artifact initial detail mode mismatch: ${initialMode}`);

  for (const expectedHref of [`${basePath}/chapters`, `${basePath}/atlas`, `${basePath}/symbols`, `${basePath}/timeline`]) {
    if (!routeCardHrefs.includes(expectedHref)) failures.push(`/about artifact route cards missing href: ${expectedHref}`);
  }

  await page.getByRole('button', { name: /Map: See concepts as relations/ }).click();
  await page.waitForTimeout(100);
  const selectedMode = await page.locator('#about-orientation-detail').getAttribute('data-active-mode');
  const selectedTitle = await page.locator('#about-orientation-detail h2').textContent();
  const selectedLink = await page.locator('.about-orientation__link').getAttribute('href');
  const pressedCount = await page.locator('.about-orientation-node[aria-pressed="true"]').count();
  if (selectedMode !== 'map') failures.push(`/about artifact selected mode mismatch: ${selectedMode}`);
  if (!selectedTitle?.includes('See concepts as relations')) failures.push(`/about artifact selected detail mismatch: ${selectedTitle}`);
  if (selectedLink !== `${basePath}/atlas`) failures.push(`/about artifact selected link mismatch: ${selectedLink}`);
  if (pressedCount !== 1) failures.push(`/about artifact pressed mode count mismatch: ${pressedCount}`);
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
    await checkChaptersArtifact(desktop, failures);
    await checkAboutArtifact(desktop, failures);
    await checkTimelineArtifact(desktop, failures);
    await checkSymbolsArtifact(desktop, failures);

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
