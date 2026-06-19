import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
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
const debugSmoke = process.env.AION_SMOKE_DEBUG === 'true';
const viteBin = process.platform === 'win32'
  ? resolve(repoRoot, 'node_modules/.bin/vite.cmd')
  : resolve(repoRoot, 'node_modules/.bin/vite');

function smokeLog(message) {
  if (debugSmoke) console.log(`[smoke] ${message}`);
}

function startPreviewServer() {
  const child = spawn(
    viteBin,
    ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: repoRoot,
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

function terminateProcess(server, signal) {
  const pid = server.child.pid;
  try {
    if (pid && process.platform !== 'win32') {
      process.kill(-pid, signal);
    } else {
      server.child.kill(signal);
    }
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
}

async function stopPreviewServer(server) {
  if (server.child.exitCode !== null) return;

  terminateProcess(server, 'SIGTERM');

  await Promise.race([once(server.child, 'exit'), delay(2_000)]);
  if (server.child.exitCode !== null) return;

  terminateProcess(server, 'SIGKILL');
}

async function waitForServer(server) {
  const deadline = Date.now() + 60_000;
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
  smokeLog(`goto ${route}`);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  try {
    await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 30_000 });
  } catch (error) {
    throw new Error(`main#main-content did not become visible for ${route}: ${error.message}`);
  }
  smokeLog(`ready ${route}`);
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
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      resolve({ timedOut: true, visiblePixels: 0 });
    }, 2_500);

    requestAnimationFrame(() => {
      if (timedOut) return;
      window.clearTimeout(timeout);
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

        resolve({ timedOut: false, visiblePixels });
        return;
      }

      resolve({ timedOut: false, visiblePixels: 0 });
    });
  }));
}

function recordCanvasPixelFailure(failures, label, result) {
  if (result.timedOut) {
    failures.push(`${label} canvas pixel sampling timed out`);
    return;
  }
  if (result.visiblePixels <= 8) {
    failures.push(`${label} canvas appears blank: ${result.visiblePixels}`);
  }
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
  const narrativeMapVisible = await page.locator('.home-narrative__diagram svg').isVisible();
  const narrativeNodeCount = await page.locator('.home-narrative__node').count();
  const narrativeLinkCount = await page.locator('.home-narrative__legend a').count();
  const orbitNodeCount = await page.locator('.home-chapter-orbit a').count();
  const featuredOrbitNodeCount = await page.locator('.home-chapter-orbit__item--featured a').count();
  const previewLabels = await page.locator('.chapter-preview').evaluateAll((links) => links.map((link) => link.getAttribute('aria-label') || ''));

  if (routeContext?.trim() !== 'Home') failures.push(`home route context mismatch: ${routeContext}`);
  if (pathPanelCount !== 3) failures.push(`home path panel count mismatch: ${pathPanelCount}`);
  if (pathDiagramCount !== 3) failures.push(`home path diagram count mismatch: ${pathDiagramCount}`);
  if (!narrativeMapVisible) failures.push('home narrative map is not visible');
  if (narrativeNodeCount !== 6) failures.push(`home narrative node count mismatch: ${narrativeNodeCount}`);
  if (narrativeLinkCount !== 6) failures.push(`home narrative link count mismatch: ${narrativeLinkCount}`);
  if (orbitNodeCount !== 14) failures.push(`home chapter orbit node count mismatch: ${orbitNodeCount}`);
  if (featuredOrbitNodeCount !== 4) failures.push(`home featured orbit node count mismatch: ${featuredOrbitNodeCount}`);
  for (const label of previewLabels) {
    if (!/^Chapter \d+: /.test(label) || label.includes('Visual sigil')) {
      failures.push(`noisy home chapter preview label: ${label}`);
    }
  }
}

async function smokeAtlasVisualSearch(page, failures) {
  await gotoAppRoute(page, '/atlas');

  const search = page.locator('#atlas-search');
  const constellation = page.locator('.atlas-constellation');
  const stage = page.locator('.atlas-constellation__stage[role="img"]');
  const chapters = page.locator('.atlas-constellation__chapter');
  const chapterRail = page.locator('.atlas-constellation__chapter-rail');

  await search.waitFor({ state: 'visible', timeout: 10_000 });

  const constellationCount = await constellation.count();
  const initialChapterCount = await chapters.count();
  const initialConceptNodeCount = await page.locator('.atlas-constellation__field-node--concept').count();
  const initialSymbolNodeCount = await page.locator('.atlas-constellation__field-node--symbol').count();
  const initialRelationCount = await page.locator('.atlas-constellation__relation-band span').count();
  const initialRailRole = await chapterRail.getAttribute('role');
  const initialRailLabel = await chapterRail.getAttribute('aria-label');
  const initiallyChecked = await page.locator('.atlas-constellation__chapter[aria-checked="true"]').count();

  if (constellationCount !== 1) failures.push(`atlas constellation count mismatch: ${constellationCount}`);
  if (!await stage.isVisible()) failures.push('atlas constellation stage is not visible');
  if (await page.locator('.atlas-constellation__ring').count() !== 2) failures.push('atlas constellation ring count mismatch');
  if (initialConceptNodeCount < 1) failures.push(`atlas initial concept nodes missing: ${initialConceptNodeCount}`);
  if (initialSymbolNodeCount < 1) failures.push(`atlas initial symbol nodes missing: ${initialSymbolNodeCount}`);
  if (initialChapterCount !== 14) failures.push(`atlas chapter rail count mismatch: ${initialChapterCount}`);
  if (initialRelationCount < 1) failures.push(`atlas initial relation entries missing: ${initialRelationCount}`);
  if (initialRailRole !== 'radiogroup') failures.push(`atlas chapter rail role mismatch: ${initialRailRole}`);
  if (initialRailLabel !== '14 chapters in view') failures.push(`atlas chapter rail label mismatch: ${initialRailLabel}`);
  if (initiallyChecked !== 1) failures.push(`atlas checked chapter count mismatch: ${initiallyChecked}`);

  await search.fill('syzygy');
  await page.waitForFunction(() => {
    const count = document.querySelectorAll('.atlas-constellation__chapter').length;
    return count > 0 && count < 14;
  }, null, { timeout: 2_000 }).catch(() => {});

  const searchedChapterCount = await chapters.count();
  const searchedRailLabel = await chapterRail.getAttribute('aria-label');
  const searchedRailLabelExpected = `${searchedChapterCount} chapter${searchedChapterCount === 1 ? '' : 's'} in view`;
  const syzygyRadio = page.getByRole('radio', { name: /Select chapter 3: The Syzygy/ });
  const syzygyVisible = await syzygyRadio.isVisible();

  if (searchedChapterCount <= 0 || searchedChapterCount >= 14) failures.push(`atlas search did not narrow chapter results: ${searchedChapterCount}`);
  if (searchedRailLabel !== searchedRailLabelExpected) failures.push(`atlas filtered rail label mismatch: ${searchedRailLabel}`);
  if (!syzygyVisible) failures.push('atlas search did not expose Chapter 3 syzygy result');

  await syzygyRadio.click();
  const detailTitle = await page.locator('#atlas-selected-detail h2').textContent();
  const selectedConceptNodeCount = await page.locator('.atlas-constellation__field-node--concept').count();
  const selectedSymbolNodeCount = await page.locator('.atlas-constellation__field-node--symbol').count();
  const selectedRelationCount = await page.locator('.atlas-constellation__relation-band span').count();
  const syzygyChecked = await syzygyRadio.getAttribute('aria-checked');
  const scrollYAfterSelect = await page.evaluate(() => window.scrollY);

  if (!detailTitle?.includes('The Syzygy')) failures.push(`atlas detail did not follow selected search result: ${detailTitle}`);
  if (selectedConceptNodeCount < 1) failures.push(`atlas selected concept nodes missing: ${selectedConceptNodeCount}`);
  if (selectedSymbolNodeCount < 1) failures.push(`atlas selected symbol nodes missing: ${selectedSymbolNodeCount}`);
  if (selectedRelationCount < 1) failures.push(`atlas selected relation entries missing: ${selectedRelationCount}`);
  if (syzygyChecked !== 'true') failures.push(`atlas selected radio did not become checked: ${syzygyChecked}`);
  if (scrollYAfterSelect > 10) failures.push(`atlas chapter selection unexpectedly scrolled page: ${scrollYAfterSelect}`);

  await search.fill('Relational Psyche');
  await page.waitForFunction(() => document.querySelectorAll('.atlas-constellation__chapter').length === 1, null, { timeout: 2_000 }).catch(() => {});
  const relationalChapterCount = await chapters.count();
  const relationalRadio = page.getByRole('radio', { name: /Select chapter 3: The Syzygy/ });
  if (relationalChapterCount !== 1) failures.push(`atlas cluster search did not filter to one chapter: ${relationalChapterCount}`);

  await relationalRadio.press('ArrowLeft');
  await page.waitForTimeout(100);
  const arrowSelectedTitle = await page.locator('#atlas-selected-detail h2').textContent();
  if (!arrowSelectedTitle?.includes('The Syzygy')) failures.push(`atlas one-result arrow navigation changed selection: ${arrowSelectedTitle}`);

  await search.fill('not-a-real-term');
  await page.waitForTimeout(100);
  const emptyChapterCount = await chapters.count();
  const emptyVisible = await page.locator('.atlas-constellation__empty').isVisible();
  const emptyDetailTitle = await page.locator('#atlas-selected-detail h2').textContent();
  const emptyRailLabel = await chapterRail.getAttribute('aria-label');
  const emptyFieldNodeCount = await page.locator('.atlas-constellation__field-node').count();
  const emptyImageVisible = await page.getByRole('img', { name: /Empty Atlas Field/ }).isVisible();

  if (emptyChapterCount !== 0) failures.push(`atlas empty search still rendered chapter buttons: ${emptyChapterCount}`);
  if (!emptyVisible) failures.push('atlas empty search message is not visible');
  if (!emptyDetailTitle?.includes('Nothing in the field')) failures.push(`atlas empty detail did not render: ${emptyDetailTitle}`);
  if (emptyRailLabel !== '0 chapters in view') failures.push(`atlas empty rail label mismatch: ${emptyRailLabel}`);
  if (emptyFieldNodeCount !== 0) failures.push(`atlas empty field still rendered nodes: ${emptyFieldNodeCount}`);
  if (!emptyImageVisible) failures.push('atlas empty field did not expose empty accessible name');
}

async function smokeChapterRoutes(page, failures) {
  const browser = page.context().browser();

  for (const route of chapterRoutes) {
    if (!browser) throw new Error('Chapter route smoke requires a browser instance.');

    const chapterContext = await browser.newContext({ viewport: desktopViewport });
    const chapterPage = await chapterContext.newPage();
    const routeFailures = watchForRouteFailures(chapterPage);

    try {
      await gotoAppRoute(chapterPage, route);
      await assertHealthyShell(chapterPage, route, failures);

      const canvas = chapterPage.locator('.scene-host canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 15_000 });
      await chapterPage.waitForTimeout(500);
      const { timedOut, visiblePixels } = await countCanvasPixels(canvas);
      if (timedOut) {
        failures.push(`chapter canvas pixel sampling timed out: ${route}`);
      } else if (visiblePixels <= 8) {
        failures.push(`blank or near-blank chapter canvas: ${route} (${visiblePixels} sampled pixels)`);
      }
      await chapterPage.waitForTimeout(250);
      failures.push(...routeFailures.notFound.map((url) => `404 response: ${url}`));
      failures.push(...routeFailures.consoleErrors.map((message) => `console error: ${message}`));
    } finally {
      await chapterContext.close();
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

  await gotoAppRoute(page, '/atlas');
  const atlasChapterTransitionProperty = await page.locator('.atlas-constellation__chapter').first().evaluate((element) => window.getComputedStyle(element).transitionProperty);
  const atlasCoreAnimationName = await page.locator('.atlas-constellation__core-glow').evaluate((element) => window.getComputedStyle(element).animationName);
  if (atlasChapterTransitionProperty !== 'none') failures.push(`reduced-motion atlas chapter transition remains active: ${atlasChapterTransitionProperty}`);
  if (atlasCoreAnimationName !== 'none') failures.push(`reduced-motion atlas core animation remains active: ${atlasCoreAnimationName}`);

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

  await gotoAppRoute(page, '/journey/chapter/ch2');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterTwoFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterTwoReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterTwoReferenceCount = await page.locator('.chapter-stage__reference-node').count();
  const chapterTwoPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterTwoCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterTwoAnnotationCount = await page.locator('.ch2-annotations').count();
  const chapterTwoFallbackText = await page.locator('.scene-host__fallback').textContent();

  if (!chapterTwoFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 2 scene');
  if (chapterTwoReducedMotionAttribute !== 'true') failures.push('Chapter 2 did not record reduced-motion state');
  if (chapterTwoReferenceCount !== 3) failures.push(`reduced-motion Chapter 2 reference node count mismatch: ${chapterTwoReferenceCount}`);
  if (chapterTwoPauseControlCount !== 0) failures.push(`reduced-motion Chapter 2 rendered pause controls: ${chapterTwoPauseControlCount}`);
  if (chapterTwoCanvasCount !== 0) failures.push(`reduced-motion Chapter 2 rendered canvas: ${chapterTwoCanvasCount}`);
  if (chapterTwoAnnotationCount !== 0) failures.push(`reduced-motion Chapter 2 rendered annotation overlay: ${chapterTwoAnnotationCount}`);
  if (!chapterTwoFallbackText?.includes('split mirror') || !chapterTwoFallbackText?.includes('projection arcs')) {
    failures.push('reduced-motion chapter fallback lost Chapter 2 shadow teaching summary');
  }

  await gotoAppRoute(page, '/journey/chapter/ch3');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterThreeFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterThreeReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterThreeReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterThreeReferenceCount = await chapterThreeReferenceNodes.count();
  const chapterThreePanelIds = await chapterThreeReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterThreePauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterThreeCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterThreeAnnotationCount = await page.locator('.ch3-annotations').count();
  const chapterThreeFallbackText = await page.locator('.scene-host__fallback').textContent();

  if (!chapterThreeFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 3 scene');
  if (chapterThreeReducedMotionAttribute !== 'true') failures.push('Chapter 3 did not record reduced-motion state');
  if (chapterThreeReferenceCount !== 3) failures.push(`reduced-motion Chapter 3 reference node count mismatch: ${chapterThreeReferenceCount}`);
  if (chapterThreePanelIds.join(',') !== 'pair,orbit,union') failures.push(`reduced-motion Chapter 3 reference nodes out of order: ${chapterThreePanelIds.join(',')}`);
  if (chapterThreePauseControlCount !== 0) failures.push(`reduced-motion Chapter 3 rendered pause controls: ${chapterThreePauseControlCount}`);
  if (chapterThreeCanvasCount !== 0) failures.push(`reduced-motion Chapter 3 rendered canvas: ${chapterThreeCanvasCount}`);
  if (chapterThreeAnnotationCount !== 0) failures.push(`reduced-motion Chapter 3 rendered annotation overlay: ${chapterThreeAnnotationCount}`);
  if (!chapterThreeFallbackText?.includes('projection makes the inner image appear outside') || !chapterThreeFallbackText?.includes('brief symbolic union')) {
    failures.push('reduced-motion chapter fallback lost Chapter 3 syzygy teaching summary');
  }

  await gotoAppRoute(page, '/journey/chapter/ch4');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterFourFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterFourReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterFourReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterFourReferenceCount = await chapterFourReferenceNodes.count();
  const chapterFourPanelIds = await chapterFourReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterFourPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterFourCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterFourFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterFourInstrumentCount = await page.locator('.self-mandala-instrument').count();
  const chapterFourInstrumentMotion = await page.locator('.self-mandala-instrument__center').evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  });

  if (!chapterFourFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 4 scene');
  if (chapterFourReducedMotionAttribute !== 'true') failures.push('Chapter 4 did not record reduced-motion state');
  if (chapterFourReferenceCount !== 3) failures.push(`reduced-motion Chapter 4 reference node count mismatch: ${chapterFourReferenceCount}`);
  if (chapterFourPanelIds.join(',') !== 'seed,quaternity,mandala') failures.push(`reduced-motion Chapter 4 reference nodes out of order: ${chapterFourPanelIds.join(',')}`);
  if (chapterFourPauseControlCount !== 0) failures.push(`reduced-motion Chapter 4 rendered pause controls: ${chapterFourPauseControlCount}`);
  if (chapterFourCanvasCount !== 0) failures.push(`reduced-motion Chapter 4 rendered canvas: ${chapterFourCanvasCount}`);
  if (chapterFourInstrumentCount !== 1) failures.push(`reduced-motion Chapter 4 Self mandala instrument count mismatch: ${chapterFourInstrumentCount}`);
  if (chapterFourInstrumentMotion.animationName !== 'none') failures.push(`reduced-motion Chapter 4 Self mandala center still animates: ${chapterFourInstrumentMotion.animationName}`);
  if (chapterFourInstrumentMotion.transitionDuration !== '0s') failures.push(`reduced-motion Chapter 4 Self mandala center still transitions: ${chapterFourInstrumentMotion.transitionDuration}`);
  if (!chapterFourFallbackText?.includes('Concentric mandala rings') || !chapterFourFallbackText?.includes('fourfold ordering image')) {
    failures.push('reduced-motion chapter fallback lost Chapter 4 Self teaching summary');
  }

  await gotoAppRoute(page, '/journey/chapter/ch5');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterFiveFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterFiveReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterFiveReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterFiveReferenceCount = await chapterFiveReferenceNodes.count();
  const chapterFivePanelIds = await chapterFiveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterFivePauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterFiveCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterFiveFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterFiveInstrumentCount = await page.locator('.christ-symbol-instrument').count();
  const chapterFiveInstrumentMotion = await page.locator('.christ-symbol-instrument__field, .christ-symbol-instrument__ring, .christ-symbol-instrument__axis, .christ-symbol-instrument__connector, .christ-symbol-instrument__point, .christ-symbol-instrument__root').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterFiveAnimatedParts = chapterFiveInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterFiveTransitioningParts = chapterFiveInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterFiveFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 5 scene');
  if (chapterFiveReducedMotionAttribute !== 'true') failures.push('Chapter 5 did not record reduced-motion state');
  if (chapterFiveReferenceCount !== 3) failures.push(`reduced-motion Chapter 5 reference node count mismatch: ${chapterFiveReferenceCount}`);
  if (chapterFivePanelIds.join(',') !== 'cross,fourth,tree') failures.push(`reduced-motion Chapter 5 reference nodes out of order: ${chapterFivePanelIds.join(',')}`);
  if (chapterFivePauseControlCount !== 0) failures.push(`reduced-motion Chapter 5 rendered pause controls: ${chapterFivePauseControlCount}`);
  if (chapterFiveCanvasCount !== 0) failures.push(`reduced-motion Chapter 5 rendered canvas: ${chapterFiveCanvasCount}`);
  if (chapterFiveInstrumentCount !== 1) failures.push(`reduced-motion Chapter 5 Christ symbol instrument count mismatch: ${chapterFiveInstrumentCount}`);
  if (chapterFiveAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 5 Christ symbol instrument still animates: ${JSON.stringify(chapterFiveAnimatedParts)}`);
  if (chapterFiveTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 5 Christ symbol instrument still transitions: ${JSON.stringify(chapterFiveTransitioningParts)}`);
  if (!chapterFiveFallbackText?.includes('luminous cross') || !chapterFiveFallbackText?.includes('excluded fourth')) {
    failures.push('reduced-motion chapter fallback lost Chapter 5 Christ symbol teaching summary');
  }

  await gotoAppRoute(page, '/journey/chapter/ch6');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterSixFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterSixReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterSixReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterSixReferenceCount = await chapterSixReferenceNodes.count();
  const chapterSixPanelIds = await chapterSixReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterSixPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterSixCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterSixFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterSixInstrumentCount = await page.locator('.aeon-fish-instrument').count();
  const chapterSixInstrumentMotion = await page.locator('.aeon-fish-instrument__field, .aeon-fish-instrument__ring, .aeon-fish-instrument__sign, .aeon-fish-instrument__thread, .aeon-fish-instrument__fish, .aeon-fish-instrument__hand, .aeon-fish-instrument__threshold').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterSixAnimatedParts = chapterSixInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterSixTransitioningParts = chapterSixInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterSixFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 6 scene');
  if (chapterSixReducedMotionAttribute !== 'true') failures.push('Chapter 6 did not record reduced-motion state');
  if (chapterSixReferenceCount !== 3) failures.push(`reduced-motion Chapter 6 reference node count mismatch: ${chapterSixReferenceCount}`);
  if (chapterSixPanelIds.join(',') !== 'fish,zodiac,transition') failures.push(`reduced-motion Chapter 6 reference nodes out of order: ${chapterSixPanelIds.join(',')}`);
  if (chapterSixPauseControlCount !== 0) failures.push(`reduced-motion Chapter 6 rendered pause controls: ${chapterSixPauseControlCount}`);
  if (chapterSixCanvasCount !== 0) failures.push(`reduced-motion Chapter 6 rendered canvas: ${chapterSixCanvasCount}`);
  if (chapterSixInstrumentCount !== 1) failures.push(`reduced-motion Chapter 6 aeon fish instrument count mismatch: ${chapterSixInstrumentCount}`);
  if (chapterSixAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 6 aeon fish instrument still animates: ${JSON.stringify(chapterSixAnimatedParts)}`);
  if (chapterSixTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 6 aeon fish instrument still transitions: ${JSON.stringify(chapterSixTransitioningParts)}`);
  if (!chapterSixFallbackText?.includes('Opposing fish') || !chapterSixFallbackText?.includes('zodiacal time')) {
    failures.push('reduced-motion chapter fallback lost Chapter 6 fish/aeon teaching summary');
  }

  await gotoAppRoute(page, '/journey/chapter/ch7');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterSevenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterSevenReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterSevenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterSevenReferenceCount = await chapterSevenReferenceNodes.count();
  const chapterSevenPanelIds = await chapterSevenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterSevenPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterSevenCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterSevenFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterSevenInstrumentCount = await page.locator('.prophecy-field-instrument').count();
  const chapterSevenInstrumentMotion = await page.locator('.prophecy-field-instrument__field, .prophecy-field-instrument__axis, .prophecy-field-instrument__tick, .prophecy-field-instrument__pressure, .prophecy-field-instrument__date, .prophecy-field-instrument__image, .prophecy-field-instrument__arc, .prophecy-field-instrument__threshold, .prophecy-field-instrument__mirror').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterSevenAnimatedParts = chapterSevenInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterSevenTransitioningParts = chapterSevenInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterSevenFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 7 scene');
  if (chapterSevenReducedMotionAttribute !== 'true') failures.push('Chapter 7 did not record reduced-motion state');
  if (chapterSevenReferenceCount !== 3) failures.push(`reduced-motion Chapter 7 reference node count mismatch: ${chapterSevenReferenceCount}`);
  if (chapterSevenPanelIds.join(',') !== 'prophecy,collective,threshold') failures.push(`reduced-motion Chapter 7 reference nodes out of order: ${chapterSevenPanelIds.join(',')}`);
  if (chapterSevenPauseControlCount !== 0) failures.push(`reduced-motion Chapter 7 rendered pause controls: ${chapterSevenPauseControlCount}`);
  if (chapterSevenCanvasCount !== 0) failures.push(`reduced-motion Chapter 7 rendered canvas: ${chapterSevenCanvasCount}`);
  if (chapterSevenInstrumentCount !== 1) failures.push(`reduced-motion Chapter 7 prophecy field instrument count mismatch: ${chapterSevenInstrumentCount}`);
  if (chapterSevenAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 7 prophecy field instrument still animates: ${JSON.stringify(chapterSevenAnimatedParts)}`);
  if (chapterSevenTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 7 prophecy field instrument still transitions: ${JSON.stringify(chapterSevenTransitioningParts)}`);
  if (!chapterSevenFallbackText?.includes('collective anxiety') || !chapterSevenFallbackText?.includes('symbolic dates')) {
    failures.push('reduced-motion chapter fallback lost Chapter 7 prophecy teaching summary');
  }

  await gotoAppRoute(page, '/journey/chapter/ch8');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterEightFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterEightReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterEightReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterEightReferenceCount = await chapterEightReferenceNodes.count();
  const chapterEightPanelIds = await chapterEightReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterEightPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterEightCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterEightAnnotationCount = await page.locator('.ch8-annotations').count();
  const chapterEightFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterEightInstrumentCount = await page.locator('.historical-strata-instrument').count();
  const chapterEightInstrumentMotion = await page.locator('.historical-strata-instrument__field, .historical-strata-instrument__axis, .historical-strata-instrument__layer, .historical-strata-instrument__sediment, .historical-strata-instrument__thread, .historical-strata-instrument__fish, .historical-strata-instrument__carrier, .historical-strata-instrument__depth').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterEightAnimatedParts = chapterEightInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterEightTransitioningParts = chapterEightInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterEightFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 8 scene');
  if (chapterEightReducedMotionAttribute !== 'true') failures.push('Chapter 8 did not record reduced-motion state');
  if (chapterEightReferenceCount !== 3) failures.push(`reduced-motion Chapter 8 reference node count mismatch: ${chapterEightReferenceCount}`);
  if (chapterEightPanelIds.join(',') !== 'strata,christian,modern') failures.push(`reduced-motion Chapter 8 reference nodes out of order: ${chapterEightPanelIds.join(',')}`);
  if (chapterEightPauseControlCount !== 0) failures.push(`reduced-motion Chapter 8 rendered pause controls: ${chapterEightPauseControlCount}`);
  if (chapterEightCanvasCount !== 0) failures.push(`reduced-motion Chapter 8 rendered canvas: ${chapterEightCanvasCount}`);
  if (chapterEightAnnotationCount !== 0) failures.push(`reduced-motion Chapter 8 rendered annotation overlay: ${chapterEightAnnotationCount}`);
  if (chapterEightInstrumentCount !== 1) failures.push(`reduced-motion Chapter 8 historical strata instrument count mismatch: ${chapterEightInstrumentCount}`);
  if (chapterEightAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 8 historical strata instrument still animates: ${JSON.stringify(chapterEightAnimatedParts)}`);
  if (chapterEightTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 8 historical strata instrument still transitions: ${JSON.stringify(chapterEightTransitioningParts)}`);
  if (!chapterEightFallbackText?.includes('Layered historical strata') || !chapterEightFallbackText?.includes('fish motif')) {
    failures.push('reduced-motion chapter fallback lost Chapter 8 historical strata teaching summary');
  }
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
  try {
    await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 30_000 });
  } catch (error) {
    throw new Error(`main#main-content did not become visible after chapter jump: ${error.message}`);
  }
  await page.waitForFunction(() => document.querySelector('#chapter-jump-select')?.value === 'ch3', null, { timeout: 10_000 }).catch(() => {});

  const selectValue = await page.locator('#chapter-jump-select').inputValue();
  const previousVisible = await page.locator('.chapter-jump__sequence a[aria-label^="Previous chapter"]').isVisible();
  const nextVisible = await page.locator('.chapter-jump__sequence a[aria-label^="Next chapter"]').isVisible();

  if (selectValue !== 'ch3') failures.push(`chapter jump did not hold active value: ${selectValue}`);
  if (!previousVisible) failures.push('chapter route missing previous chapter control');
  if (!nextVisible) failures.push('chapter route missing next chapter control');
}

async function activateSceneButton(locator) {
  await locator.waitFor({ state: 'visible', timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await locator.click({ timeout: 30_000 });
}

async function smokeChapterSceneControls(page, failures) {
  await gotoAppRoute(page, '/journey/chapter/ch1');
  const chapterOneReferenceCount = await page.locator('.chapter-stage__reference-node').count();
  if (chapterOneReferenceCount !== 3) failures.push(`chapter 1 reference node count mismatch: ${chapterOneReferenceCount}`);

  const pauseAnimation = page.getByRole('button', { name: /Pause animation/ });
  await activateSceneButton(pauseAnimation);
  await page.waitForTimeout(5_400);
  const paused = await page.getByRole('button', { name: /Resume animation/ }).getAttribute('aria-pressed');
  const pausedAnnotationCount = await page.locator('.ch1-a.vis').count();
  if (paused !== 'true') failures.push(`chapter animation pause control did not stay pressed: ${paused}`);
  if (pausedAnnotationCount !== 0) failures.push(`chapter animation pause allowed timed annotations to reveal: ${pausedAnnotationCount}`);
  await activateSceneButton(page.getByRole('button', { name: /Resume animation/ }));

  const rootsReference = page.locator('.chapter-stage__reference-node[data-panel-id="roots"]');
  await activateSceneButton(rootsReference);
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
  await activateSceneButton(wholeness);
  await page.waitForTimeout(250);

  const pressed = await wholeness.getAttribute('aria-pressed');
  const scrollY = await page.evaluate(() => window.scrollY);
  const sceneDescription = await page.locator('#scene-host-description-ch1').textContent();
  if (pressed !== 'true') failures.push(`chapter scene control did not become active: ${pressed}`);
  if (scrollY > 10) failures.push(`chapter scene control unexpectedly scrolled page: ${scrollY}`);
  if (!sceneDescription?.includes('The Self holds the field')) failures.push(`chapter 1 scene description did not follow active panel: ${sceneDescription}`);

  await page.evaluate(() => window.localStorage.removeItem('aion:scene-animation-paused'));
  await gotoAppRoute(page, '/journey/chapter/ch2');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterTwoReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterTwoReferenceCount = await chapterTwoReferenceNodes.count();
  const chapterTwoPanelIds = await chapterTwoReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  if (chapterTwoReferenceCount !== 3) failures.push(`chapter 2 reference node count mismatch: ${chapterTwoReferenceCount}`);
  if (chapterTwoPanelIds.join(',') !== 'mirror,projection,integration') failures.push(`chapter 2 reference nodes out of order: ${chapterTwoPanelIds.join(',')}`);

  const chapterTwoPause = page.getByRole('button', { name: /Pause animation/ });
  await activateSceneButton(chapterTwoPause);
  await page.waitForTimeout(5_400);
  const chapterTwoPaused = await page.getByRole('button', { name: /Resume animation/ }).getAttribute('aria-pressed');
  const chapterTwoPausedAnnotationCount = await page.locator('.ch2-a--ego.vis, .ch2-micro--ego.vis').count();
  if (chapterTwoPaused !== 'true') failures.push(`chapter 2 pause control did not stay pressed: ${chapterTwoPaused}`);
  if (chapterTwoPausedAnnotationCount !== 0) failures.push(`chapter 2 pause allowed timed annotations to reveal: ${chapterTwoPausedAnnotationCount}`);
  await activateSceneButton(page.getByRole('button', { name: /Resume animation/ }));

  const projection = page.locator('.chapter-stage__reference-node[data-panel-id="projection"]');
  await activateSceneButton(projection);
  await page.waitForTimeout(250);

  const projectionPressed = await projection.getAttribute('aria-pressed');
  const projectionPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="projection"]').count();
  const projectionPanelAnnotationVisible = await page.locator('.ch2-a--projection.panel-vis').count();
  const chapterTwoScrollY = await page.evaluate(() => window.scrollY);
  const chapterTwoSceneDescription = await page.locator('#scene-host-description-ch2').textContent();
  if (projectionPressed !== 'true') failures.push(`chapter 2 scene control did not become active: ${projectionPressed}`);
  if (projectionPanelActive !== 1) failures.push(`chapter 2 projection panel did not become active: ${projectionPanelActive}`);
  if (projectionPanelAnnotationVisible !== 1) failures.push(`chapter 2 projection annotation did not follow selected panel: ${projectionPanelAnnotationVisible}`);
  if (chapterTwoScrollY > 10) failures.push(`chapter 2 scene control unexpectedly scrolled page: ${chapterTwoScrollY}`);
  if (!chapterTwoSceneDescription?.includes('Projection: Thrown outward')) failures.push(`chapter 2 scene description did not follow projection panel: ${chapterTwoSceneDescription}`);

  const integration = page.locator('.chapter-stage__reference-node[data-panel-id="integration"]');
  await activateSceneButton(integration);
  await page.waitForFunction(() => document.querySelector('.ch2-a--integration')?.classList.contains('vis'), null, { timeout: 2_000 }).catch(() => {});
  const integrationPressed = await integration.getAttribute('aria-pressed');
  const integrationAnnotationVisible = await page.locator('.ch2-a--integration.vis').count();
  if (integrationPressed !== 'true') failures.push(`chapter 2 integration reference did not become active: ${integrationPressed}`);
  if (integrationAnnotationVisible !== 1) failures.push(`chapter 2 integration annotation did not follow selected panel: ${integrationAnnotationVisible}`);

  const mirror = page.locator('.chapter-stage__reference-node[data-panel-id="mirror"]');
  await activateSceneButton(mirror);
  await page.waitForTimeout(850);
  const integrationAnnotationState = await page.locator('.ch2-a--integration').evaluate((node) => ({
    visible: node.classList.contains('vis'),
    hidden: node.classList.contains('hid'),
  }));
  if (integrationAnnotationState.visible) failures.push('chapter 2 integration annotation stayed visible after returning to mirror panel');
  if (!integrationAnnotationState.hidden) failures.push('chapter 2 integration annotation did not enter hidden state after returning to mirror panel');

  const chapterTwoCanvas = page.locator('.scene-host canvas').first();
  const chapterTwoCanvasBox = await chapterTwoCanvas.boundingBox();
  const chapterTwoPixelSample = await countCanvasPixels(chapterTwoCanvas);
  if (!chapterTwoCanvasBox || chapterTwoCanvasBox.width < 300 || chapterTwoCanvasBox.height < 300) {
    failures.push(`chapter 2 canvas geometry too small: ${chapterTwoCanvasBox ? `${Math.round(chapterTwoCanvasBox.width)}x${Math.round(chapterTwoCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 2', chapterTwoPixelSample);

  await page.evaluate(() => window.localStorage.removeItem('aion:scene-animation-paused'));
  await gotoAppRoute(page, '/journey/chapter/ch3');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterThreeReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterThreeReferenceCount = await chapterThreeReferenceNodes.count();
  const chapterThreePanelIds = await chapterThreeReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  if (chapterThreeReferenceCount !== 3) failures.push(`chapter 3 reference node count mismatch: ${chapterThreeReferenceCount}`);
  if (chapterThreePanelIds.join(',') !== 'pair,orbit,union') failures.push(`chapter 3 reference nodes out of order: ${chapterThreePanelIds.join(',')}`);

  const chapterThreePause = page.getByRole('button', { name: /Pause animation/ });
  await activateSceneButton(chapterThreePause);
  await page.waitForTimeout(5_400);
  const chapterThreePaused = await page.getByRole('button', { name: /Resume animation/ }).getAttribute('aria-pressed');
  const chapterThreePausedAnnotationCount = await page.locator('.ch3-a--anima.vis, .ch3-micro--anima.vis').count();
  if (chapterThreePaused !== 'true') failures.push(`chapter 3 pause control did not stay pressed: ${chapterThreePaused}`);
  if (chapterThreePausedAnnotationCount !== 0) failures.push(`chapter 3 pause allowed timed annotations to reveal: ${chapterThreePausedAnnotationCount}`);
  await activateSceneButton(page.getByRole('button', { name: /Resume animation/ }));

  const orbit = page.locator('.chapter-stage__reference-node[data-panel-id="orbit"]');
  await activateSceneButton(orbit);
  await page.waitForTimeout(250);

  const orbitPressed = await orbit.getAttribute('aria-pressed');
  const orbitPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="orbit"]').count();
  const orbitPanelAnnotationVisible = await page.locator('.ch3-panel-note--orbit.panel-vis').count();
  const orbitAnnotationDisplay = await page.locator('.ch3-panel-note--orbit.panel-vis').evaluate((node) => window.getComputedStyle(node).display).catch(() => 'missing');
  const chapterThreeOrbitScrollY = await page.evaluate(() => window.scrollY);
  const chapterThreeOrbitDescription = await page.locator('#scene-host-description-ch3').textContent();
  if (orbitPressed !== 'true') failures.push(`chapter 3 orbit reference did not become active: ${orbitPressed}`);
  if (orbitPanelActive !== 1) failures.push(`chapter 3 orbit panel did not become active: ${orbitPanelActive}`);
  if (orbitPanelAnnotationVisible !== 1) failures.push(`chapter 3 orbit annotation did not follow selected panel: ${orbitPanelAnnotationVisible}`);
  if (orbitAnnotationDisplay === 'none' || orbitAnnotationDisplay === 'missing') failures.push(`chapter 3 orbit annotation display is not visible: ${orbitAnnotationDisplay}`);
  if (chapterThreeOrbitScrollY > 10) failures.push(`chapter 3 orbit control unexpectedly scrolled page: ${chapterThreeOrbitScrollY}`);
  if (!chapterThreeOrbitDescription?.includes('Relation: Projection becomes orbit')) failures.push(`chapter 3 scene description did not follow orbit panel: ${chapterThreeOrbitDescription}`);

  const conjunction = page.locator('.chapter-stage__reference-node[data-panel-id="union"]');
  await activateSceneButton(conjunction);
  await page.waitForFunction(() => {
    const node = document.querySelector('.ch3-a--conjunction');
    return node?.classList.contains('vis') && Number(window.getComputedStyle(node).opacity) > 0.01;
  }, null, { timeout: 2_000 }).catch(() => {});

  const conjunctionPressed = await conjunction.getAttribute('aria-pressed');
  const conjunctionPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="union"]').count();
  const conjunctionAnnotationState = await page.locator('.ch3-a--conjunction').evaluate((node) => {
    const styles = window.getComputedStyle(node);
    return {
      visible: node.classList.contains('vis'),
      display: styles.display,
      opacity: Number(styles.opacity),
    };
  });
  const chapterThreeUnionScrollY = await page.evaluate(() => window.scrollY);
  const chapterThreeUnionDescription = await page.locator('#scene-host-description-ch3').textContent();
  if (conjunctionPressed !== 'true') failures.push(`chapter 3 union reference did not become active: ${conjunctionPressed}`);
  if (conjunctionPanelActive !== 1) failures.push(`chapter 3 union panel did not become active: ${conjunctionPanelActive}`);
  if (!conjunctionAnnotationState.visible) failures.push('chapter 3 conjunction annotation did not follow selected panel');
  if (conjunctionAnnotationState.display === 'none') failures.push('chapter 3 conjunction annotation is still display none');
  if (conjunctionAnnotationState.opacity <= 0) failures.push(`chapter 3 conjunction annotation opacity stayed hidden: ${conjunctionAnnotationState.opacity}`);
  if (chapterThreeUnionScrollY > 10) failures.push(`chapter 3 union control unexpectedly scrolled page: ${chapterThreeUnionScrollY}`);
  if (!chapterThreeUnionDescription?.includes('Conjunction: Union flashes, then moves')) failures.push(`chapter 3 scene description did not follow union panel: ${chapterThreeUnionDescription}`);

  const pair = page.locator('.chapter-stage__reference-node[data-panel-id="pair"]');
  await activateSceneButton(pair);
  await page.waitForTimeout(250);
  const conjunctionHiddenAfterPair = await page.locator('.ch3-a--conjunction').evaluate((node) => ({
    visible: node.classList.contains('vis'),
    hidden: node.classList.contains('hid'),
  }));
  if (conjunctionHiddenAfterPair.visible) failures.push('chapter 3 conjunction annotation stayed visible after returning to pair panel');
  if (!conjunctionHiddenAfterPair.hidden) failures.push('chapter 3 conjunction annotation did not enter hidden state after returning to pair panel');

  const chapterThreeCanvas = page.locator('.scene-host canvas').first();
  const chapterThreeCanvasBox = await chapterThreeCanvas.boundingBox();
  const chapterThreePixelSample = await countCanvasPixels(chapterThreeCanvas);
  if (!chapterThreeCanvasBox || chapterThreeCanvasBox.width < 300 || chapterThreeCanvasBox.height < 300) {
    failures.push(`chapter 3 canvas geometry too small: ${chapterThreeCanvasBox ? `${Math.round(chapterThreeCanvasBox.width)}x${Math.round(chapterThreeCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 3', chapterThreePixelSample);

  await gotoAppRoute(page, '/journey/chapter/ch4');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterFourReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterFourReferenceCount = await chapterFourReferenceNodes.count();
  const chapterFourPanelIds = await chapterFourReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterFourQuaternityGlyphs = await page.locator('.chapter-stage__reference-node[data-panel-id="quaternity"] .chapter-stage__reference-quadrant').count();
  const chapterFourPanelQuaternityPoints = await page.locator('.chapter-panel[data-panel-id="quaternity"] .chapter-panel__quaternity-point').count();
  const chapterFourPanelMandalaBands = await page.locator('.chapter-panel[data-panel-id="mandala"] .chapter-panel__mandala-band').count();
  const chapterFourInstrument = page.locator('.self-mandala-instrument');
  const chapterFourInstrumentCount = await chapterFourInstrument.count();
  const chapterFourInstrumentLabel = await chapterFourInstrument.getAttribute('aria-label');
  const chapterFourInstrumentPanel = await chapterFourInstrument.getAttribute('data-active-panel');
  const chapterFourInstrumentMarksVisible = await page.locator('.self-mandala-instrument__ring, .self-mandala-instrument__axis, .self-mandala-instrument__point, .self-mandala-instrument__center').evaluateAll((nodes) => nodes.length >= 10 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterFourQuaternityGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="quaternity"] .chapter-stage__reference-quadrant').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterFourPanelGlyphsVisible = await page.locator('.chapter-panel[data-panel-id="quaternity"] .chapter-panel__quaternity-point, .chapter-panel[data-panel-id="mandala"] .chapter-panel__mandala-band').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));

  if (chapterFourReferenceCount !== 3) failures.push(`chapter 4 reference node count mismatch: ${chapterFourReferenceCount}`);
  if (chapterFourPanelIds.join(',') !== 'seed,quaternity,mandala') failures.push(`chapter 4 reference nodes out of order: ${chapterFourPanelIds.join(',')}`);
  if (chapterFourQuaternityGlyphs !== 4) failures.push(`chapter 4 reference quaternity glyph count mismatch: ${chapterFourQuaternityGlyphs}`);
  if (chapterFourPanelQuaternityPoints !== 4) failures.push(`chapter 4 panel quaternity point count mismatch: ${chapterFourPanelQuaternityPoints}`);
  if (chapterFourPanelMandalaBands !== 3) failures.push(`chapter 4 panel mandala band count mismatch: ${chapterFourPanelMandalaBands}`);
  if (chapterFourInstrumentCount !== 1) failures.push(`chapter 4 Self mandala instrument count mismatch: ${chapterFourInstrumentCount}`);
  if (!chapterFourInstrumentLabel?.includes('Self mandala model')) failures.push(`chapter 4 Self mandala instrument label missing teaching text: ${chapterFourInstrumentLabel}`);
  if (chapterFourInstrumentPanel !== 'seed') failures.push(`chapter 4 Self mandala instrument did not start on seed panel: ${chapterFourInstrumentPanel}`);
  if (!chapterFourInstrumentMarksVisible) failures.push('chapter 4 Self mandala instrument marks are not visibly rendered');
  if (!chapterFourQuaternityGlyphsVisible) failures.push('chapter 4 reference quaternity glyphs are not visibly rendered');
  if (!chapterFourPanelGlyphsVisible) failures.push('chapter 4 panel quaternity/mandala glyphs are not visibly rendered');

  const quaternity = page.locator('.chapter-stage__reference-node[data-panel-id="quaternity"]');
  await activateSceneButton(quaternity);
  await page.waitForTimeout(250);

  const quaternityPressed = await quaternity.getAttribute('aria-pressed');
  const quaternityPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="quaternity"]').count();
  const chapterFourQuaternityDescription = await page.locator('#scene-host-description-ch4').textContent();
  const chapterFourInstrumentQuaternityPanel = await chapterFourInstrument.getAttribute('data-active-panel');
  if (quaternityPressed !== 'true') failures.push(`chapter 4 quaternity reference did not become active: ${quaternityPressed}`);
  if (quaternityPanelActive !== 1) failures.push(`chapter 4 quaternity panel did not become active: ${quaternityPanelActive}`);
  if (chapterFourInstrumentQuaternityPanel !== 'quaternity') failures.push(`chapter 4 Self mandala instrument did not follow quaternity panel: ${chapterFourInstrumentQuaternityPanel}`);
  if (!chapterFourQuaternityDescription?.includes('Fourfold: Wholeness takes four directions')) {
    failures.push(`chapter 4 scene description did not follow quaternity panel: ${chapterFourQuaternityDescription}`);
  }

  const mandala = page.locator('.chapter-stage__reference-node[data-panel-id="mandala"]');
  await activateSceneButton(mandala);
  await page.waitForTimeout(250);

  const mandalaPressed = await mandala.getAttribute('aria-pressed');
  const mandalaPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="mandala"]').count();
  const chapterFourMandalaDescription = await page.locator('#scene-host-description-ch4').textContent();
  const chapterFourScrollY = await page.evaluate(() => window.scrollY);
  const chapterFourInstrumentMandalaPanel = await chapterFourInstrument.getAttribute('data-active-panel');
  if (mandalaPressed !== 'true') failures.push(`chapter 4 scene control did not become active: ${mandalaPressed}`);
  if (mandalaPanelActive !== 1) failures.push(`chapter 4 mandala panel did not become active: ${mandalaPanelActive}`);
  if (chapterFourInstrumentMandalaPanel !== 'mandala') failures.push(`chapter 4 Self mandala instrument did not follow mandala panel: ${chapterFourInstrumentMandalaPanel}`);
  if (!chapterFourMandalaDescription?.includes('Mandala: Chaos receives a form')) failures.push(`chapter 4 scene description did not follow mandala panel: ${chapterFourMandalaDescription}`);
  if (chapterFourScrollY > 10) failures.push(`chapter 4 scene control unexpectedly scrolled page: ${chapterFourScrollY}`);

  const chapterFourCanvas = page.locator('.scene-host canvas').first();
  const chapterFourCanvasBox = await chapterFourCanvas.boundingBox();
  const chapterFourPixelSample = await countCanvasPixels(chapterFourCanvas);
  if (!chapterFourCanvasBox || chapterFourCanvasBox.width < 300 || chapterFourCanvasBox.height < 300) {
    failures.push(`chapter 4 canvas geometry too small: ${chapterFourCanvasBox ? `${Math.round(chapterFourCanvasBox.width)}x${Math.round(chapterFourCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 4', chapterFourPixelSample);

  await gotoAppRoute(page, '/journey/chapter/ch5');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterFiveReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterFiveReferenceCount = await chapterFiveReferenceNodes.count();
  const chapterFivePanelIds = await chapterFiveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterFiveFourthGlyphs = await page.locator('.chapter-stage__reference-node[data-panel-id="fourth"] .chapter-stage__reference-quadrant').count();
  const chapterFivePanelGemPoints = await page.locator('.chapter-panel[data-panel-id="fourth"] .chapter-panel__quaternity-point').count();
  const chapterFivePanelBands = await page.locator('.chapter-panel[data-panel-id="fourth"] .chapter-panel__mandala-band').count();
  const chapterFiveTreeRoots = await page.locator('.chapter-panel[data-panel-id="tree"] .chapter-panel__root-line').count();
  const chapterFiveInstrument = page.locator('.christ-symbol-instrument');
  const chapterFiveInstrumentCount = await chapterFiveInstrument.count();
  const chapterFiveInstrumentRole = await chapterFiveInstrument.getAttribute('role');
  const chapterFiveInstrumentLabel = await chapterFiveInstrument.getAttribute('aria-label');
  const chapterFiveInstrumentPanel = await chapterFiveInstrument.getAttribute('data-active-panel');
  const chapterFiveInstrumentFieldCount = await page.locator('.christ-symbol-instrument__field').count();
  const chapterFiveInstrumentRingCount = await page.locator('.christ-symbol-instrument__ring').count();
  const chapterFiveInstrumentAxisCount = await page.locator('.christ-symbol-instrument__axis').count();
  const chapterFiveInstrumentConnectorCount = await page.locator('.christ-symbol-instrument__connector').count();
  const chapterFiveInstrumentPointCount = await page.locator('.christ-symbol-instrument__point').count();
  const chapterFiveInstrumentRootCount = await page.locator('.christ-symbol-instrument__root').count();
  const chapterFiveInstrumentLabelCount = await page.locator('.christ-symbol-instrument__label').count();
  const chapterFiveInstrumentMarksVisible = await page.locator('.christ-symbol-instrument__field, .christ-symbol-instrument__ring, .christ-symbol-instrument__axis, .christ-symbol-instrument__connector, .christ-symbol-instrument__point, .christ-symbol-instrument__root').evaluateAll((nodes) => nodes.length >= 17 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterFiveReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="fourth"] .chapter-stage__reference-quadrant').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterFivePanelGlyphsVisible = await page.locator('.chapter-panel[data-panel-id="fourth"] .chapter-panel__quaternity-point, .chapter-panel[data-panel-id="tree"] .chapter-panel__root-line').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));

  if (chapterFiveReferenceCount !== 3) failures.push(`chapter 5 reference node count mismatch: ${chapterFiveReferenceCount}`);
  if (chapterFivePanelIds.join(',') !== 'cross,fourth,tree') failures.push(`chapter 5 reference nodes out of order: ${chapterFivePanelIds.join(',')}`);
  if (chapterFiveFourthGlyphs !== 4) failures.push(`chapter 5 reference excluded-fourth glyph count mismatch: ${chapterFiveFourthGlyphs}`);
  if (chapterFivePanelGemPoints !== 4) failures.push(`chapter 5 panel gem point count mismatch: ${chapterFivePanelGemPoints}`);
  if (chapterFivePanelBands !== 3) failures.push(`chapter 5 panel ring band count mismatch: ${chapterFivePanelBands}`);
  if (chapterFiveTreeRoots !== 3) failures.push(`chapter 5 tree root line count mismatch: ${chapterFiveTreeRoots}`);
  if (chapterFiveInstrumentCount !== 1) failures.push(`chapter 5 Christ symbol instrument count mismatch: ${chapterFiveInstrumentCount}`);
  if (chapterFiveInstrumentFieldCount !== 2) failures.push(`chapter 5 Christ symbol instrument field count mismatch: ${chapterFiveInstrumentFieldCount}`);
  if (chapterFiveInstrumentRingCount !== 2) failures.push(`chapter 5 Christ symbol instrument ring count mismatch: ${chapterFiveInstrumentRingCount}`);
  if (chapterFiveInstrumentAxisCount !== 2) failures.push(`chapter 5 Christ symbol instrument axis count mismatch: ${chapterFiveInstrumentAxisCount}`);
  if (chapterFiveInstrumentConnectorCount !== 4) failures.push(`chapter 5 Christ symbol instrument connector count mismatch: ${chapterFiveInstrumentConnectorCount}`);
  if (chapterFiveInstrumentPointCount !== 4) failures.push(`chapter 5 Christ symbol instrument point count mismatch: ${chapterFiveInstrumentPointCount}`);
  if (chapterFiveInstrumentRootCount !== 3) failures.push(`chapter 5 Christ symbol instrument root count mismatch: ${chapterFiveInstrumentRootCount}`);
  if (chapterFiveInstrumentLabelCount !== 3) failures.push(`chapter 5 Christ symbol instrument label count mismatch: ${chapterFiveInstrumentLabelCount}`);
  if (chapterFiveInstrumentRole !== 'img') failures.push(`chapter 5 Christ symbol instrument role mismatch: ${chapterFiveInstrumentRole}`);
  if (!chapterFiveInstrumentLabel?.includes('Christ symbol') || !chapterFiveInstrumentLabel?.includes('Self') || !chapterFiveInstrumentLabel?.includes('excluded fourth') || !chapterFiveInstrumentLabel?.includes('one-sided') || !chapterFiveInstrumentLabel?.includes('Current emphasis: Cross')) {
    failures.push(`chapter 5 Christ symbol instrument label missing teaching text: ${chapterFiveInstrumentLabel}`);
  }
  if (chapterFiveInstrumentPanel !== 'cross') failures.push(`chapter 5 Christ symbol instrument did not start on cross panel: ${chapterFiveInstrumentPanel}`);
  if (!chapterFiveInstrumentMarksVisible) failures.push('chapter 5 Christ symbol instrument marks are not visibly rendered');
  if (!chapterFiveReferenceGlyphsVisible) failures.push('chapter 5 reference fourth glyphs are not visibly rendered');
  if (!chapterFivePanelGlyphsVisible) failures.push('chapter 5 panel fourth/tree glyphs are not visibly rendered');

  const fourth = page.locator('.chapter-stage__reference-node[data-panel-id="fourth"]');
  await fourth.waitFor({ state: 'visible', timeout: 30_000 });
  await fourth.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await fourth.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('.christ-symbol-instrument__connector--broken, .christ-symbol-instrument__point--fourth'));
    return nodes.length === 2 && nodes.every((node) => Number(window.getComputedStyle(node).opacity) >= 0.95);
  }, null, { timeout: 3_000 }).catch(() => {});

  const fourthPressed = await fourth.getAttribute('aria-pressed');
  const fourthPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="fourth"]').count();
  const chapterFiveFourthDescription = await page.locator('#scene-host-description-ch5').textContent();
  const chapterFiveInstrumentFourthPanel = await chapterFiveInstrument.getAttribute('data-active-panel');
  const chapterFiveInstrumentFourthLabel = await chapterFiveInstrument.getAttribute('aria-label');
  const chapterFiveFourthVisualState = await page.locator('.christ-symbol-instrument__connector--broken, .christ-symbol-instrument__point--fourth').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return Number(styles.opacity);
  }));
  if (fourthPressed !== 'true') failures.push(`chapter 5 fourth reference did not become active: ${fourthPressed}`);
  if (fourthPanelActive !== 1) failures.push(`chapter 5 fourth panel did not become active: ${fourthPanelActive}`);
  if (chapterFiveInstrumentFourthPanel !== 'fourth') failures.push(`chapter 5 Christ symbol instrument did not follow fourth panel: ${chapterFiveInstrumentFourthPanel}`);
  if (!chapterFiveInstrumentFourthLabel?.includes('Current emphasis: Fourth') || !chapterFiveInstrumentFourthLabel?.includes('The fourth is missing')) {
    failures.push(`chapter 5 Christ symbol instrument label did not follow fourth panel: ${chapterFiveInstrumentFourthLabel}`);
  }
  if (chapterFiveFourthVisualState.length !== 2 || chapterFiveFourthVisualState.some((opacity) => opacity < 0.95)) {
    failures.push(`chapter 5 Christ symbol instrument did not visually emphasize the fourth: ${chapterFiveFourthVisualState.join(',')}`);
  }
  if (!chapterFiveFourthDescription?.includes('Fourth: The fourth is missing')) {
    failures.push(`chapter 5 scene description did not follow fourth panel: ${chapterFiveFourthDescription}`);
  }

  const tree = page.locator('.chapter-stage__reference-node[data-panel-id="tree"]');
  await tree.waitFor({ state: 'visible', timeout: 30_000 });
  await tree.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await tree.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('.christ-symbol-instrument__root'));
    return nodes.length === 3 && nodes.every((node) => Number(window.getComputedStyle(node).opacity) >= 0.9);
  }, null, { timeout: 3_000 }).catch(() => {});

  const treePressed = await tree.getAttribute('aria-pressed');
  const treePanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="tree"]').count();
  const chapterFiveTreeDescription = await page.locator('#scene-host-description-ch5').textContent();
  const chapterFiveScrollY = await page.evaluate(() => window.scrollY);
  const chapterFiveInstrumentTreePanel = await chapterFiveInstrument.getAttribute('data-active-panel');
  const chapterFiveInstrumentTreeLabel = await chapterFiveInstrument.getAttribute('aria-label');
  const chapterFiveTreeVisualState = await page.locator('.christ-symbol-instrument__root').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (treePressed !== 'true') failures.push(`chapter 5 tree reference did not become active: ${treePressed}`);
  if (treePanelActive !== 1) failures.push(`chapter 5 tree panel did not become active: ${treePanelActive}`);
  if (chapterFiveInstrumentTreePanel !== 'tree') failures.push(`chapter 5 Christ symbol instrument did not follow tree panel: ${chapterFiveInstrumentTreePanel}`);
  if (!chapterFiveInstrumentTreeLabel?.includes('Current emphasis: Root') || !chapterFiveInstrumentTreeLabel?.includes('The roots go downward')) {
    failures.push(`chapter 5 Christ symbol instrument label did not follow tree panel: ${chapterFiveInstrumentTreeLabel}`);
  }
  if (chapterFiveTreeVisualState.length !== 3 || chapterFiveTreeVisualState.some((opacity) => opacity < 0.9)) {
    failures.push(`chapter 5 Christ symbol instrument did not visually emphasize roots: ${chapterFiveTreeVisualState.join(',')}`);
  }
  if (!chapterFiveTreeDescription?.includes('Root: The roots go downward')) failures.push(`chapter 5 scene description did not follow tree panel: ${chapterFiveTreeDescription}`);
  if (chapterFiveScrollY > 10) failures.push(`chapter 5 scene control unexpectedly scrolled page: ${chapterFiveScrollY}`);

  const chapterFiveCanvas = page.locator('.scene-host canvas').first();
  const chapterFiveCanvasBox = await chapterFiveCanvas.boundingBox();
  const chapterFivePixelSample = await countCanvasPixels(chapterFiveCanvas);
  if (!chapterFiveCanvasBox || chapterFiveCanvasBox.width < 300 || chapterFiveCanvasBox.height < 300) {
    failures.push(`chapter 5 canvas geometry too small: ${chapterFiveCanvasBox ? `${Math.round(chapterFiveCanvasBox.width)}x${Math.round(chapterFiveCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 5', chapterFivePixelSample);

  await gotoAppRoute(page, '/journey/chapter/ch6');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterSixReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterSixReferenceCount = await chapterSixReferenceNodes.count();
  const chapterSixPanelIds = await chapterSixReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterSixInstrument = page.locator('.aeon-fish-instrument');
  const chapterSixInstrumentCount = await chapterSixInstrument.count();
  const chapterSixInstrumentRole = await chapterSixInstrument.getAttribute('role');
  const chapterSixInstrumentLabel = await chapterSixInstrument.getAttribute('aria-label');
  const chapterSixInstrumentPanel = await chapterSixInstrument.getAttribute('data-active-panel');
  const chapterSixInstrumentFieldCount = await page.locator('.aeon-fish-instrument__field').count();
  const chapterSixInstrumentRingCount = await page.locator('.aeon-fish-instrument__ring').count();
  const chapterSixInstrumentSignCount = await page.locator('.aeon-fish-instrument__sign').count();
  const chapterSixInstrumentFishCount = await page.locator('.aeon-fish-instrument__fish').count();
  const chapterSixInstrumentThreadCount = await page.locator('.aeon-fish-instrument__thread').count();
  const chapterSixInstrumentHandCount = await page.locator('.aeon-fish-instrument__hand').count();
  const chapterSixInstrumentThresholdCount = await page.locator('.aeon-fish-instrument__threshold').count();
  const chapterSixInstrumentLabelCount = await page.locator('.aeon-fish-instrument__label').count();
  const chapterSixInstrumentMarksVisible = await page.locator('.aeon-fish-instrument__field, .aeon-fish-instrument__ring, .aeon-fish-instrument__sign, .aeon-fish-instrument__thread, .aeon-fish-instrument__fish, .aeon-fish-instrument__hand, .aeon-fish-instrument__threshold').evaluateAll((nodes) => nodes.length >= 21 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterSixReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="fish"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="zodiac"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="transition"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));

  if (chapterSixReferenceCount !== 3) failures.push(`chapter 6 reference node count mismatch: ${chapterSixReferenceCount}`);
  if (chapterSixPanelIds.join(',') !== 'fish,zodiac,transition') failures.push(`chapter 6 reference nodes out of order: ${chapterSixPanelIds.join(',')}`);
  if (chapterSixInstrumentCount !== 1) failures.push(`chapter 6 aeon fish instrument count mismatch: ${chapterSixInstrumentCount}`);
  if (chapterSixInstrumentFieldCount !== 2) failures.push(`chapter 6 aeon fish instrument field count mismatch: ${chapterSixInstrumentFieldCount}`);
  if (chapterSixInstrumentRingCount !== 2) failures.push(`chapter 6 aeon fish instrument ring count mismatch: ${chapterSixInstrumentRingCount}`);
  if (chapterSixInstrumentSignCount !== 12) failures.push(`chapter 6 aeon fish instrument sign count mismatch: ${chapterSixInstrumentSignCount}`);
  if (chapterSixInstrumentFishCount !== 2) failures.push(`chapter 6 aeon fish instrument fish count mismatch: ${chapterSixInstrumentFishCount}`);
  if (chapterSixInstrumentThreadCount !== 1) failures.push(`chapter 6 aeon fish instrument thread count mismatch: ${chapterSixInstrumentThreadCount}`);
  if (chapterSixInstrumentHandCount !== 1) failures.push(`chapter 6 aeon fish instrument hand count mismatch: ${chapterSixInstrumentHandCount}`);
  if (chapterSixInstrumentThresholdCount !== 1) failures.push(`chapter 6 aeon fish instrument threshold count mismatch: ${chapterSixInstrumentThresholdCount}`);
  if (chapterSixInstrumentLabelCount !== 3) failures.push(`chapter 6 aeon fish instrument label count mismatch: ${chapterSixInstrumentLabelCount}`);
  if (chapterSixInstrumentRole !== 'img') failures.push(`chapter 6 aeon fish instrument role mismatch: ${chapterSixInstrumentRole}`);
  if (!chapterSixInstrumentLabel?.includes('Sign of the Fishes') || !chapterSixInstrumentLabel?.includes('two Pisces fish') || !chapterSixInstrumentLabel?.includes('zodiac wheel') || !chapterSixInstrumentLabel?.includes('Current emphasis: Pisces')) {
    failures.push(`chapter 6 aeon fish instrument label missing teaching text: ${chapterSixInstrumentLabel}`);
  }
  if (chapterSixInstrumentPanel !== 'fish') failures.push(`chapter 6 aeon fish instrument did not start on fish panel: ${chapterSixInstrumentPanel}`);
  if (!chapterSixInstrumentMarksVisible) failures.push('chapter 6 aeon fish instrument marks are not visibly rendered');
  if (!chapterSixReferenceGlyphsVisible) failures.push('chapter 6 reference glyphs are not visibly rendered');

  const zodiac = page.locator('.chapter-stage__reference-node[data-panel-id="zodiac"]');
  await zodiac.waitFor({ state: 'visible', timeout: 30_000 });
  await zodiac.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await zodiac.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const signs = Array.from(document.querySelectorAll('.aeon-fish-instrument__sign'));
    const hand = document.querySelector('.aeon-fish-instrument__hand');
    return signs.length === 12
      && signs.every((node) => Number(window.getComputedStyle(node).opacity) >= 0.9)
      && hand
      && Number(window.getComputedStyle(hand).opacity) >= 0.95;
  }, null, { timeout: 3_000 }).catch(() => {});

  const zodiacPressed = await zodiac.getAttribute('aria-pressed');
  const zodiacPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="zodiac"]').count();
  const chapterSixZodiacDescription = await page.locator('#scene-host-description-ch6').textContent();
  const chapterSixInstrumentZodiacPanel = await chapterSixInstrument.getAttribute('data-active-panel');
  const chapterSixInstrumentZodiacLabel = await chapterSixInstrument.getAttribute('aria-label');
  const chapterSixZodiacVisualState = await page.locator('.aeon-fish-instrument__sign, .aeon-fish-instrument__hand').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (zodiacPressed !== 'true') failures.push(`chapter 6 zodiac reference did not become active: ${zodiacPressed}`);
  if (zodiacPanelActive !== 1) failures.push(`chapter 6 zodiac panel did not become active: ${zodiacPanelActive}`);
  if (chapterSixInstrumentZodiacPanel !== 'zodiac') failures.push(`chapter 6 aeon fish instrument did not follow zodiac panel: ${chapterSixInstrumentZodiacPanel}`);
  if (!chapterSixInstrumentZodiacLabel?.includes('Current emphasis: Aeon') || !chapterSixInstrumentZodiacLabel?.includes('History gains a wheel')) {
    failures.push(`chapter 6 aeon fish instrument label did not follow zodiac panel: ${chapterSixInstrumentZodiacLabel}`);
  }
  if (chapterSixZodiacVisualState.length !== 13 || chapterSixZodiacVisualState.some((opacity) => opacity < 0.9)) {
    failures.push(`chapter 6 aeon fish instrument did not visually emphasize zodiac wheel: ${chapterSixZodiacVisualState.join(',')}`);
  }
  if (!chapterSixZodiacDescription?.includes('Aeon: History gains a wheel')) failures.push(`chapter 6 scene description did not follow zodiac panel: ${chapterSixZodiacDescription}`);

  const threshold = page.locator('.chapter-stage__reference-node[data-panel-id="transition"]');
  await threshold.waitFor({ state: 'visible', timeout: 30_000 });
  await threshold.scrollIntoViewIfNeeded({ timeout: 10_000 });
  await threshold.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const thresholdLine = document.querySelector('.aeon-fish-instrument__threshold');
    const aquarius = document.querySelector('.aeon-fish-instrument__sign--11');
    return thresholdLine
      && aquarius
      && Number(window.getComputedStyle(thresholdLine).opacity) >= 0.95
      && Number(window.getComputedStyle(aquarius).opacity) >= 0.95;
  }, null, { timeout: 3_000 }).catch(() => {});

  const thresholdPressed = await threshold.getAttribute('aria-pressed');
  const thresholdPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="transition"]').count();
  const chapterSixThresholdDescription = await page.locator('#scene-host-description-ch6').textContent();
  const chapterSixScrollY = await page.evaluate(() => window.scrollY);
  const chapterSixInstrumentThresholdPanel = await chapterSixInstrument.getAttribute('data-active-panel');
  const chapterSixInstrumentThresholdLabel = await chapterSixInstrument.getAttribute('aria-label');
  const chapterSixThresholdVisualState = await page.locator('.aeon-fish-instrument__threshold, .aeon-fish-instrument__sign--11').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (thresholdPressed !== 'true') failures.push(`chapter 6 scene control did not become active: ${thresholdPressed}`);
  if (thresholdPanelActive !== 1) failures.push(`chapter 6 threshold panel did not become active: ${thresholdPanelActive}`);
  if (chapterSixInstrumentThresholdPanel !== 'transition') failures.push(`chapter 6 aeon fish instrument did not follow threshold panel: ${chapterSixInstrumentThresholdPanel}`);
  if (!chapterSixInstrumentThresholdLabel?.includes('Current emphasis: Threshold') || !chapterSixInstrumentThresholdLabel?.includes('The age turns slowly')) {
    failures.push(`chapter 6 aeon fish instrument label did not follow threshold panel: ${chapterSixInstrumentThresholdLabel}`);
  }
  if (chapterSixThresholdVisualState.length !== 2 || chapterSixThresholdVisualState.some((opacity) => opacity < 0.95)) {
    failures.push(`chapter 6 aeon fish instrument did not visually emphasize threshold: ${chapterSixThresholdVisualState.join(',')}`);
  }
  if (!chapterSixThresholdDescription?.includes('Threshold: The age turns slowly')) failures.push(`chapter 6 scene description did not follow threshold panel: ${chapterSixThresholdDescription}`);
  if (chapterSixScrollY > 10) failures.push(`chapter 6 scene control unexpectedly scrolled page: ${chapterSixScrollY}`);

  const chapterSixCanvas = page.locator('.scene-host canvas').first();
  const chapterSixCanvasBox = await chapterSixCanvas.boundingBox();
  const chapterSixPixelSample = await countCanvasPixels(chapterSixCanvas);
  if (!chapterSixCanvasBox || chapterSixCanvasBox.width < 300 || chapterSixCanvasBox.height < 300) {
    failures.push(`chapter 6 canvas geometry too small: ${chapterSixCanvasBox ? `${Math.round(chapterSixCanvasBox.width)}x${Math.round(chapterSixCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 6', chapterSixPixelSample);

  await gotoAppRoute(page, '/journey/chapter/ch7');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterSevenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterSevenReferenceCount = await chapterSevenReferenceNodes.count();
  const chapterSevenPanelIds = await chapterSevenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterSevenInstrument = page.locator('.prophecy-field-instrument');
  const chapterSevenInstrumentCount = await chapterSevenInstrument.count();
  const chapterSevenInstrumentRole = await chapterSevenInstrument.getAttribute('role');
  const chapterSevenInstrumentLabel = await chapterSevenInstrument.getAttribute('aria-label');
  const chapterSevenInstrumentPanel = await chapterSevenInstrument.getAttribute('data-active-panel');
  const chapterSevenInstrumentFieldCount = await page.locator('.prophecy-field-instrument__field').count();
  const chapterSevenInstrumentTickCount = await page.locator('.prophecy-field-instrument__tick').count();
  const chapterSevenInstrumentImageCount = await page.locator('.prophecy-field-instrument__image').count();
  const chapterSevenInstrumentArcCount = await page.locator('.prophecy-field-instrument__arc').count();
  const chapterSevenInstrumentPressureCount = await page.locator('.prophecy-field-instrument__pressure').count();
  const chapterSevenInstrumentDateCount = await page.locator('.prophecy-field-instrument__date').count();
  const chapterSevenInstrumentThresholdCount = await page.locator('.prophecy-field-instrument__threshold').count();
  const chapterSevenInstrumentMirrorCount = await page.locator('.prophecy-field-instrument__mirror').count();
  const chapterSevenInstrumentLabelCount = await page.locator('.prophecy-field-instrument__label').count();
  const chapterSevenInstrumentMarksVisible = await page.locator('.prophecy-field-instrument__field, .prophecy-field-instrument__axis, .prophecy-field-instrument__tick, .prophecy-field-instrument__pressure, .prophecy-field-instrument__date, .prophecy-field-instrument__image, .prophecy-field-instrument__arc, .prophecy-field-instrument__threshold, .prophecy-field-instrument__mirror').evaluateAll((nodes) => nodes.length >= 16 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterSevenReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="prophecy"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="collective"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="threshold"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));

  if (chapterSevenReferenceCount !== 3) failures.push(`chapter 7 reference node count mismatch: ${chapterSevenReferenceCount}`);
  if (chapterSevenPanelIds.join(',') !== 'prophecy,collective,threshold') failures.push(`chapter 7 reference nodes out of order: ${chapterSevenPanelIds.join(',')}`);
  if (chapterSevenInstrumentCount !== 1) failures.push(`chapter 7 prophecy field instrument count mismatch: ${chapterSevenInstrumentCount}`);
  if (chapterSevenInstrumentFieldCount !== 2) failures.push(`chapter 7 prophecy field instrument field count mismatch: ${chapterSevenInstrumentFieldCount}`);
  if (chapterSevenInstrumentTickCount !== 4) failures.push(`chapter 7 prophecy field instrument tick count mismatch: ${chapterSevenInstrumentTickCount}`);
  if (chapterSevenInstrumentImageCount !== 3) failures.push(`chapter 7 prophecy field instrument image count mismatch: ${chapterSevenInstrumentImageCount}`);
  if (chapterSevenInstrumentArcCount !== 2) failures.push(`chapter 7 prophecy field instrument arc count mismatch: ${chapterSevenInstrumentArcCount}`);
  if (chapterSevenInstrumentPressureCount !== 1) failures.push(`chapter 7 prophecy field instrument pressure count mismatch: ${chapterSevenInstrumentPressureCount}`);
  if (chapterSevenInstrumentDateCount !== 1) failures.push(`chapter 7 prophecy field instrument date count mismatch: ${chapterSevenInstrumentDateCount}`);
  if (chapterSevenInstrumentThresholdCount !== 1) failures.push(`chapter 7 prophecy field instrument threshold count mismatch: ${chapterSevenInstrumentThresholdCount}`);
  if (chapterSevenInstrumentMirrorCount !== 1) failures.push(`chapter 7 prophecy field instrument mirror count mismatch: ${chapterSevenInstrumentMirrorCount}`);
  if (chapterSevenInstrumentLabelCount !== 3) failures.push(`chapter 7 prophecy field instrument label count mismatch: ${chapterSevenInstrumentLabelCount}`);
  if (chapterSevenInstrumentRole !== 'img') failures.push(`chapter 7 prophecy field instrument role mismatch: ${chapterSevenInstrumentRole}`);
  if (!chapterSevenInstrumentLabel?.includes('Prophecy field') || !chapterSevenInstrumentLabel?.includes('historical pressure') || !chapterSevenInstrumentLabel?.includes('Current emphasis: Prophecy')) {
    failures.push(`chapter 7 prophecy field instrument label missing teaching text: ${chapterSevenInstrumentLabel}`);
  }
  if (chapterSevenInstrumentPanel !== 'prophecy') failures.push(`chapter 7 prophecy field instrument did not start on prophecy panel: ${chapterSevenInstrumentPanel}`);
  if (!chapterSevenInstrumentMarksVisible) failures.push('chapter 7 prophecy field instrument marks are not visibly rendered');
  if (!chapterSevenReferenceGlyphsVisible) failures.push('chapter 7 reference glyphs are not visibly rendered');

  const chapterSevenCollective = page.locator('.chapter-stage__reference-node[data-panel-id="collective"]');
  await chapterSevenCollective.waitFor({ state: 'visible', timeout: 30_000 });
  await chapterSevenCollective.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('.prophecy-field-instrument__image, .prophecy-field-instrument__arc'));
    return nodes.length === 5 && nodes.every((node) => Number(window.getComputedStyle(node).opacity) >= 0.85);
  }, null, { timeout: 3_000 }).catch(() => {});

  const chapterSevenCollectivePressed = await chapterSevenCollective.getAttribute('aria-pressed');
  const chapterSevenCollectivePanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="collective"]').count();
  const chapterSevenCollectiveDescription = await page.locator('#scene-host-description-ch7').textContent();
  const chapterSevenInstrumentCollectivePanel = await chapterSevenInstrument.getAttribute('data-active-panel');
  const chapterSevenInstrumentCollectiveLabel = await chapterSevenInstrument.getAttribute('aria-label');
  const chapterSevenCollectiveVisualState = await page.locator('.prophecy-field-instrument__image, .prophecy-field-instrument__arc').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (chapterSevenCollectivePressed !== 'true') failures.push(`chapter 7 collective reference did not become active: ${chapterSevenCollectivePressed}`);
  if (chapterSevenCollectivePanelActive !== 1) failures.push(`chapter 7 collective panel did not become active: ${chapterSevenCollectivePanelActive}`);
  if (chapterSevenInstrumentCollectivePanel !== 'collective') failures.push(`chapter 7 prophecy field instrument did not follow collective panel: ${chapterSevenInstrumentCollectivePanel}`);
  if (!chapterSevenInstrumentCollectiveLabel?.includes('Current emphasis: Collective') || !chapterSevenInstrumentCollectiveLabel?.includes('Private fear becomes shared image')) {
    failures.push(`chapter 7 prophecy field instrument label did not follow collective panel: ${chapterSevenInstrumentCollectiveLabel}`);
  }
  if (chapterSevenCollectiveVisualState.length !== 5 || chapterSevenCollectiveVisualState.some((opacity) => opacity < 0.85)) {
    failures.push(`chapter 7 prophecy field instrument did not visually emphasize collective image: ${chapterSevenCollectiveVisualState.join(',')}`);
  }
  if (!chapterSevenCollectiveDescription?.includes('Collective: Private fear becomes shared image')) failures.push(`chapter 7 scene description did not follow collective panel: ${chapterSevenCollectiveDescription}`);

  const chapterSevenThreshold = page.locator('.chapter-stage__reference-node[data-panel-id="threshold"]');
  await chapterSevenThreshold.waitFor({ state: 'visible', timeout: 30_000 });
  await chapterSevenThreshold.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  await page.waitForFunction(() => {
    const nodes = Array.from(document.querySelectorAll('.prophecy-field-instrument__threshold, .prophecy-field-instrument__mirror, .prophecy-field-instrument__tick--4'));
    return nodes.length === 3 && nodes.every((node) => Number(window.getComputedStyle(node).opacity) >= 0.95);
  }, null, { timeout: 3_000 }).catch(() => {});

  const chapterSevenThresholdPressed = await chapterSevenThreshold.getAttribute('aria-pressed');
  const chapterSevenThresholdPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="threshold"]').count();
  const chapterSevenThresholdDescription = await page.locator('#scene-host-description-ch7').textContent();
  const chapterSevenScrollY = await page.evaluate(() => window.scrollY);
  const chapterSevenInstrumentThresholdPanel = await chapterSevenInstrument.getAttribute('data-active-panel');
  const chapterSevenInstrumentThresholdLabel = await chapterSevenInstrument.getAttribute('aria-label');
  const chapterSevenThresholdVisualState = await page.locator('.prophecy-field-instrument__threshold, .prophecy-field-instrument__mirror, .prophecy-field-instrument__tick--4').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (chapterSevenThresholdPressed !== 'true') failures.push(`chapter 7 threshold reference did not become active: ${chapterSevenThresholdPressed}`);
  if (chapterSevenThresholdPanelActive !== 1) failures.push(`chapter 7 threshold panel did not become active: ${chapterSevenThresholdPanelActive}`);
  if (chapterSevenInstrumentThresholdPanel !== 'threshold') failures.push(`chapter 7 prophecy field instrument did not follow threshold panel: ${chapterSevenInstrumentThresholdPanel}`);
  if (!chapterSevenInstrumentThresholdLabel?.includes('Current emphasis: Threshold') || !chapterSevenInstrumentThresholdLabel?.includes('The future looks backward')) {
    failures.push(`chapter 7 prophecy field instrument label did not follow threshold panel: ${chapterSevenInstrumentThresholdLabel}`);
  }
  if (chapterSevenThresholdVisualState.length !== 3 || chapterSevenThresholdVisualState.some((opacity) => opacity < 0.95)) {
    failures.push(`chapter 7 prophecy field instrument did not visually emphasize threshold: ${chapterSevenThresholdVisualState.join(',')}`);
  }
  if (!chapterSevenThresholdDescription?.includes('Threshold: The future looks backward')) failures.push(`chapter 7 scene description did not follow threshold panel: ${chapterSevenThresholdDescription}`);
  if (chapterSevenScrollY > 10) failures.push(`chapter 7 scene control unexpectedly scrolled page: ${chapterSevenScrollY}`);

  const chapterSevenCanvas = page.locator('.scene-host canvas').first();
  const chapterSevenCanvasBox = await chapterSevenCanvas.boundingBox();
  const chapterSevenPixelSample = await countCanvasPixels(chapterSevenCanvas);
  if (!chapterSevenCanvasBox || chapterSevenCanvasBox.width < 300 || chapterSevenCanvasBox.height < 300) {
    failures.push(`chapter 7 canvas geometry too small: ${chapterSevenCanvasBox ? `${Math.round(chapterSevenCanvasBox.width)}x${Math.round(chapterSevenCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 7', chapterSevenPixelSample);

  await gotoAppRoute(page, '/journey/chapter/ch8');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterEightReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterEightReferenceCount = await chapterEightReferenceNodes.count();
  const chapterEightPanelIds = await chapterEightReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterEightInstrument = page.locator('.historical-strata-instrument');
  const chapterEightInstrumentCount = await chapterEightInstrument.count();
  const chapterEightInstrumentRole = await chapterEightInstrument.getAttribute('role');
  const chapterEightInstrumentLabel = await chapterEightInstrument.getAttribute('aria-label');
  const chapterEightInstrumentPanel = await chapterEightInstrument.getAttribute('data-active-panel');
  const chapterEightInstrumentFieldCount = await page.locator('.historical-strata-instrument__field').count();
  const chapterEightInstrumentLayerCount = await page.locator('.historical-strata-instrument__layer').count();
  const chapterEightInstrumentSedimentCount = await page.locator('.historical-strata-instrument__sediment').count();
  const chapterEightInstrumentThreadCount = await page.locator('.historical-strata-instrument__thread').count();
  const chapterEightInstrumentFishCount = await page.locator('.historical-strata-instrument__fish').count();
  const chapterEightInstrumentCarrierCount = await page.locator('.historical-strata-instrument__carrier').count();
  const chapterEightInstrumentDepthCount = await page.locator('.historical-strata-instrument__depth').count();
  const chapterEightInstrumentLabelCount = await page.locator('.historical-strata-instrument__label').count();
  const chapterEightInstrumentMarksVisible = await page.locator('.historical-strata-instrument__field, .historical-strata-instrument__axis, .historical-strata-instrument__layer, .historical-strata-instrument__sediment, .historical-strata-instrument__thread, .historical-strata-instrument__fish, .historical-strata-instrument__carrier, .historical-strata-instrument__depth').evaluateAll((nodes) => nodes.length >= 16 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterEightReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="strata"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="christian"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="modern"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));

  if (chapterEightReferenceCount !== 3) failures.push(`chapter 8 reference node count mismatch: ${chapterEightReferenceCount}`);
  if (chapterEightPanelIds.join(',') !== 'strata,christian,modern') failures.push(`chapter 8 reference nodes out of order: ${chapterEightPanelIds.join(',')}`);
  if (chapterEightInstrumentCount !== 1) failures.push(`chapter 8 historical strata instrument count mismatch: ${chapterEightInstrumentCount}`);
  if (chapterEightInstrumentFieldCount !== 2) failures.push(`chapter 8 historical strata instrument field count mismatch: ${chapterEightInstrumentFieldCount}`);
  if (chapterEightInstrumentLayerCount !== 5) failures.push(`chapter 8 historical strata instrument layer count mismatch: ${chapterEightInstrumentLayerCount}`);
  if (chapterEightInstrumentSedimentCount !== 3) failures.push(`chapter 8 historical strata instrument sediment count mismatch: ${chapterEightInstrumentSedimentCount}`);
  if (chapterEightInstrumentThreadCount !== 2) failures.push(`chapter 8 historical strata instrument thread count mismatch: ${chapterEightInstrumentThreadCount}`);
  if (chapterEightInstrumentFishCount !== 1) failures.push(`chapter 8 historical strata instrument fish count mismatch: ${chapterEightInstrumentFishCount}`);
  if (chapterEightInstrumentCarrierCount !== 1) failures.push(`chapter 8 historical strata instrument carrier count mismatch: ${chapterEightInstrumentCarrierCount}`);
  if (chapterEightInstrumentDepthCount !== 1) failures.push(`chapter 8 historical strata instrument depth count mismatch: ${chapterEightInstrumentDepthCount}`);
  if (chapterEightInstrumentLabelCount !== 3) failures.push(`chapter 8 historical strata instrument label count mismatch: ${chapterEightInstrumentLabelCount}`);
  if (chapterEightInstrumentRole !== 'img') failures.push(`chapter 8 historical strata instrument role mismatch: ${chapterEightInstrumentRole}`);
  if (!chapterEightInstrumentLabel?.includes('Historical strata model') || !chapterEightInstrumentLabel?.includes('fish motif') || !chapterEightInstrumentLabel?.includes('Current emphasis: History')) {
    failures.push(`chapter 8 historical strata instrument label missing teaching text: ${chapterEightInstrumentLabel}`);
  }
  if (chapterEightInstrumentPanel !== 'strata') failures.push(`chapter 8 historical strata instrument did not start on strata panel: ${chapterEightInstrumentPanel}`);
  if (!chapterEightInstrumentMarksVisible) failures.push('chapter 8 historical strata instrument marks are not visibly rendered');
  if (!chapterEightReferenceGlyphsVisible) failures.push('chapter 8 reference glyphs are not visibly rendered');

  const earlyImage = page.locator('.chapter-stage__reference-node[data-panel-id="christian"]');
  await earlyImage.waitFor({ state: 'visible', timeout: 30_000 });
  await earlyImage.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);

  const earlyImagePressed = await earlyImage.getAttribute('aria-pressed');
  const earlyImagePanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="christian"]').count();
  const earlyImageDescription = await page.locator('#scene-host-description-ch8').textContent();
  const earlyImageInstrumentPanel = await chapterEightInstrument.getAttribute('data-active-panel');
  const earlyImageInstrumentLabel = await chapterEightInstrument.getAttribute('aria-label');
  const earlyImageVisualState = await page.locator('.historical-strata-instrument__carrier, .historical-strata-instrument__thread--descent, .historical-strata-instrument__fish').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (earlyImagePressed !== 'true') failures.push(`chapter 8 early image reference did not become active: ${earlyImagePressed}`);
  if (earlyImagePanelActive !== 1) failures.push(`chapter 8 early image panel did not become active: ${earlyImagePanelActive}`);
  if (earlyImageInstrumentPanel !== 'christian') failures.push(`chapter 8 historical strata instrument did not follow early image panel: ${earlyImageInstrumentPanel}`);
  if (!earlyImageInstrumentLabel?.includes('Current emphasis: Early Image') || !earlyImageInstrumentLabel?.includes('A small sign can hold a total world')) {
    failures.push(`chapter 8 historical strata instrument label did not follow early image panel: ${earlyImageInstrumentLabel}`);
  }
  if (earlyImageVisualState.length !== 3 || earlyImageVisualState.some((opacity) => opacity < 0.45)) {
    failures.push(`chapter 8 historical strata instrument did not visually emphasize carrier image: ${earlyImageVisualState.join(',')}`);
  }
  if (!earlyImageDescription?.includes('Early Image: The fish becomes a carrier')) failures.push(`chapter 8 scene description did not follow early image panel: ${earlyImageDescription}`);

  const afterlife = page.locator('.chapter-stage__reference-node[data-panel-id="modern"]');
  await afterlife.waitFor({ state: 'visible', timeout: 30_000 });
  await afterlife.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);

  const afterlifePressed = await afterlife.getAttribute('aria-pressed');
  const afterlifePanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="modern"]').count();
  const afterlifeDescription = await page.locator('#scene-host-description-ch8').textContent();
  const afterlifeInstrumentPanel = await chapterEightInstrument.getAttribute('data-active-panel');
  const afterlifeInstrumentLabel = await chapterEightInstrument.getAttribute('aria-label');
  const afterlifeVisualState = await page.locator('.historical-strata-instrument__depth, .historical-strata-instrument__thread--return, .historical-strata-instrument__layer--4, .historical-strata-instrument__layer--5').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  const chapterEightScrollY = await page.evaluate(() => window.scrollY);
  if (afterlifePressed !== 'true') failures.push(`chapter 8 afterlife reference did not become active: ${afterlifePressed}`);
  if (afterlifePanelActive !== 1) failures.push(`chapter 8 afterlife panel did not become active: ${afterlifePanelActive}`);
  if (afterlifeInstrumentPanel !== 'modern') failures.push(`chapter 8 historical strata instrument did not follow afterlife panel: ${afterlifeInstrumentPanel}`);
  if (!afterlifeInstrumentLabel?.includes('Current emphasis: Afterlife') || !afterlifeInstrumentLabel?.includes('The unconscious preserves symbolic depth')) {
    failures.push(`chapter 8 historical strata instrument label did not follow afterlife panel: ${afterlifeInstrumentLabel}`);
  }
  if (afterlifeVisualState.length !== 4 || afterlifeVisualState.some((opacity) => opacity < 0.45)) {
    failures.push(`chapter 8 historical strata instrument did not visually emphasize afterlife/depth: ${afterlifeVisualState.join(',')}`);
  }
  if (!afterlifeDescription?.includes('Afterlife: Old images keep speaking')) failures.push(`chapter 8 scene description did not follow afterlife panel: ${afterlifeDescription}`);
  if (chapterEightScrollY > 10) failures.push(`chapter 8 scene control unexpectedly scrolled page: ${chapterEightScrollY}`);

  const chapterEightCanvas = page.locator('.scene-host canvas').first();
  const chapterEightCanvasBox = await chapterEightCanvas.boundingBox();
  const chapterEightPixelSample = await countCanvasPixels(chapterEightCanvas);
  const chapterEightStyleCount = await page.locator('style#ch8-anim-style').count();
  if (!chapterEightCanvasBox || chapterEightCanvasBox.width < 300 || chapterEightCanvasBox.height < 300) {
    failures.push(`chapter 8 canvas geometry too small: ${chapterEightCanvasBox ? `${Math.round(chapterEightCanvasBox.width)}x${Math.round(chapterEightCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 8', chapterEightPixelSample);
  if (chapterEightStyleCount !== 1) failures.push(`chapter 8 injected style count mismatch: ${chapterEightStyleCount}`);

  await gotoAppRoute(page, '/journey/chapter/ch9');
  const shadowFish = page.getByRole('button', { name: /03\s+Shadow/ });
  await activateSceneButton(shadowFish);
  await page.waitForTimeout(250);

  const shadowFishPressed = await shadowFish.getAttribute('aria-pressed');
  const chapterNineScrollY = await page.evaluate(() => window.scrollY);
  if (shadowFishPressed !== 'true') failures.push(`chapter 9 scene control did not become active: ${shadowFishPressed}`);
  if (chapterNineScrollY > 10) failures.push(`chapter 9 scene control unexpectedly scrolled page: ${chapterNineScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch10');
  const opus = page.getByRole('button', { name: /03\s+Opus/ });
  await activateSceneButton(opus);
  await page.waitForTimeout(250);

  const opusPressed = await opus.getAttribute('aria-pressed');
  const chapterTenScrollY = await page.evaluate(() => window.scrollY);
  if (opusPressed !== 'true') failures.push(`chapter 10 scene control did not become active: ${opusPressed}`);
  if (chapterTenScrollY > 10) failures.push(`chapter 10 scene control unexpectedly scrolled page: ${chapterTenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch11');
  const stone = page.getByRole('button', { name: /03\s+Stone/ });
  await activateSceneButton(stone);
  await page.waitForTimeout(250);

  const stonePressed = await stone.getAttribute('aria-pressed');
  const chapterElevenScrollY = await page.evaluate(() => window.scrollY);
  if (stonePressed !== 'true') failures.push(`chapter 11 scene control did not become active: ${stonePressed}`);
  if (chapterElevenScrollY > 10) failures.push(`chapter 11 scene control unexpectedly scrolled page: ${chapterElevenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch12');
  const bridge = page.getByRole('button', { name: /03\s+Bridge/ });
  await activateSceneButton(bridge);
  await page.waitForTimeout(250);

  const bridgePressed = await bridge.getAttribute('aria-pressed');
  const chapterTwelveScrollY = await page.evaluate(() => window.scrollY);
  if (bridgePressed !== 'true') failures.push(`chapter 12 scene control did not become active: ${bridgePressed}`);
  if (chapterTwelveScrollY > 10) failures.push(`chapter 12 scene control unexpectedly scrolled page: ${chapterTwelveScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch13');
  const paradox = page.getByRole('button', { name: /03\s+Paradox/ });
  await activateSceneButton(paradox);
  await page.waitForTimeout(250);

  const paradoxPressed = await paradox.getAttribute('aria-pressed');
  const chapterThirteenScrollY = await page.evaluate(() => window.scrollY);
  if (paradoxPressed !== 'true') failures.push(`chapter 13 scene control did not become active: ${paradoxPressed}`);
  if (chapterThirteenScrollY > 10) failures.push(`chapter 13 scene control unexpectedly scrolled page: ${chapterThirteenScrollY}`);

  await gotoAppRoute(page, '/journey/chapter/ch14');
  const aeon = page.getByRole('button', { name: /03\s+Aeon/ });
  await activateSceneButton(aeon);
  await page.waitForTimeout(250);

  const aeonPressed = await aeon.getAttribute('aria-pressed');
  const chapterFourteenScrollY = await page.evaluate(() => window.scrollY);
  if (aeonPressed !== 'true') failures.push(`chapter 14 scene control did not become active: ${aeonPressed}`);
  if (chapterFourteenScrollY > 10) failures.push(`chapter 14 scene control unexpectedly scrolled page: ${chapterFourteenScrollY}`);
}

async function smokeMobile(page, failures) {
  await page.setViewportSize(mobileViewport);
  for (const route of ['/', '/chapters', '/atlas', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch5', '/journey/chapter/ch6', '/journey/chapter/ch7', '/journey/chapter/ch8', '/journey/chapter/ch14']) {
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

    await gotoAppRoute(page, '/journey/chapter/ch2');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterTwoNavBox = await page.locator('.app-nav').boundingBox();
    const chapterTwoHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterTwoReferenceCount = await page.locator('.chapter-stage__reference-node').count();
    const chapterTwoAnnotationDisplay = await page.locator('.ch2-annotations').evaluate((node) => window.getComputedStyle(node).display).catch(() => 'missing');
    const chapterTwoScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (!chapterTwoNavBox || !chapterTwoHeadingBox) {
      failures.push(`mobile chapter 2 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterTwoNavBottom = chapterTwoNavBox.y + chapterTwoNavBox.height;
    if (chapterTwoNavBottom > chapterTwoHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 2 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterTwoNavBottom)}, heading top ${Math.round(chapterTwoHeadingBox.y)}`);
    }
    if (chapterTwoReferenceCount !== 3) failures.push(`mobile chapter 2 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterTwoReferenceCount}`);
    if (chapterTwoAnnotationDisplay !== 'none') failures.push(`mobile chapter 2 annotation overlay remains visible at ${viewport.width}x${viewport.height}: ${chapterTwoAnnotationDisplay}`);
    if (chapterTwoScrollWidth > viewport.width + 2) failures.push(`mobile chapter 2 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterTwoScrollWidth}`);

    await gotoAppRoute(page, '/journey/chapter/ch3');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterThreeNavBox = await page.locator('.app-nav').boundingBox();
    const chapterThreeHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterThreeReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterThreeReferenceCount = await chapterThreeReferenceNodes.count();
    const chapterThreePanelIds = await chapterThreeReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterThreeAnnotationDisplay = await page.locator('.ch3-annotations').evaluate((node) => window.getComputedStyle(node).display).catch(() => 'missing');
    const chapterThreeScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterThreeReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    if (!chapterThreeNavBox || !chapterThreeHeadingBox) {
      failures.push(`mobile chapter 3 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterThreeNavBottom = chapterThreeNavBox.y + chapterThreeNavBox.height;
    if (chapterThreeNavBottom > chapterThreeHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 3 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterThreeNavBottom)}, heading top ${Math.round(chapterThreeHeadingBox.y)}`);
    }
    if (chapterThreeReferenceCount !== 3) failures.push(`mobile chapter 3 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterThreeReferenceCount}`);
    if (chapterThreePanelIds.join(',') !== 'pair,orbit,union') failures.push(`mobile chapter 3 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterThreePanelIds.join(',')}`);
    if (chapterThreeAnnotationDisplay !== 'none') failures.push(`mobile chapter 3 annotation overlay remains visible at ${viewport.width}x${viewport.height}: ${chapterThreeAnnotationDisplay}`);
    if (chapterThreeScrollWidth > viewport.width + 2) failures.push(`mobile chapter 3 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterThreeScrollWidth}`);
    if (chapterThreeReferenceMapBox && chapterThreeReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 3 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterThreeReferenceMapBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterThreeCanvas = page.locator('.scene-host canvas').first();
      const chapterThreeCanvasCount = await chapterThreeCanvas.count();
      if (chapterThreeCanvasCount > 0) {
        const chapterThreePixelSample = await countCanvasPixels(chapterThreeCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 3 at ${viewport.width}x${viewport.height}`, chapterThreePixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch4');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterFourNavBox = await page.locator('.app-nav').boundingBox();
    const chapterFourHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterFourReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterFourReferenceCount = await chapterFourReferenceNodes.count();
    const chapterFourPanelIds = await chapterFourReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterFourScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterFourReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterFourInstrumentBox = await page.locator('.self-mandala-instrument').boundingBox();
    if (!chapterFourNavBox || !chapterFourHeadingBox) {
      failures.push(`mobile chapter 4 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterFourNavBottom = chapterFourNavBox.y + chapterFourNavBox.height;
    if (chapterFourNavBottom > chapterFourHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 4 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterFourNavBottom)}, heading top ${Math.round(chapterFourHeadingBox.y)}`);
    }
    if (chapterFourReferenceCount !== 3) failures.push(`mobile chapter 4 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterFourReferenceCount}`);
    if (chapterFourPanelIds.join(',') !== 'seed,quaternity,mandala') failures.push(`mobile chapter 4 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterFourPanelIds.join(',')}`);
    if (chapterFourScrollWidth > viewport.width + 2) failures.push(`mobile chapter 4 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterFourScrollWidth}`);
    if (chapterFourReferenceMapBox && chapterFourReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 4 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterFourReferenceMapBox.width)}`);
    }
    if (!chapterFourInstrumentBox) failures.push(`mobile chapter 4 Self mandala instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterFourInstrumentBox && chapterFourInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 4 Self mandala instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterFourInstrumentBox.width)}`);
    }

    await gotoAppRoute(page, '/journey/chapter/ch5');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterFiveNavBox = await page.locator('.app-nav').boundingBox();
    const chapterFiveHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterFiveReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterFiveReferenceCount = await chapterFiveReferenceNodes.count();
    const chapterFivePanelIds = await chapterFiveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterFiveScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterFiveReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterFiveInstrumentBox = await page.locator('.christ-symbol-instrument').boundingBox();
    if (!chapterFiveNavBox || !chapterFiveHeadingBox) {
      failures.push(`mobile chapter 5 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterFiveNavBottom = chapterFiveNavBox.y + chapterFiveNavBox.height;
    if (chapterFiveNavBottom > chapterFiveHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 5 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterFiveNavBottom)}, heading top ${Math.round(chapterFiveHeadingBox.y)}`);
    }
    if (chapterFiveReferenceCount !== 3) failures.push(`mobile chapter 5 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterFiveReferenceCount}`);
    if (chapterFivePanelIds.join(',') !== 'cross,fourth,tree') failures.push(`mobile chapter 5 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterFivePanelIds.join(',')}`);
    if (chapterFiveScrollWidth > viewport.width + 2) failures.push(`mobile chapter 5 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterFiveScrollWidth}`);
    if (chapterFiveReferenceMapBox && chapterFiveReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 5 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterFiveReferenceMapBox.width)}`);
    }
    if (!chapterFiveInstrumentBox) failures.push(`mobile chapter 5 Christ symbol instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterFiveInstrumentBox && chapterFiveInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 5 Christ symbol instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterFiveInstrumentBox.width)}`);
    }

    await gotoAppRoute(page, '/journey/chapter/ch6');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterSixNavBox = await page.locator('.app-nav').boundingBox();
    const chapterSixHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterSixReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterSixReferenceCount = await chapterSixReferenceNodes.count();
    const chapterSixPanelIds = await chapterSixReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterSixAnnotationLabelsHidden = await page.locator('.ch6-fish-label, .ch6-commissure-label, .ch6-sign-name, .ch6-spring-label, .ch6-saturn-label, .ch6-jupiter-label, .ch6-conjunction-label, .ch6-orbiter-label, .ch6-leaders-svg').evaluateAll((nodes) => nodes.every((node) => window.getComputedStyle(node).display === 'none'));
    const chapterSixScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterSixReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterSixInstrumentBox = await page.locator('.aeon-fish-instrument').boundingBox();
    if (!chapterSixNavBox || !chapterSixHeadingBox) {
      failures.push(`mobile chapter 6 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterSixNavBottom = chapterSixNavBox.y + chapterSixNavBox.height;
    if (chapterSixNavBottom > chapterSixHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 6 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterSixNavBottom)}, heading top ${Math.round(chapterSixHeadingBox.y)}`);
    }
    if (chapterSixReferenceCount !== 3) failures.push(`mobile chapter 6 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterSixReferenceCount}`);
    if (chapterSixPanelIds.join(',') !== 'fish,zodiac,transition') failures.push(`mobile chapter 6 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterSixPanelIds.join(',')}`);
    if (!chapterSixAnnotationLabelsHidden) failures.push(`mobile chapter 6 annotation overlay labels remain visible at ${viewport.width}x${viewport.height}`);
    if (chapterSixScrollWidth > viewport.width + 2) failures.push(`mobile chapter 6 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterSixScrollWidth}`);
    if (chapterSixReferenceMapBox && chapterSixReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 6 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterSixReferenceMapBox.width)}`);
    }
    if (!chapterSixInstrumentBox) failures.push(`mobile chapter 6 aeon fish instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterSixInstrumentBox && chapterSixInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 6 aeon fish instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterSixInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterSixCanvas = page.locator('.scene-host canvas').first();
      const chapterSixCanvasCount = await chapterSixCanvas.count();
      if (chapterSixCanvasCount > 0) {
        const chapterSixPixelSample = await countCanvasPixels(chapterSixCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 6 at ${viewport.width}x${viewport.height}`, chapterSixPixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch7');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterSevenNavBox = await page.locator('.app-nav').boundingBox();
    const chapterSevenHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterSevenReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterSevenReferenceCount = await chapterSevenReferenceNodes.count();
    const chapterSevenPanelIds = await chapterSevenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterSevenOverlayHidden = await page.locator('.ch7-event-tooltip, .ch7-scene-dot').evaluateAll((nodes) => nodes.every((node) => window.getComputedStyle(node).display === 'none'));
    const chapterSevenScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterSevenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterSevenInstrumentBox = await page.locator('.prophecy-field-instrument').boundingBox();
    if (!chapterSevenNavBox || !chapterSevenHeadingBox) {
      failures.push(`mobile chapter 7 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterSevenNavBottom = chapterSevenNavBox.y + chapterSevenNavBox.height;
    if (chapterSevenNavBottom > chapterSevenHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 7 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterSevenNavBottom)}, heading top ${Math.round(chapterSevenHeadingBox.y)}`);
    }
    if (chapterSevenReferenceCount !== 3) failures.push(`mobile chapter 7 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterSevenReferenceCount}`);
    if (chapterSevenPanelIds.join(',') !== 'prophecy,collective,threshold') failures.push(`mobile chapter 7 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterSevenPanelIds.join(',')}`);
    if (!chapterSevenOverlayHidden) failures.push(`mobile chapter 7 event overlay remains visible at ${viewport.width}x${viewport.height}`);
    if (chapterSevenScrollWidth > viewport.width + 2) failures.push(`mobile chapter 7 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterSevenScrollWidth}`);
    if (chapterSevenReferenceMapBox && chapterSevenReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 7 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterSevenReferenceMapBox.width)}`);
    }
    if (!chapterSevenInstrumentBox) failures.push(`mobile chapter 7 prophecy field instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterSevenInstrumentBox && chapterSevenInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 7 prophecy field instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterSevenInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterSevenCanvas = page.locator('.scene-host canvas').first();
      const chapterSevenCanvasCount = await chapterSevenCanvas.count();
      if (chapterSevenCanvasCount > 0) {
        const chapterSevenPixelSample = await countCanvasPixels(chapterSevenCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 7 at ${viewport.width}x${viewport.height}`, chapterSevenPixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch8');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterEightNavBox = await page.locator('.app-nav').boundingBox();
    const chapterEightHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterEightReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterEightReferenceCount = await chapterEightReferenceNodes.count();
    const chapterEightPanelIds = await chapterEightReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterEightOverlayHidden = await page.locator('.ch8-label, .ch8-progress').evaluateAll((nodes) => nodes.every((node) => window.getComputedStyle(node).display === 'none'));
    const chapterEightScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterEightReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterEightInstrumentBox = await page.locator('.historical-strata-instrument').boundingBox();
    if (!chapterEightNavBox || !chapterEightHeadingBox) {
      failures.push(`mobile chapter 8 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterEightNavBottom = chapterEightNavBox.y + chapterEightNavBox.height;
    if (chapterEightNavBottom > chapterEightHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 8 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterEightNavBottom)}, heading top ${Math.round(chapterEightHeadingBox.y)}`);
    }
    if (chapterEightReferenceCount !== 3) failures.push(`mobile chapter 8 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterEightReferenceCount}`);
    if (chapterEightPanelIds.join(',') !== 'strata,christian,modern') failures.push(`mobile chapter 8 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterEightPanelIds.join(',')}`);
    if (!chapterEightOverlayHidden) failures.push(`mobile chapter 8 annotation overlay remains visible at ${viewport.width}x${viewport.height}`);
    if (chapterEightScrollWidth > viewport.width + 2) failures.push(`mobile chapter 8 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterEightScrollWidth}`);
    if (chapterEightReferenceMapBox && chapterEightReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 8 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterEightReferenceMapBox.width)}`);
    }
    if (!chapterEightInstrumentBox) failures.push(`mobile chapter 8 historical strata instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterEightInstrumentBox && chapterEightInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 8 historical strata instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterEightInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterEightCanvas = page.locator('.scene-host canvas').first();
      const chapterEightCanvasCount = await chapterEightCanvas.count();
      if (chapterEightCanvasCount > 0) {
        const chapterEightPixelSample = await countCanvasPixels(chapterEightCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 8 at ${viewport.width}x${viewport.height}`, chapterEightPixelSample);
      }
    }
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

    let page = await browser.newPage({ viewport: desktopViewport });
    const routeFailures = watchForRouteFailures(page);

    await smokeCanonicalRoutes(page, failures);
    await smokeHomeVisualDetail(page, failures);
    await smokeAtlasVisualSearch(page, failures);
    await smokeChapterRoutes(page, failures);
    await smokeKeyboard(page, failures);
    await smokeLegacyRedirect(page, failures);
    await smokeChapterJump(page, failures);
    await page.close();

    page = await browser.newPage({ viewport: desktopViewport });
    const sceneRouteFailures = watchForRouteFailures(page);
    await smokeChapterSceneControls(page, failures);
    failures.push(...sceneRouteFailures.notFound.map((url) => `404 response: ${url}`));
    failures.push(...sceneRouteFailures.consoleErrors.map((message) => `console error: ${message}`));
    await page.close();

    page = await browser.newPage({ viewport: desktopViewport });
    const mobileRouteFailures = watchForRouteFailures(page);
    await smokeMobile(page, failures);
    failures.push(...mobileRouteFailures.notFound.map((url) => `404 response: ${url}`));
    failures.push(...mobileRouteFailures.consoleErrors.map((message) => `console error: ${message}`));

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
