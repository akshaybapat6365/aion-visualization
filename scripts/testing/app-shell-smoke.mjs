import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

import { chromium } from 'playwright';

const port = Number(process.env.AION_SMOKE_PORT || 4174);
const baseUrl = `http://127.0.0.1:${port}`;
const canonicalRoutes = ['/', '/chapters', '/atlas', '/timeline', '/symbols', '/about'];
const canonicalRouteLabels = new Map([
  ['/', 'Home'],
  ['/chapters', 'Chapters'],
  ['/atlas', 'Atlas'],
  ['/timeline', 'Timeline'],
  ['/symbols', 'Symbols'],
  ['/about', 'About'],
]);
const chapterRoutes = Array.from({ length: 14 }, (_, index) => `/journey/chapter/ch${index + 1}`);
const desktopViewport = { width: 1440, height: 1000 };
const mobileViewport = { width: 390, height: 844 };

function startPreviewServer() {
  const child = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: process.cwd(),
      env: process.env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  return { child, getOutput: () => output };
}

async function stopPreviewServer(server) {
  if (server.child.exitCode !== null) return;

  const pid = server.child.pid;
  if (pid && process.platform !== 'win32') {
    process.kill(-pid, 'SIGTERM');
  } else {
    server.child.kill('SIGTERM');
  }

  await Promise.race([once(server.child, 'exit'), delay(2_000)]);
  if (server.child.exitCode !== null) return;

  if (pid && process.platform !== 'win32') {
    process.kill(-pid, 'SIGKILL');
  } else {
    server.child.kill('SIGKILL');
  }
}

async function waitForServer(server) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) {
      throw new Error(`Vite preview exited early.\n${server.getOutput()}`);
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Server is not ready yet.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for Vite preview at ${baseUrl}.\n${server.getOutput()}`);
}

function watchForRouteFailures(page) {
  const consoleErrors = [];
  const notFound = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    if (response.status() === 404 && !url.endsWith('/favicon.ico')) {
      notFound.push(url);
    }
  });

  return { consoleErrors, notFound };
}

async function gotoAppRoute(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
}

async function assertHealthyShell(page, route, failures) {
  const navVisible = await page.locator('header[aria-label="Global navigation"]').isVisible();
  const primaryNavVisible = await page.locator('nav[aria-label="Primary"]').isVisible();
  const mainVisible = await page.locator('main#main-content').isVisible();
  const jumpVisible = await page.locator('#chapter-jump-select').isVisible();
  const jumpOptionCount = await page.locator('#chapter-jump-select option').count();
  const skipTarget = await page.locator('.skip-link').getAttribute('href');

  if (!navVisible) failures.push(`missing global navigation: ${route}`);
  if (!primaryNavVisible) failures.push(`missing primary navigation: ${route}`);
  if (!mainVisible) failures.push(`missing main landmark: ${route}`);
  if (!jumpVisible) failures.push(`missing chapter jump: ${route}`);
  if (jumpOptionCount !== 15) failures.push(`chapter jump option mismatch: ${route} (${jumpOptionCount})`);
  if (skipTarget !== '#main-content') failures.push(`bad skip link target: ${route}`);
}

async function countCanvasPixels(canvas) {
  return canvas.evaluate((element) => new Promise((resolve) => {
    requestAnimationFrame(() => {
      const gl = element.getContext('webgl2')
        || element.getContext('webgl')
        || element.getContext('experimental-webgl');

      if (gl) {
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        const pixel = new Uint8Array(4);
        const grid = 32;
        let visiblePixels = 0;

        for (let y = 0; y < grid; y += 1) {
          for (let x = 0; x < grid; x += 1) {
            const px = Math.max(0, Math.min(width - 1, Math.round((x / (grid - 1)) * (width - 1))));
            const py = Math.max(0, Math.min(height - 1, Math.round((y / (grid - 1)) * (height - 1))));
            gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            if (pixel[3] > 0 && pixel[0] + pixel[1] + pixel[2] > 18) visiblePixels += 1;
          }
        }

        resolve(visiblePixels);
        return;
      }

      resolve(0);
    });
  }));
}

async function smokeCanonicalRoutes(page, failures) {
  for (const route of canonicalRoutes) {
    await gotoAppRoute(page, route);
    await assertHealthyShell(page, route, failures);

    const routeContext = await page.locator('.app-nav__context strong').textContent();
    const expectedRouteContext = canonicalRouteLabels.get(route);
    if (routeContext?.trim() !== expectedRouteContext) {
      failures.push(`route context mismatch for ${route}: ${routeContext}`);
    }
  }
}

async function smokeHomeVisualDetail(page, failures) {
  await gotoAppRoute(page, '/');

  const routeContext = await page.locator('.app-nav__context strong').textContent();
  const pathPanelCount = await page.locator('.path-panel').count();
  const pathDiagramCount = await page.locator('.path-panel__diagram').count();
  const metricCellCount = await page.locator('.metrics-strip__cell').count();
  const orbitNodeCount = await page.locator('.home-chapter-orbit a').count();
  const featuredOrbitNodeCount = await page.locator('.home-chapter-orbit__item--featured a').count();
  const previewLabels = await page.locator('.chapter-preview').evaluateAll((links) => links.map((link) => link.getAttribute('aria-label') || ''));

  if (routeContext?.trim() !== 'Home') failures.push(`home route context mismatch: ${routeContext}`);
  if (pathPanelCount !== 3) failures.push(`home path panel count mismatch: ${pathPanelCount}`);
  if (pathDiagramCount !== 3) failures.push(`home path diagram count mismatch: ${pathDiagramCount}`);
  if (metricCellCount !== 3) failures.push(`home metric cell count mismatch: ${metricCellCount}`);
  if (orbitNodeCount !== 14) failures.push(`home chapter orbit node count mismatch: ${orbitNodeCount}`);
  if (featuredOrbitNodeCount !== 4) failures.push(`home featured orbit node count mismatch: ${featuredOrbitNodeCount}`);
  for (const label of previewLabels) {
    if (!/^Chapter \d+: /.test(label) || label.includes('Visual sigil')) {
      failures.push(`noisy home chapter preview label: ${label}`);
    }
  }
}

async function smokeChapterRoutes(page, failures) {
  for (const route of chapterRoutes) {
    await gotoAppRoute(page, route);
    await assertHealthyShell(page, route, failures);

    const canvas = page.locator('.scene-host canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(500);
    const visiblePixels = await countCanvasPixels(canvas);
    if (visiblePixels <= 8) {
      failures.push(`blank or near-blank chapter canvas: ${route} (${visiblePixels} sampled pixels)`);
    }
  }
}

async function smokeKeyboard(page, failures) {
  await gotoAppRoute(page, '/');
  await page.keyboard.press('Tab');
  const skipFocused = await page.locator('.skip-link').evaluate((element) => document.activeElement === element);
  await page.keyboard.press('Tab');
  const brandFocused = await page.locator('.app-nav__brand').evaluate((element) => document.activeElement === element);

  if (!skipFocused) failures.push('keyboard focus did not start on skip link');
  if (!brandFocused) failures.push('keyboard focus did not proceed to brand link');
}

async function smokeReducedMotion(browser, failures) {
  const page = await browser.newPage({ viewport: desktopViewport });
  const routeFailures = watchForRouteFailures(page);
  const threeRequests = [];

  page.on('request', (request) => {
    const url = request.url();
    if (/\/assets\/three-|three.*\.js/i.test(url)) {
      threeRequests.push(url);
    }
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoAppRoute(page, '/');
  const staticHomeFieldVisible = await page.locator('.home-aion-field--static').isVisible();
  const animatedHomeCanvasCount = await page.locator('.home-aion-field__mount canvas').count();
  const navTransitionProperty = await page.locator('.app-nav__link').first().evaluate((element) => window.getComputedStyle(element).transitionProperty);
  const pathTransitionProperty = await page.locator('.path-panel').first().evaluate((element) => window.getComputedStyle(element).transitionProperty);

  if (!staticHomeFieldVisible) failures.push('reduced-motion home field is not visible');
  if (animatedHomeCanvasCount !== 0) failures.push(`reduced-motion home rendered animated canvas: ${animatedHomeCanvasCount}`);
  if (navTransitionProperty !== 'none') failures.push(`reduced-motion nav transition remains active: ${navTransitionProperty}`);
  if (pathTransitionProperty !== 'none') failures.push(`reduced-motion path transition remains active: ${pathTransitionProperty}`);

  await gotoAppRoute(page, '/journey/chapter/ch1');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const fallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const reducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterReferenceVisible = await page.locator('.chapter-stage__reference-map').isVisible();
  const chapterPauseControlCount = await page.locator('.scene-host__pause').count();
  const fallbackText = await page.locator('.scene-host__fallback').textContent();

  if (!fallbackVisible) failures.push('reduced-motion fallback is not visible for chapter scene');
  if (reducedMotionAttribute !== 'true') failures.push('chapter did not record reduced-motion state');
  if (!chapterReferenceVisible) failures.push('reduced-motion chapter reference map is not visible');
  if (chapterPauseControlCount !== 0) failures.push(`reduced-motion chapter rendered pause controls: ${chapterPauseControlCount}`);
  if (!fallbackText?.includes('small surface light')) failures.push('reduced-motion chapter fallback lost Chapter 1 teaching summary');
  if (threeRequests.length > 0) failures.push(`reduced-motion requested Three asset: ${threeRequests.join(', ')}`);

  failures.push(...routeFailures.notFound.map((url) => `reduced-motion 404 response: ${url}`));
  failures.push(...routeFailures.consoleErrors.map((message) => `reduced-motion console error: ${message}`));
  await page.close();
}

async function smokeLegacyRedirect(page, failures) {
  await page.goto(`${baseUrl}/chapters/chapter-7.html`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForURL(/\/journey\/chapter\/ch7$/, { timeout: 10_000 }).catch(() => {});
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  if (!/\/journey\/chapter\/ch7$/.test(page.url())) {
    failures.push(`legacy chapter redirect landed at ${page.url()}`);
  }
}

async function smokeChapterJump(page, failures) {
  await gotoAppRoute(page, '/chapters');
  await page.locator('#chapter-jump-select').waitFor({ state: 'visible', timeout: 10_000 });
  await page.selectOption('#chapter-jump-select', 'ch3');
  await page.waitForURL(/\/journey\/chapter\/ch3$/, { timeout: 10_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(() => document.querySelector('#chapter-jump-select')?.value === 'ch3', null, { timeout: 10_000 }).catch(() => {});

  const selectValue = await page.locator('#chapter-jump-select').inputValue();
  const previousVisible = await page.locator('.chapter-jump__sequence a[aria-label^="Previous chapter"]').isVisible();
  const nextVisible = await page.locator('.chapter-jump__sequence a[aria-label^="Next chapter"]').isVisible();

  if (selectValue !== 'ch3') failures.push(`chapter jump did not hold active value: ${selectValue}`);
  if (!previousVisible) failures.push('chapter route missing previous chapter control');
  if (!nextVisible) failures.push('chapter route missing next chapter control');
}

async function smokeChapterSceneControls(page, failures) {
  await gotoAppRoute(page, '/journey/chapter/ch1');
  const chapterOneReferenceCount = await page.locator('.chapter-stage__reference-node').count();
  if (chapterOneReferenceCount !== 3) failures.push(`chapter 1 reference node count mismatch: ${chapterOneReferenceCount}`);

  const pauseAnimation = page.getByRole('button', { name: /Pause animation/ });
  await pauseAnimation.click();
  await page.waitForTimeout(5_400);
  const paused = await page.getByRole('button', { name: /Resume animation/ }).getAttribute('aria-pressed');
  const pausedAnnotationCount = await page.locator('.ch1-a.vis').count();
  if (paused !== 'true') failures.push(`chapter animation pause control did not stay pressed: ${paused}`);
  if (pausedAnnotationCount !== 0) failures.push(`chapter animation pause allowed timed annotations to reveal: ${pausedAnnotationCount}`);
  await page.getByRole('button', { name: /Resume animation/ }).click();

  const rootsReference = page.locator('.chapter-stage__reference-node[data-panel-id="roots"]');
  await rootsReference.click();
  await page.waitForTimeout(5_400);
  const rootsReferencePressed = await rootsReference.getAttribute('aria-pressed');
  const rootsAnnotationState = await page.evaluate(() => ({
    egoVisible: document.querySelector('.ch1-a--ego')?.classList.contains('vis') || false,
    rootsPanelVisible: document.querySelector('.ch1-a--unconscious')?.classList.contains('panel-vis') || false,
  }));
  if (rootsReferencePressed !== 'true') failures.push(`chapter 1 reference node did not become active: ${rootsReferencePressed}`);
  if (rootsAnnotationState.egoVisible) failures.push('chapter 1 timed ego annotation stayed visible after selecting roots');
  if (!rootsAnnotationState.rootsPanelVisible) failures.push('chapter 1 roots annotation did not follow selected panel');

  const wholeness = page.getByRole('button', { name: /03\s+Wholeness/ });
  await wholeness.click();
  await page.waitForTimeout(250);

  const pressed = await wholeness.getAttribute('aria-pressed');
  const scrollY = await page.evaluate(() => window.scrollY);
  const sceneDescription = await page.locator('#scene-host-description-ch1').textContent();
  if (pressed !== 'true') failures.push(`chapter scene control did not become active: ${pressed}`);
  if (scrollY > 10) failures.push(`chapter scene control unexpectedly scrolled page: ${scrollY}`);
  if (!sceneDescription?.includes('The Self holds the field')) failures.push(`chapter 1 scene description did not follow active panel: ${sceneDescription}`);

  await gotoAppRoute(page, '/journey/chapter/ch2');
  const projection = page.getByRole('button', { name: /02\s+Projection/ });
  await projection.click();
  await page.waitForTimeout(250);

  const projectionPressed = await projection.getAttribute('aria-pressed');
  const chapterTwoScrollY = await page.evaluate(() => window.scrollY);
  if (projectionPressed !== 'true') failures.push(`chapter 2 scene control did not become active: ${projectionPressed}`);
  if (chapterTwoScrollY > 10) failures.push(`chapter 2 scene control unexpectedly scrolled page: ${chapterTwoScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch3');
  const conjunction = page.getByRole('button', { name: /03\s+Conjunction/ });
  await conjunction.click();
  await page.waitForTimeout(250);

  const conjunctionPressed = await conjunction.getAttribute('aria-pressed');
  const chapterThreeScrollY = await page.evaluate(() => window.scrollY);
  if (conjunctionPressed !== 'true') failures.push(`chapter 3 scene control did not become active: ${conjunctionPressed}`);
  if (chapterThreeScrollY > 10) failures.push(`chapter 3 scene control unexpectedly scrolled page: ${chapterThreeScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch4');
  const mandala = page.getByRole('button', { name: /03\s+Mandala/ });
  await mandala.click();
  await page.waitForTimeout(250);

  const mandalaPressed = await mandala.getAttribute('aria-pressed');
  const chapterFourScrollY = await page.evaluate(() => window.scrollY);
  if (mandalaPressed !== 'true') failures.push(`chapter 4 scene control did not become active: ${mandalaPressed}`);
  if (chapterFourScrollY > 10) failures.push(`chapter 4 scene control unexpectedly scrolled page: ${chapterFourScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch5');
  const depth = page.getByRole('button', { name: /03\s+Depth/ });
  await depth.click();
  await page.waitForTimeout(250);

  const depthPressed = await depth.getAttribute('aria-pressed');
  const chapterFiveScrollY = await page.evaluate(() => window.scrollY);
  if (depthPressed !== 'true') failures.push(`chapter 5 scene control did not become active: ${depthPressed}`);
  if (chapterFiveScrollY > 10) failures.push(`chapter 5 scene control unexpectedly scrolled page: ${chapterFiveScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch6');
  const threshold = page.getByRole('button', { name: /03\s+Threshold/ });
  await threshold.click();
  await page.waitForTimeout(250);

  const thresholdPressed = await threshold.getAttribute('aria-pressed');
  const chapterSixScrollY = await page.evaluate(() => window.scrollY);
  if (thresholdPressed !== 'true') failures.push(`chapter 6 scene control did not become active: ${thresholdPressed}`);
  if (chapterSixScrollY > 10) failures.push(`chapter 6 scene control unexpectedly scrolled page: ${chapterSixScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch7');
  const chapterSevenThreshold = page.getByRole('button', { name: /03\s+Threshold/ });
  await chapterSevenThreshold.click();
  await page.waitForTimeout(250);

  const chapterSevenPressed = await chapterSevenThreshold.getAttribute('aria-pressed');
  const chapterSevenScrollY = await page.evaluate(() => window.scrollY);
  if (chapterSevenPressed !== 'true') failures.push(`chapter 7 scene control did not become active: ${chapterSevenPressed}`);
  if (chapterSevenScrollY > 10) failures.push(`chapter 7 scene control unexpectedly scrolled page: ${chapterSevenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch8');
  const afterlife = page.getByRole('button', { name: /03\s+Afterlife/ });
  await afterlife.click();
  await page.waitForTimeout(250);

  const afterlifePressed = await afterlife.getAttribute('aria-pressed');
  const chapterEightScrollY = await page.evaluate(() => window.scrollY);
  if (afterlifePressed !== 'true') failures.push(`chapter 8 scene control did not become active: ${afterlifePressed}`);
  if (chapterEightScrollY > 10) failures.push(`chapter 8 scene control unexpectedly scrolled page: ${chapterEightScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch9');
  const shadowFish = page.getByRole('button', { name: /03\s+Shadow/ });
  await shadowFish.click();
  await page.waitForTimeout(250);

  const shadowFishPressed = await shadowFish.getAttribute('aria-pressed');
  const chapterNineScrollY = await page.evaluate(() => window.scrollY);
  if (shadowFishPressed !== 'true') failures.push(`chapter 9 scene control did not become active: ${shadowFishPressed}`);
  if (chapterNineScrollY > 10) failures.push(`chapter 9 scene control unexpectedly scrolled page: ${chapterNineScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch10');
  const opus = page.getByRole('button', { name: /03\s+Opus/ });
  await opus.click();
  await page.waitForTimeout(250);

  const opusPressed = await opus.getAttribute('aria-pressed');
  const chapterTenScrollY = await page.evaluate(() => window.scrollY);
  if (opusPressed !== 'true') failures.push(`chapter 10 scene control did not become active: ${opusPressed}`);
  if (chapterTenScrollY > 10) failures.push(`chapter 10 scene control unexpectedly scrolled page: ${chapterTenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch11');
  const stone = page.getByRole('button', { name: /03\s+Stone/ });
  await stone.click();
  await page.waitForTimeout(250);

  const stonePressed = await stone.getAttribute('aria-pressed');
  const chapterElevenScrollY = await page.evaluate(() => window.scrollY);
  if (stonePressed !== 'true') failures.push(`chapter 11 scene control did not become active: ${stonePressed}`);
  if (chapterElevenScrollY > 10) failures.push(`chapter 11 scene control unexpectedly scrolled page: ${chapterElevenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch12');
  const bridge = page.getByRole('button', { name: /03\s+Bridge/ });
  await bridge.click();
  await page.waitForTimeout(250);

  const bridgePressed = await bridge.getAttribute('aria-pressed');
  const chapterTwelveScrollY = await page.evaluate(() => window.scrollY);
  if (bridgePressed !== 'true') failures.push(`chapter 12 scene control did not become active: ${bridgePressed}`);
  if (chapterTwelveScrollY > 10) failures.push(`chapter 12 scene control unexpectedly scrolled page: ${chapterTwelveScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch13');
  const paradox = page.getByRole('button', { name: /03\s+Paradox/ });
  await paradox.click();
  await page.waitForTimeout(250);

  const paradoxPressed = await paradox.getAttribute('aria-pressed');
  const chapterThirteenScrollY = await page.evaluate(() => window.scrollY);
  if (paradoxPressed !== 'true') failures.push(`chapter 13 scene control did not become active: ${paradoxPressed}`);
  if (chapterThirteenScrollY > 10) failures.push(`chapter 13 scene control unexpectedly scrolled page: ${chapterThirteenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch14');
  const aeon = page.getByRole('button', { name: /03\s+Aeon/ });
  await aeon.click();
  await page.waitForTimeout(250);

  const aeonPressed = await aeon.getAttribute('aria-pressed');
  const chapterFourteenScrollY = await page.evaluate(() => window.scrollY);
  if (aeonPressed !== 'true') failures.push(`chapter 14 scene control did not become active: ${aeonPressed}`);
  if (chapterFourteenScrollY > 10) failures.push(`chapter 14 scene control unexpectedly scrolled page: ${chapterFourteenScrollY}`);
}

async function smokeMobile(page, failures) {
  await page.setViewportSize(mobileViewport);
  for (const route of ['/', '/chapters', '/atlas', '/journey/chapter/ch1', '/journey/chapter/ch14']) {
    await gotoAppRoute(page, route);
    await assertHealthyShell(page, `mobile ${route}`, failures);
  }

  for (const viewport of [mobileViewport, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await gotoAppRoute(page, '/');

    const navBox = await page.locator('.app-nav').boundingBox();
    const heroCopyBox = await page.locator('.home-hero__copy').boundingBox();
    if (!navBox || !heroCopyBox) {
      failures.push(`mobile home geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const navBottom = navBox.y + navBox.height;
    if (navBottom > heroCopyBox.y - 1) {
      failures.push(`mobile nav overlaps home hero copy at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(navBottom)}, copy top ${Math.round(heroCopyBox.y)}`);
    }

    await gotoAppRoute(page, '/journey/chapter/ch1');
    const chapterNavBox = await page.locator('.app-nav').boundingBox();
    const chapterHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const referenceCount = await page.locator('.chapter-stage__reference-node').count();
    if (!chapterNavBox || !chapterHeadingBox) {
      failures.push(`mobile chapter 1 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterNavBottom = chapterNavBox.y + chapterNavBox.height;
    if (chapterNavBottom > chapterHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 1 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterNavBottom)}, heading top ${Math.round(chapterHeadingBox.y)}`);
    }
    if (referenceCount !== 3) failures.push(`mobile chapter 1 reference node count mismatch at ${viewport.width}x${viewport.height}: ${referenceCount}`);
  }
}

async function runSmoke() {
  const server = startPreviewServer();
  const failures = [];
  let browser;

  try {
    await waitForServer(server);
    browser = await chromium.launch({ headless: true });
    await smokeReducedMotion(browser, failures);

    const page = await browser.newPage({ viewport: desktopViewport });
    const routeFailures = watchForRouteFailures(page);

    await smokeCanonicalRoutes(page, failures);
    await smokeHomeVisualDetail(page, failures);
    await smokeChapterRoutes(page, failures);
    await smokeKeyboard(page, failures);
    await smokeLegacyRedirect(page, failures);
    await smokeChapterJump(page, failures);
    await smokeChapterSceneControls(page, failures);
    await smokeMobile(page, failures);

    failures.push(...routeFailures.notFound.map((url) => `404 response: ${url}`));
    failures.push(...routeFailures.consoleErrors.map((message) => `console error: ${message}`));

    if (failures.length > 0) {
      throw new Error(failures.join('\n'));
    }

    console.log('Aion app shell smoke passed: 20 desktop routes, mobile shell checks, reduced motion, keyboard focus, and legacy redirect.');
  } finally {
    if (browser) await browser.close();
    await stopPreviewServer(server);
  }
}

runSmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
