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

  await page.evaluate(() => window.localStorage.removeItem('aion:scene-animation-paused'));
  await gotoAppRoute(page, '/journey/chapter/ch2');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterTwoReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterTwoReferenceCount = await chapterTwoReferenceNodes.count();
  const chapterTwoPanelIds = await chapterTwoReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  if (chapterTwoReferenceCount !== 3) failures.push(`chapter 2 reference node count mismatch: ${chapterTwoReferenceCount}`);
  if (chapterTwoPanelIds.join(',') !== 'mirror,projection,integration') failures.push(`chapter 2 reference nodes out of order: ${chapterTwoPanelIds.join(',')}`);

  const chapterTwoPause = page.getByRole('button', { name: /Pause animation/ });
  await chapterTwoPause.click();
  await page.waitForTimeout(5_400);
  const chapterTwoPaused = await page.getByRole('button', { name: /Resume animation/ }).getAttribute('aria-pressed');
  const chapterTwoPausedAnnotationCount = await page.locator('.ch2-a--ego.vis, .ch2-micro--ego.vis').count();
  if (chapterTwoPaused !== 'true') failures.push(`chapter 2 pause control did not stay pressed: ${chapterTwoPaused}`);
  if (chapterTwoPausedAnnotationCount !== 0) failures.push(`chapter 2 pause allowed timed annotations to reveal: ${chapterTwoPausedAnnotationCount}`);
  await page.getByRole('button', { name: /Resume animation/ }).click();

  const projection = page.locator('.chapter-stage__reference-node[data-panel-id="projection"]');
  await projection.click();
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
  await integration.click();
  await page.waitForFunction(() => document.querySelector('.ch2-a--integration')?.classList.contains('vis'), null, { timeout: 2_000 }).catch(() => {});
  const integrationPressed = await integration.getAttribute('aria-pressed');
  const integrationAnnotationVisible = await page.locator('.ch2-a--integration.vis').count();
  if (integrationPressed !== 'true') failures.push(`chapter 2 integration reference did not become active: ${integrationPressed}`);
  if (integrationAnnotationVisible !== 1) failures.push(`chapter 2 integration annotation did not follow selected panel: ${integrationAnnotationVisible}`);

  const mirror = page.locator('.chapter-stage__reference-node[data-panel-id="mirror"]');
  await mirror.click();
  await page.waitForTimeout(850);
  const integrationAnnotationState = await page.locator('.ch2-a--integration').evaluate((node) => ({
    visible: node.classList.contains('vis'),
    hidden: node.classList.contains('hid'),
  }));
  if (integrationAnnotationState.visible) failures.push('chapter 2 integration annotation stayed visible after returning to mirror panel');
  if (!integrationAnnotationState.hidden) failures.push('chapter 2 integration annotation did not enter hidden state after returning to mirror panel');

  const chapterTwoCanvas = page.locator('.scene-host canvas').first();
  const chapterTwoCanvasBox = await chapterTwoCanvas.boundingBox();
  const chapterTwoVisiblePixels = await countCanvasPixels(chapterTwoCanvas);
  if (!chapterTwoCanvasBox || chapterTwoCanvasBox.width < 300 || chapterTwoCanvasBox.height < 300) {
    failures.push(`chapter 2 canvas geometry too small: ${chapterTwoCanvasBox ? `${Math.round(chapterTwoCanvasBox.width)}x${Math.round(chapterTwoCanvasBox.height)}` : 'missing'}`);
  }
  if (chapterTwoVisiblePixels <= 8) failures.push(`chapter 2 canvas appears blank: ${chapterTwoVisiblePixels}`);

  await page.evaluate(() => window.localStorage.removeItem('aion:scene-animation-paused'));
  await gotoAppRoute(page, '/journey/chapter/ch3');
  await page.locator('.scene-host__mount[data-state="ready"]').waitFor({ state: 'visible', timeout: 10_000 });
  const chapterThreeReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterThreeReferenceCount = await chapterThreeReferenceNodes.count();
  const chapterThreePanelIds = await chapterThreeReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  if (chapterThreeReferenceCount !== 3) failures.push(`chapter 3 reference node count mismatch: ${chapterThreeReferenceCount}`);
  if (chapterThreePanelIds.join(',') !== 'pair,orbit,union') failures.push(`chapter 3 reference nodes out of order: ${chapterThreePanelIds.join(',')}`);

  const chapterThreePause = page.getByRole('button', { name: /Pause animation/ });
  await chapterThreePause.click();
  await page.waitForTimeout(5_400);
  const chapterThreePaused = await page.getByRole('button', { name: /Resume animation/ }).getAttribute('aria-pressed');
  const chapterThreePausedAnnotationCount = await page.locator('.ch3-a--anima.vis, .ch3-micro--anima.vis').count();
  if (chapterThreePaused !== 'true') failures.push(`chapter 3 pause control did not stay pressed: ${chapterThreePaused}`);
  if (chapterThreePausedAnnotationCount !== 0) failures.push(`chapter 3 pause allowed timed annotations to reveal: ${chapterThreePausedAnnotationCount}`);
  await page.getByRole('button', { name: /Resume animation/ }).click();

  const orbit = page.locator('.chapter-stage__reference-node[data-panel-id="orbit"]');
  await orbit.click();
  await page.waitForTimeout(250);

  const orbitPressed = await orbit.getAttribute('aria-pressed');
  const orbitPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="orbit"]').count();
  const orbitPanelAnnotationVisible = await page.locator('.ch3-a--dance.panel-vis').count();
  const orbitAnnotationDisplay = await page.locator('.ch3-a--dance.panel-vis').evaluate((node) => window.getComputedStyle(node).display).catch(() => 'missing');
  const chapterThreeOrbitScrollY = await page.evaluate(() => window.scrollY);
  const chapterThreeOrbitDescription = await page.locator('#scene-host-description-ch3').textContent();
  if (orbitPressed !== 'true') failures.push(`chapter 3 orbit reference did not become active: ${orbitPressed}`);
  if (orbitPanelActive !== 1) failures.push(`chapter 3 orbit panel did not become active: ${orbitPanelActive}`);
  if (orbitPanelAnnotationVisible !== 1) failures.push(`chapter 3 orbit annotation did not follow selected panel: ${orbitPanelAnnotationVisible}`);
  if (orbitAnnotationDisplay === 'none' || orbitAnnotationDisplay === 'missing') failures.push(`chapter 3 orbit annotation display is not visible: ${orbitAnnotationDisplay}`);
  if (chapterThreeOrbitScrollY > 10) failures.push(`chapter 3 orbit control unexpectedly scrolled page: ${chapterThreeOrbitScrollY}`);
  if (!chapterThreeOrbitDescription?.includes('Relation: Neither pole stands alone')) failures.push(`chapter 3 scene description did not follow orbit panel: ${chapterThreeOrbitDescription}`);

  const conjunction = page.locator('.chapter-stage__reference-node[data-panel-id="union"]');
  await conjunction.click();
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
  if (!chapterThreeUnionDescription?.includes('Conjunction: A brief union')) failures.push(`chapter 3 scene description did not follow union panel: ${chapterThreeUnionDescription}`);

  const pair = page.locator('.chapter-stage__reference-node[data-panel-id="pair"]');
  await pair.click();
  await page.waitForTimeout(250);
  const conjunctionHiddenAfterPair = await page.locator('.ch3-a--conjunction').evaluate((node) => ({
    visible: node.classList.contains('vis'),
    hidden: node.classList.contains('hid'),
  }));
  if (conjunctionHiddenAfterPair.visible) failures.push('chapter 3 conjunction annotation stayed visible after returning to pair panel');
  if (!conjunctionHiddenAfterPair.hidden) failures.push('chapter 3 conjunction annotation did not enter hidden state after returning to pair panel');

  const chapterThreeCanvas = page.locator('.scene-host canvas').first();
  const chapterThreeCanvasBox = await chapterThreeCanvas.boundingBox();
  const chapterThreeVisiblePixels = await countCanvasPixels(chapterThreeCanvas);
  if (!chapterThreeCanvasBox || chapterThreeCanvasBox.width < 300 || chapterThreeCanvasBox.height < 300) {
    failures.push(`chapter 3 canvas geometry too small: ${chapterThreeCanvasBox ? `${Math.round(chapterThreeCanvasBox.width)}x${Math.round(chapterThreeCanvasBox.height)}` : 'missing'}`);
  }
  if (chapterThreeVisiblePixels <= 8) failures.push(`chapter 3 canvas appears blank: ${chapterThreeVisiblePixels}`);

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
  for (const route of ['/', '/chapters', '/atlas', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch14']) {
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
        const chapterThreeVisiblePixels = await countCanvasPixels(chapterThreeCanvas);
        if (chapterThreeVisiblePixels <= 8) failures.push(`mobile chapter 3 canvas appears blank at ${viewport.width}x${viewport.height}: ${chapterThreeVisiblePixels}`);
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

    const page = await browser.newPage({ viewport: desktopViewport });
    const routeFailures = watchForRouteFailures(page);

    await smokeCanonicalRoutes(page, failures);
    await smokeHomeVisualDetail(page, failures);
    await smokeAtlasVisualSearch(page, failures);
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
