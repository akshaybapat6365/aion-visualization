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
const narrowMobileViewport = { width: 320, height: 568 };
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

async function waitForCanvasPixels(canvas, { minVisiblePixels = 8, timeoutMs = 6_000, intervalMs = 250 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let result = { timedOut: true, visiblePixels: 0 };

  while (Date.now() < deadline) {
    result = await countCanvasPixels(canvas);
    if (!result.timedOut && result.visiblePixels > minVisiblePixels) return result;
    await delay(intervalMs);
  }

  return result;
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

async function smokeChaptersArcHub(page, failures) {
  await gotoAppRoute(page, '/chapters');

  const orbitNodes = page.locator('.chapters-orbit__node');
  const arcControls = page.locator('.chapters-arc-map__cluster');
  const chapterCards = page.locator('.chapter-card');
  const selectedDetail = page.locator('#chapters-selected-detail');
  const selectedChapterLink = page.locator('.chapters-selected-panel__link');
  const heroCta = page.locator('.chapters-action');
  const initialSelectedChapter = await selectedDetail.getAttribute('data-selected-chapter');
  const initialSelectedTitle = await selectedDetail.locator('h2').textContent();
  const initialPressedCount = await page.locator('.chapters-orbit__node[aria-pressed="true"]').count();
  const initialConceptCount = await page.locator('.chapters-orbit__concepts span').count();
  const initialArcCount = await arcControls.count();

  if (await orbitNodes.count() !== 14) failures.push(`chapters orbit node count mismatch: ${await orbitNodes.count()}`);
  if (initialArcCount !== 7) failures.push(`chapters arc control count mismatch: ${initialArcCount}`);
  if (await chapterCards.count() !== 14) failures.push(`chapters card count mismatch: ${await chapterCards.count()}`);
  if (initialSelectedChapter !== 'ch1') failures.push(`chapters initial selected chapter mismatch: ${initialSelectedChapter}`);
  if (!initialSelectedTitle?.includes('The Ego')) failures.push(`chapters initial selected title mismatch: ${initialSelectedTitle}`);
  if (initialPressedCount !== 1) failures.push(`chapters initial pressed orbit count mismatch: ${initialPressedCount}`);
  if (initialConceptCount < 2) failures.push(`chapters initial concept chips missing: ${initialConceptCount}`);

  const synthesisArc = page.getByRole('button', { name: /Synthesis\s+14–14/ });
  await synthesisArc.click();
  await page.waitForTimeout(100);

  const chapterFourteenPressed = await page.getByRole('button', { name: /Preview chapter 14: The Structure and Dynamics of the Self/ }).getAttribute('aria-pressed');
  const chapterFourteenTitle = await selectedDetail.locator('h2').textContent();
  const chapterFourteenMotion = await selectedDetail.getAttribute('data-motion-grammar');
  const chapterFourteenHref = await selectedChapterLink.getAttribute('href');
  const chapterFourteenHeroHref = await heroCta.getAttribute('href');
  const chapterFourteenActiveCardCount = await page.locator('.chapter-card--active[data-chapter-id="ch14"]').count();
  const scrollYAfterArcSelect = await page.evaluate(() => window.scrollY);

  if (chapterFourteenPressed !== 'true') failures.push(`chapters chapter 14 orbit did not become pressed: ${chapterFourteenPressed}`);
  if (!chapterFourteenTitle?.includes('The Structure and Dynamics of the Self')) failures.push(`chapters detail did not update to chapter 14: ${chapterFourteenTitle}`);
  if (chapterFourteenMotion !== 'integration') failures.push(`chapters chapter 14 motion grammar mismatch: ${chapterFourteenMotion}`);
  if (chapterFourteenHref !== '/journey/chapter/ch14') failures.push(`chapters selected panel link mismatch: ${chapterFourteenHref}`);
  if (chapterFourteenHeroHref !== '/journey/chapter/ch14') failures.push(`chapters hero CTA link mismatch: ${chapterFourteenHeroHref}`);
  if (chapterFourteenActiveCardCount !== 1) failures.push(`chapters active chapter 14 card count mismatch: ${chapterFourteenActiveCardCount}`);
  if (scrollYAfterArcSelect > 10) failures.push(`chapters arc selection unexpectedly scrolled page: ${scrollYAfterArcSelect}`);

  const chapterFourteenButton = page.getByRole('button', { name: /Preview chapter 14:/ });
  await chapterFourteenButton.press('ArrowRight');
  await page.waitForTimeout(100);
  const wrappedTitle = await selectedDetail.locator('h2').textContent();
  const chapterOnePressed = await page.getByRole('button', { name: /Preview chapter 1: The Ego/ }).getAttribute('aria-pressed');
  if (!wrappedTitle?.includes('The Ego')) failures.push(`chapters arrow navigation did not wrap to chapter 1: ${wrappedTitle}`);
  if (chapterOnePressed !== 'true') failures.push(`chapters arrow navigation did not press chapter 1: ${chapterOnePressed}`);
}

async function smokeChaptersMobileLayout(page, failures, viewport) {
  await gotoAppRoute(page, '/chapters');

  const layout = await page.evaluate(() => {
    const rect = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    const intersects = (a, b) => !!a && !!b
      && a.right > b.left
      && b.right > a.left
      && a.bottom > b.top
      && b.bottom > a.top;
    const center = rect(document.querySelector('.chapters-orbit__center'));
    const nodeOverlaps = [...document.querySelectorAll('.chapters-orbit__node')]
      .map((node) => ({ label: node.textContent?.trim(), box: rect(node) }))
      .filter((node) => intersects(node.box, center))
      .map((node) => node.label);
    const stage = rect(document.querySelector('.chapters-stage'));
    const orbit = rect(document.querySelector('.chapters-orbit'));
    const action = document.querySelector('.chapters-action');

    return {
      arcCount: document.querySelectorAll('.chapters-arc-map__cluster').length,
      orbitCount: document.querySelectorAll('.chapters-orbit__node').length,
      cardCount: document.querySelectorAll('.chapter-card').length,
      pressedCount: document.querySelectorAll('.chapters-orbit__node[aria-pressed="true"]').length,
      liveRegions: document.querySelectorAll('[aria-live]').length,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      stageTop: stage?.top,
      orbitTop: orbit?.top,
      nodeOverlaps,
      actionAfterContent: action ? getComputedStyle(action, '::after').content : null,
    };
  });

  const label = `${viewport.width}x${viewport.height}`;
  if (layout.arcCount !== 7) failures.push(`mobile chapters arc count mismatch at ${label}: ${layout.arcCount}`);
  if (layout.orbitCount !== 14) failures.push(`mobile chapters orbit count mismatch at ${label}: ${layout.orbitCount}`);
  if (layout.cardCount !== 14) failures.push(`mobile chapters card count mismatch at ${label}: ${layout.cardCount}`);
  if (layout.pressedCount !== 1) failures.push(`mobile chapters pressed count mismatch at ${label}: ${layout.pressedCount}`);
  if (layout.liveRegions !== 1) failures.push(`mobile chapters live region count mismatch at ${label}: ${layout.liveRegions}`);
  if (layout.scrollWidth > layout.viewportWidth + 2) failures.push(`mobile chapters horizontal overflow at ${label}: ${layout.scrollWidth}`);
  if (layout.orbitTop === undefined || layout.orbitTop > layout.viewportHeight) failures.push(`mobile chapters visual orbit misses first viewport at ${label}: ${Math.round(layout.orbitTop ?? -1)}`);
  if (layout.nodeOverlaps.length > 0) failures.push(`mobile chapters orbit nodes overlap center at ${label}: ${layout.nodeOverlaps.join(', ')}`);
  if (layout.actionAfterContent !== 'none') failures.push(`mobile chapters primary CTA has duplicate pseudo arrow at ${label}: ${layout.actionAfterContent}`);
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

async function smokeTimelineVisualField(page, failures) {
  await gotoAppRoute(page, '/timeline');

  const search = page.getByLabel('Search');
  const category = page.getByLabel('Category');
  const orbitButtons = page.locator('.timeline-orbit__node');
  const railItems = page.locator('.timeline-rail__item');
  const fieldNodes = page.locator('.timeline-field__node');
  const timelineField = page.getByRole('group', { name: /Timeline field:/ });
  const initialDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const initialOrbitLabel = await page.locator('.timeline-orbit').getAttribute('aria-label');
  const initialFieldLabel = await timelineField.getAttribute('aria-label');
  const initialActiveRailCount = await page.locator('.timeline-rail__item[aria-pressed="true"]').count();
  const initialActiveFieldCount = await page.locator('.timeline-field__node[aria-pressed="true"]').count();

  if (await orbitButtons.count() !== 12) failures.push(`timeline initial orbit button count mismatch: ${await orbitButtons.count()}`);
  if (await railItems.count() !== 22) failures.push(`timeline initial rail count mismatch: ${await railItems.count()}`);
  if (await fieldNodes.count() !== 22) failures.push(`timeline initial field node count mismatch: ${await fieldNodes.count()}`);
  if (!initialDetail?.includes('Born in Kesswil')) failures.push(`timeline initial detail mismatch: ${initialDetail}`);
  if (!initialOrbitLabel?.includes('12 events in view')) failures.push(`timeline initial orbit label mismatch: ${initialOrbitLabel}`);
  if (!initialFieldLabel?.includes('22 of 22 events visible')) failures.push(`timeline initial field label mismatch: ${initialFieldLabel}`);
  if (initialActiveRailCount !== 1) failures.push(`timeline initial active rail count mismatch: ${initialActiveRailCount}`);
  if (initialActiveFieldCount !== 1) failures.push(`timeline initial active field count mismatch: ${initialActiveFieldCount}`);

  const freudRail = page.getByRole('button', { name: /1907 · Encounters First meeting with Sigmund Freud/ });
  await freudRail.click();
  await page.waitForTimeout(100);
  const freudPressed = await freudRail.getAttribute('aria-pressed');
  const freudDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const freudOrbitCore = await page.locator('#timeline-selected-orbit-detail').textContent();
  if (freudPressed !== 'true') failures.push(`timeline Freud rail did not become active: ${freudPressed}`);
  if (!freudDetail?.includes('First meeting with Sigmund Freud')) failures.push(`timeline Freud detail mismatch: ${freudDetail}`);
  if (!freudOrbitCore?.includes('1907') || !freudOrbitCore?.includes('First meeting with Sigmund Freud')) failures.push(`timeline Freud orbit core mismatch: ${freudOrbitCore}`);

  await search.fill('Aion');
  await page.waitForTimeout(100);
  const aionRailCount = await railItems.count();
  const aionOrbitCount = await orbitButtons.count();
  const aionFieldCount = await fieldNodes.count();
  const aionDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const aionResult = await page.locator('.timeline-controls__result').textContent();
  const aionFieldLabel = await timelineField.getAttribute('aria-label');
  if (aionRailCount !== 1) failures.push(`timeline Aion rail count mismatch: ${aionRailCount}`);
  if (aionOrbitCount !== 1) failures.push(`timeline Aion orbit count mismatch: ${aionOrbitCount}`);
  if (aionFieldCount !== 1) failures.push(`timeline Aion field count mismatch: ${aionFieldCount}`);
  if (!aionDetail?.includes('Publishes "Aion"')) failures.push(`timeline Aion detail mismatch: ${aionDetail}`);
  if (!aionResult?.includes('1 of 22 events visible')) failures.push(`timeline Aion result mismatch: ${aionResult}`);
  if (!aionFieldLabel?.includes('1 of 22 events visible')) failures.push(`timeline Aion field label mismatch: ${aionFieldLabel}`);

  await search.fill('');
  await category.selectOption('concepts');
  await page.waitForTimeout(100);
  const conceptsRailCount = await railItems.count();
  const conceptsOrbitCount = await orbitButtons.count();
  const conceptsFieldCount = await fieldNodes.count();
  const conceptsDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const conceptsActiveRailCount = await page.locator('.timeline-rail__item[aria-pressed="true"]').count();
  if (conceptsRailCount !== 4) failures.push(`timeline concepts rail count mismatch: ${conceptsRailCount}`);
  if (conceptsOrbitCount !== 4) failures.push(`timeline concepts orbit count mismatch: ${conceptsOrbitCount}`);
  if (conceptsFieldCount !== 4) failures.push(`timeline concepts field count mismatch: ${conceptsFieldCount}`);
  if (!conceptsDetail?.includes('Seven Sermons to the Dead')) failures.push(`timeline concepts detail mismatch: ${conceptsDetail}`);
  if (conceptsActiveRailCount !== 1) failures.push(`timeline concepts active rail count mismatch: ${conceptsActiveRailCount}`);

  await search.fill('not-a-real-term');
  await page.waitForTimeout(100);
  const emptyRailCount = await railItems.count();
  const emptyOrbitCount = await orbitButtons.count();
  const emptyFieldCount = await fieldNodes.count();
  const emptyDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const emptyMessageVisible = await page.locator('.timeline-field__empty').isVisible();
  const emptyResult = await page.locator('.timeline-controls__result').textContent();
  const emptyOrbitCore = await page.locator('#timeline-selected-orbit-detail').textContent();
  if (emptyRailCount !== 0) failures.push(`timeline empty rail still rendered items: ${emptyRailCount}`);
  if (emptyOrbitCount !== 0) failures.push(`timeline empty orbit still rendered buttons: ${emptyOrbitCount}`);
  if (emptyFieldCount !== 0) failures.push(`timeline empty field still rendered nodes: ${emptyFieldCount}`);
  if (!emptyDetail?.includes('Adjust the field')) failures.push(`timeline empty detail mismatch: ${emptyDetail}`);
  if (!emptyMessageVisible) failures.push('timeline empty field message is not visible');
  if (!emptyResult?.includes('0 of 22 events visible')) failures.push(`timeline empty result mismatch: ${emptyResult}`);
  if (!emptyOrbitCore?.includes('No match') || !emptyOrbitCore?.includes('Adjust the field')) failures.push(`timeline empty orbit core mismatch: ${emptyOrbitCore}`);
}

async function smokeSymbolsVisualField(page, failures) {
  await gotoAppRoute(page, '/symbols');

  const orbitButtons = page.locator('.symbol-orbit__node');
  const symbolPanels = page.locator('.symbol-panel');
  const symbolField = page.getByRole('img', { name: /Fish symbol field/ });
  const initialDetail = await page.locator('#symbol-selected-detail h2').textContent();
  const initialFieldLabel = await symbolField.getAttribute('aria-label');
  const initialActiveOrbitCount = await page.locator('.symbol-orbit__node[aria-pressed="true"]').count();
  const initialActivePanelCount = await page.locator('.symbol-panel__activate[aria-pressed="true"]').count();
  const initialConceptCount = await page.locator('.symbol-field__concept').count();
  const initialChapterCount = await page.locator('.symbol-field__chapter').count();
  const initialChapterLinkCount = await page.locator('.symbol-detail__chapter-links a').count();
  const scrollYBeforeSelect = await page.evaluate(() => window.scrollY);

  if (await orbitButtons.count() !== 9) failures.push(`symbols orbit button count mismatch: ${await orbitButtons.count()}`);
  if (await symbolPanels.count() !== 9) failures.push(`symbols panel count mismatch: ${await symbolPanels.count()}`);
  if (!await symbolField.isVisible()) failures.push('symbols active field is not visible');
  if (!initialDetail?.includes('Fish')) failures.push(`symbols initial detail mismatch: ${initialDetail}`);
  if (!initialFieldLabel?.includes('Piscean fish pair') || !initialFieldLabel?.includes('Chapter 6')) failures.push(`symbols initial field label mismatch: ${initialFieldLabel}`);
  if (initialActiveOrbitCount !== 1) failures.push(`symbols active orbit count mismatch: ${initialActiveOrbitCount}`);
  if (initialActivePanelCount !== 1) failures.push(`symbols active panel count mismatch: ${initialActivePanelCount}`);
  if (initialConceptCount < 4) failures.push(`symbols concept node count too low: ${initialConceptCount}`);
  if (initialChapterCount < 2) failures.push(`symbols chapter node count too low: ${initialChapterCount}`);
  if (initialChapterLinkCount < 2) failures.push(`symbols chapter link count too low: ${initialChapterLinkCount}`);

  const sophia = page.getByRole('button', { name: /Select Sophia:/ });
  await sophia.click();
  await page.waitForTimeout(100);

  const sophiaPressed = await sophia.getAttribute('aria-pressed');
  const sophiaDetail = await page.locator('#symbol-selected-detail h2').textContent();
  const sophiaField = page.getByRole('img', { name: /Sophia symbol field/ });
  const sophiaFieldLabel = await sophiaField.getAttribute('aria-label');
  const scrollYAfterSelect = await page.evaluate(() => window.scrollY);
  const sophiaChapterLinkVisible = await page.getByRole('link', { name: /03 · The Syzygy/ }).isVisible();

  if (sophiaPressed !== 'true') failures.push(`symbols Sophia orbit did not become active: ${sophiaPressed}`);
  if (!sophiaDetail?.includes('Sophia')) failures.push(`symbols detail did not follow Sophia selection: ${sophiaDetail}`);
  if (!sophiaFieldLabel?.includes('Sophia / wisdom figure') || !sophiaFieldLabel?.includes('Syzygy')) failures.push(`symbols Sophia field label mismatch: ${sophiaFieldLabel}`);
  if (!sophiaChapterLinkVisible) failures.push('symbols Sophia did not expose Chapter 3 link');
  if (scrollYAfterSelect > scrollYBeforeSelect + 10) failures.push(`symbols orbit selection unexpectedly scrolled page: ${scrollYAfterSelect}`);

  const lapisPanelButton = page.getByRole('button', { name: /Focus Lapis in the symbol field/ });
  await lapisPanelButton.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const lapisPanelPressed = await lapisPanelButton.getAttribute('aria-pressed');
  const lapisDetail = await page.locator('#symbol-selected-detail h2').textContent();
  const lapisFieldLabel = await page.getByRole('img', { name: /Lapis symbol field/ }).getAttribute('aria-label');

  if (lapisPanelPressed !== 'true') failures.push(`symbols Lapis panel did not become active: ${lapisPanelPressed}`);
  if (!lapisDetail?.includes('Lapis')) failures.push(`symbols detail did not follow Lapis panel selection: ${lapisDetail}`);
  if (!lapisFieldLabel?.includes('Lapis philosophorum') || !lapisFieldLabel?.toLowerCase().includes('individuation')) failures.push(`symbols Lapis field label mismatch: ${lapisFieldLabel}`);
}

async function smokeAboutOrientation(page, failures) {
  await gotoAppRoute(page, '/about');

  const title = await page.locator('h1').first().textContent();
  const orientation = page.getByRole('group', { name: /Aion orientation instrument/ });
  const field = page.getByRole('img', { name: /Aion learning orientation field/ });
  const modeButtons = page.locator('.about-orientation-node');
  const routeCards = page.locator('.about-route-card');
  const detail = page.locator('#about-orientation-detail');
  const routeCardHrefs = await routeCards.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const scrollYBeforeSelect = await page.evaluate(() => window.scrollY);

  if (!title?.includes('Aion visual atlas')) failures.push(`/about title mismatch: ${title}`);
  if (!await orientation.isVisible()) failures.push('/about orientation group is not visible');
  if (!await field.isVisible()) failures.push('/about orientation field is missing an accessible image role');
  if (await modeButtons.count() !== 4) failures.push(`/about mode button count mismatch: ${await modeButtons.count()}`);
  if (await routeCards.count() !== 4) failures.push(`/about route card count mismatch: ${await routeCards.count()}`);
  if (await detail.getAttribute('data-active-mode') !== 'study') failures.push(`/about initial detail mode mismatch: ${await detail.getAttribute('data-active-mode')}`);
  if (await page.locator('.about-orientation-node[aria-pressed="true"]').count() !== 1) failures.push('/about initial pressed mode count is not one');
  for (const expectedHref of ['/chapters', '/atlas', '/symbols', '/timeline']) {
    if (!routeCardHrefs.includes(expectedHref)) failures.push(`/about route cards missing href: ${expectedHref}`);
  }

  const nodeHitTargets = await modeButtons.evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return {
      name: button.getAttribute('aria-label') || button.textContent?.trim() || 'unknown',
      hit: button === target || button.contains(target),
    };
  }));
  for (const target of nodeHitTargets) {
    if (!target.hit) failures.push(`/about orientation node center is obstructed: ${target.name}`);
  }

  const mapButton = page.getByRole('button', { name: /Map: See concepts as relations/ });
  await mapButton.click();
  await page.waitForTimeout(100);
  const mapPressed = await mapButton.getAttribute('aria-pressed');
  const mapDetailMode = await detail.getAttribute('data-active-mode');
  const mapDetailTitle = await page.locator('#about-orientation-detail h2').textContent();
  const mapLinkHref = await page.locator('.about-orientation__link').getAttribute('href');
  if (mapPressed !== 'true') failures.push(`/about Map mode did not become pressed: ${mapPressed}`);
  if (mapDetailMode !== 'map') failures.push(`/about Map detail mode mismatch: ${mapDetailMode}`);
  if (!mapDetailTitle?.includes('See concepts as relations')) failures.push(`/about Map detail title mismatch: ${mapDetailTitle}`);
  if (mapLinkHref !== '/atlas') failures.push(`/about Map link href mismatch: ${mapLinkHref}`);

  const symbolizeButton = page.getByRole('button', { name: /Symbolize: Read images as carriers/ });
  await symbolizeButton.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const symbolizePressed = await symbolizeButton.getAttribute('aria-pressed');
  const symbolizeDetailMode = await detail.getAttribute('data-active-mode');
  const symbolizeDetailTitle = await page.locator('#about-orientation-detail h2').textContent();
  if (symbolizePressed !== 'true') failures.push(`/about Symbolize mode did not become pressed: ${symbolizePressed}`);
  if (symbolizeDetailMode !== 'symbolize') failures.push(`/about Symbolize detail mode mismatch: ${symbolizeDetailMode}`);
  if (!symbolizeDetailTitle?.includes('Read images as carriers')) failures.push(`/about Symbolize detail title mismatch: ${symbolizeDetailTitle}`);

  const verifyButton = page.getByRole('button', { name: /Verify: Keep the orientation honest/ });
  await verifyButton.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  const verifyPressed = await verifyButton.getAttribute('aria-pressed');
  const verifyDetailText = await detail.textContent();
  const scrollYAfterSelect = await page.evaluate(() => window.scrollY);
  if (verifyPressed !== 'true') failures.push(`/about Verify mode did not become pressed: ${verifyPressed}`);
  if (!verifyDetailText?.includes('Quality gate') || !verifyDetailText?.includes('Smoke, accessibility')) failures.push(`/about Verify evidence mismatch: ${verifyDetailText}`);
  if (scrollYAfterSelect > scrollYBeforeSelect + 10) failures.push(`/about mode selection unexpectedly scrolled page: ${scrollYAfterSelect}`);
  if (await page.locator('.about-orientation-node[aria-pressed="true"]').count() !== 1) failures.push('/about pressed mode count after interaction is not one');
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
  const chapterOneInstrumentCount = await page.locator('.chapter-one-reference').count();
  const chapterOneCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterOneAnimationParts = await page.locator('.chapter-one-reference *').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      className: node.className,
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterOneAnimatedParts = chapterOneAnimationParts.filter((motion) => motion.animationName !== 'none');
  const chapterOneTransitioningParts = chapterOneAnimationParts.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!fallbackVisible) failures.push('reduced-motion fallback is not visible for chapter scene');
  if (reducedMotionAttribute !== 'true') failures.push('chapter did not record reduced-motion state');
  if (!chapterReferenceVisible) failures.push('reduced-motion chapter reference map is not visible');
  if (chapterPauseControlCount !== 0) failures.push(`reduced-motion chapter rendered pause controls: ${chapterPauseControlCount}`);
  if (chapterOneCanvasCount !== 0) failures.push(`reduced-motion Chapter 1 rendered canvas: ${chapterOneCanvasCount}`);
  if (chapterOneInstrumentCount !== 1) failures.push(`reduced-motion Chapter 1 calibration instrument count mismatch: ${chapterOneInstrumentCount}`);
  if (chapterOneAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 1 calibration instrument still animates: ${JSON.stringify(chapterOneAnimatedParts)}`);
  if (chapterOneTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 1 calibration instrument still transitions: ${JSON.stringify(chapterOneTransitioningParts)}`);
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

  await gotoAppRoute(page, '/journey/chapter/ch9');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterNineFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterNineReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterNineReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterNineReferenceCount = await chapterNineReferenceNodes.count();
  const chapterNinePanelIds = await chapterNineReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterNinePauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterNineCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterNineFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterNineInstrumentCount = await page.locator('.ambivalent-fish-instrument').count();
  const chapterNineInstrumentMotion = await page.locator('.ambivalent-fish-instrument__field, .ambivalent-fish-instrument__mirror, .ambivalent-fish-instrument__ring, .ambivalent-fish-instrument__thread, .ambivalent-fish-instrument__fish, .ambivalent-fish-instrument__junction, .ambivalent-fish-instrument__shadow-core').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterNineAnimatedParts = chapterNineInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterNineTransitioningParts = chapterNineInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterNineFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 9 scene');
  if (chapterNineReducedMotionAttribute !== 'true') failures.push('Chapter 9 did not record reduced-motion state');
  if (chapterNineReferenceCount !== 3) failures.push(`reduced-motion Chapter 9 reference node count mismatch: ${chapterNineReferenceCount}`);
  if (chapterNinePanelIds.join(',') !== 'ambivalence,ouroboros,shadow-fish') failures.push(`reduced-motion Chapter 9 reference nodes out of order: ${chapterNinePanelIds.join(',')}`);
  if (chapterNinePauseControlCount !== 0) failures.push(`reduced-motion Chapter 9 rendered pause controls: ${chapterNinePauseControlCount}`);
  if (chapterNineCanvasCount !== 0) failures.push(`reduced-motion Chapter 9 rendered canvas: ${chapterNineCanvasCount}`);
  if (chapterNineInstrumentCount !== 1) failures.push(`reduced-motion Chapter 9 ambivalent fish instrument count mismatch: ${chapterNineInstrumentCount}`);
  if (chapterNineAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 9 ambivalent fish instrument still animates: ${JSON.stringify(chapterNineAnimatedParts)}`);
  if (chapterNineTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 9 ambivalent fish instrument still transitions: ${JSON.stringify(chapterNineTransitioningParts)}`);
  if (!chapterNineFallbackText?.includes('fish-serpent') || !chapterNineFallbackText?.includes('salvation and shadow')) {
    failures.push('reduced-motion chapter fallback lost Chapter 9 ambivalent fish teaching summary');
  }

  await page.setViewportSize(mobileViewport);
  await gotoAppRoute(page, '/journey/chapter/ch10');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterTenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterTenReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterTenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterTenReferenceCount = await chapterTenReferenceNodes.count();
  const chapterTenPanelIds = await chapterTenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterTenPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterTenCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterTenFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterTenFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterTenFallbackHeadingBox = await page.locator('.scene-host__fallback h2').boundingBox();
  const chapterTenFallbackBodyBox = await page.locator('.scene-host__fallback p:not(.eyebrow)').boundingBox();
  const chapterTenInstrumentCount = await page.locator('.alchemical-vessel-instrument').count();
  const chapterTenInstrumentBox = await page.locator('.alchemical-vessel-instrument').boundingBox();
  const chapterTenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterTenInstrumentMotion = await page.locator('.alchemical-vessel-instrument__field, .alchemical-vessel-instrument__heat, .alchemical-vessel-instrument__vessel, .alchemical-vessel-instrument__bath, .alchemical-vessel-instrument__fish, .alchemical-vessel-instrument__magnet, .alchemical-vessel-instrument__lapis, .alchemical-vessel-instrument__thread, .alchemical-vessel-instrument__particle, .alchemical-vessel-instrument__stages').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterTenAnimatedParts = chapterTenInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterTenTransitioningParts = chapterTenInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterTenFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 10 scene');
  if (chapterTenReducedMotionAttribute !== 'true') failures.push('Chapter 10 did not record reduced-motion state');
  if (chapterTenReferenceCount !== 3) failures.push(`reduced-motion Chapter 10 reference node count mismatch: ${chapterTenReferenceCount}`);
  if (chapterTenPanelIds.join(',') !== 'vessel,prima,opus') failures.push(`reduced-motion Chapter 10 reference nodes out of order: ${chapterTenPanelIds.join(',')}`);
  if (chapterTenPauseControlCount !== 0) failures.push(`reduced-motion Chapter 10 rendered pause controls: ${chapterTenPauseControlCount}`);
  if (chapterTenCanvasCount !== 0) failures.push(`reduced-motion Chapter 10 rendered canvas: ${chapterTenCanvasCount}`);
  if (chapterTenInstrumentCount !== 1) failures.push(`reduced-motion Chapter 10 alchemical vessel instrument count mismatch: ${chapterTenInstrumentCount}`);
  if (chapterTenAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 10 alchemical vessel instrument still animates: ${JSON.stringify(chapterTenAnimatedParts)}`);
  if (chapterTenTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 10 alchemical vessel instrument still transitions: ${JSON.stringify(chapterTenTransitioningParts)}`);
  if (!chapterTenFallbackText?.includes('alchemical vessel') || !chapterTenFallbackText?.includes('fish motif')) {
    failures.push('reduced-motion chapter fallback lost Chapter 10 alchemical vessel teaching summary');
  }
  if (!chapterTenFallbackHeadingBox || chapterTenFallbackHeadingBox.width < 20 || chapterTenFallbackHeadingBox.height < 8) {
    failures.push(`reduced-motion Chapter 10 fallback heading is not visibly rendered: ${chapterTenFallbackHeadingBox ? `${Math.round(chapterTenFallbackHeadingBox.width)}x${Math.round(chapterTenFallbackHeadingBox.height)}` : 'missing'}`);
  }
  if (!chapterTenFallbackBodyBox || chapterTenFallbackBodyBox.width < 40 || chapterTenFallbackBodyBox.height < 8) {
    failures.push(`reduced-motion Chapter 10 fallback body is not visibly rendered: ${chapterTenFallbackBodyBox ? `${Math.round(chapterTenFallbackBodyBox.width)}x${Math.round(chapterTenFallbackBodyBox.height)}` : 'missing'}`);
  }
  if (chapterTenFallbackBox && chapterTenInstrumentBox) {
    const instrumentBottom = chapterTenInstrumentBox.y + chapterTenInstrumentBox.height;
    if (chapterTenFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 10 fallback overlaps the alchemical vessel instrument on mobile: fallback top ${Math.round(chapterTenFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterTenFallbackBox && chapterTenReferenceMapBox) {
    const fallbackBottom = chapterTenFallbackBox.y + chapterTenFallbackBox.height;
    if (fallbackBottom > chapterTenReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 10 fallback overlaps the reference map on mobile: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterTenReferenceMapBox.y)}`);
    }
  }

  await gotoAppRoute(page, '/journey/chapter/ch11');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterElevenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterElevenReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterElevenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterElevenReferenceCount = await chapterElevenReferenceNodes.count();
  const chapterElevenPanelIds = await chapterElevenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterElevenPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterElevenCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterElevenFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterElevenFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterElevenFallbackHeadingBox = await page.locator('.scene-host__fallback h2').boundingBox();
  const chapterElevenFallbackBodyBox = await page.locator('.scene-host__fallback p:not(.eyebrow)').boundingBox();
  const chapterElevenInstrumentCount = await page.locator('.alchemical-tree-instrument').count();
  const chapterElevenInstrumentBox = await page.locator('.alchemical-tree-instrument').boundingBox();
  const chapterElevenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterElevenInstrumentMotion = await page.locator('.alchemical-tree-instrument__field, .alchemical-tree-instrument__root, .alchemical-tree-instrument__trunk, .alchemical-tree-instrument__branch, .alchemical-tree-instrument__thread, .alchemical-tree-instrument__mercurius, .alchemical-tree-instrument__wheel, .alchemical-tree-instrument__stage, .alchemical-tree-instrument__stone, .alchemical-tree-instrument__reflection').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterElevenAnimatedParts = chapterElevenInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterElevenTransitioningParts = chapterElevenInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterElevenFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 11 scene');
  if (chapterElevenReducedMotionAttribute !== 'true') failures.push('Chapter 11 did not record reduced-motion state');
  if (chapterElevenReferenceCount !== 3) failures.push(`reduced-motion Chapter 11 reference node count mismatch: ${chapterElevenReferenceCount}`);
  if (chapterElevenPanelIds.join(',') !== 'mercurius,opus-wheel,lapis') failures.push(`reduced-motion Chapter 11 reference nodes out of order: ${chapterElevenPanelIds.join(',')}`);
  if (chapterElevenPauseControlCount !== 0) failures.push(`reduced-motion Chapter 11 rendered pause controls: ${chapterElevenPauseControlCount}`);
  if (chapterElevenCanvasCount !== 0) failures.push(`reduced-motion Chapter 11 rendered canvas: ${chapterElevenCanvasCount}`);
  if (chapterElevenInstrumentCount !== 1) failures.push(`reduced-motion Chapter 11 alchemical tree instrument count mismatch: ${chapterElevenInstrumentCount}`);
  if (chapterElevenAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 11 alchemical tree instrument still animates: ${JSON.stringify(chapterElevenAnimatedParts)}`);
  if (chapterElevenTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 11 alchemical tree instrument still transitions: ${JSON.stringify(chapterElevenTransitioningParts)}`);
  if (!chapterElevenFallbackText?.includes('Mercurius') || !chapterElevenFallbackText?.includes('opus cycle')) {
    failures.push('reduced-motion chapter fallback lost Chapter 11 alchemical interpretation teaching summary');
  }
  if (!chapterElevenFallbackHeadingBox || chapterElevenFallbackHeadingBox.width < 20 || chapterElevenFallbackHeadingBox.height < 8) {
    failures.push(`reduced-motion Chapter 11 fallback heading is not visibly rendered: ${chapterElevenFallbackHeadingBox ? `${Math.round(chapterElevenFallbackHeadingBox.width)}x${Math.round(chapterElevenFallbackHeadingBox.height)}` : 'missing'}`);
  }
  if (!chapterElevenFallbackBodyBox || chapterElevenFallbackBodyBox.width < 40 || chapterElevenFallbackBodyBox.height < 8) {
    failures.push(`reduced-motion Chapter 11 fallback body is not visibly rendered: ${chapterElevenFallbackBodyBox ? `${Math.round(chapterElevenFallbackBodyBox.width)}x${Math.round(chapterElevenFallbackBodyBox.height)}` : 'missing'}`);
  }
  if (chapterElevenFallbackBox && chapterElevenInstrumentBox) {
    const instrumentBottom = chapterElevenInstrumentBox.y + chapterElevenInstrumentBox.height;
    if (chapterElevenFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 11 fallback overlaps the alchemical tree instrument on mobile: fallback top ${Math.round(chapterElevenFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterElevenFallbackBox && chapterElevenReferenceMapBox) {
    const fallbackBottom = chapterElevenFallbackBox.y + chapterElevenFallbackBox.height;
    if (fallbackBottom > chapterElevenReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 11 fallback overlaps the reference map on mobile: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterElevenReferenceMapBox.y)}`);
    }
  }

  await gotoAppRoute(page, '/journey/chapter/ch12');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterTwelveFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterTwelveReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterTwelveReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterTwelveReferenceCount = await chapterTwelveReferenceNodes.count();
  const chapterTwelvePanelIds = await chapterTwelveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterTwelvePauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterTwelveCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterTwelveFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterTwelveFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterTwelveFallbackHeadingBox = await page.locator('.scene-host__fallback h2').boundingBox();
  const chapterTwelveFallbackBodyBox = await page.locator('.scene-host__fallback p:not(.eyebrow)').boundingBox();
  const chapterTwelveInstrumentCount = await page.locator('.amplification-lens-instrument').count();
  const chapterTwelveInstrumentBox = await page.locator('.amplification-lens-instrument').boundingBox();
  const chapterTwelveReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterTwelveInstrumentMotion = await page.locator('.amplification-lens-instrument__field, .amplification-lens-instrument__source, .amplification-lens-instrument__root, .amplification-lens-instrument__split, .amplification-lens-instrument__image, .amplification-lens-instrument__projection, .amplification-lens-instrument__fish, .amplification-lens-instrument__bridge, .amplification-lens-instrument__lens, .amplification-lens-instrument__ring').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterTwelveAnimatedParts = chapterTwelveInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterTwelveTransitioningParts = chapterTwelveInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterTwelveFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 12 scene');
  if (chapterTwelveReducedMotionAttribute !== 'true') failures.push('Chapter 12 did not record reduced-motion state');
  if (chapterTwelveReferenceCount !== 3) failures.push(`reduced-motion Chapter 12 reference node count mismatch: ${chapterTwelveReferenceCount}`);
  if (chapterTwelvePanelIds.join(',') !== 'background,roots,bridge') failures.push(`reduced-motion Chapter 12 reference nodes out of order: ${chapterTwelvePanelIds.join(',')}`);
  if (chapterTwelvePauseControlCount !== 0) failures.push(`reduced-motion Chapter 12 rendered pause controls: ${chapterTwelvePauseControlCount}`);
  if (chapterTwelveCanvasCount !== 0) failures.push(`reduced-motion Chapter 12 rendered canvas: ${chapterTwelveCanvasCount}`);
  if (chapterTwelveInstrumentCount !== 1) failures.push(`reduced-motion Chapter 12 amplification lens instrument count mismatch: ${chapterTwelveInstrumentCount}`);
  if (chapterTwelveAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 12 amplification lens instrument still animates: ${JSON.stringify(chapterTwelveAnimatedParts)}`);
  if (chapterTwelveTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 12 amplification lens instrument still transitions: ${JSON.stringify(chapterTwelveTransitioningParts)}`);
  if (!chapterTwelveFallbackText?.includes('amplification lens') || !chapterTwelveFallbackText?.includes('shared roots')) {
    failures.push('reduced-motion chapter fallback lost Chapter 12 amplification lens teaching summary');
  }
  if (!chapterTwelveFallbackHeadingBox || chapterTwelveFallbackHeadingBox.width < 20 || chapterTwelveFallbackHeadingBox.height < 8) {
    failures.push(`reduced-motion Chapter 12 fallback heading is not visibly rendered: ${chapterTwelveFallbackHeadingBox ? `${Math.round(chapterTwelveFallbackHeadingBox.width)}x${Math.round(chapterTwelveFallbackHeadingBox.height)}` : 'missing'}`);
  }
  if (!chapterTwelveFallbackBodyBox || chapterTwelveFallbackBodyBox.width < 40 || chapterTwelveFallbackBodyBox.height < 8) {
    failures.push(`reduced-motion Chapter 12 fallback body is not visibly rendered: ${chapterTwelveFallbackBodyBox ? `${Math.round(chapterTwelveFallbackBodyBox.width)}x${Math.round(chapterTwelveFallbackBodyBox.height)}` : 'missing'}`);
  }
  if (chapterTwelveFallbackBox && chapterTwelveInstrumentBox) {
    const instrumentBottom = chapterTwelveInstrumentBox.y + chapterTwelveInstrumentBox.height;
    if (chapterTwelveFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 12 fallback overlaps the amplification lens instrument on mobile: fallback top ${Math.round(chapterTwelveFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterTwelveFallbackBox && chapterTwelveReferenceMapBox) {
    const fallbackBottom = chapterTwelveFallbackBox.y + chapterTwelveFallbackBox.height;
    if (fallbackBottom > chapterTwelveReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 12 fallback overlaps the reference map on mobile: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterTwelveReferenceMapBox.y)}`);
    }
  }

  await page.setViewportSize(narrowMobileViewport);
  await gotoAppRoute(page, '/journey/chapter/ch12');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterTwelveNarrowFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterTwelveNarrowCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterTwelveNarrowFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterTwelveNarrowInstrumentBox = await page.locator('.amplification-lens-instrument').boundingBox();
  const chapterTwelveNarrowReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterTwelveNarrowScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (!chapterTwelveNarrowFallbackVisible) failures.push('reduced-motion Chapter 12 fallback is not visible at 320x568');
  if (chapterTwelveNarrowCanvasCount !== 0) failures.push(`reduced-motion Chapter 12 rendered canvas at 320x568: ${chapterTwelveNarrowCanvasCount}`);
  if (chapterTwelveNarrowScrollWidth > narrowMobileViewport.width + 2) {
    failures.push(`reduced-motion Chapter 12 horizontal overflow at 320x568: ${chapterTwelveNarrowScrollWidth}`);
  }
  if (chapterTwelveNarrowFallbackBox && chapterTwelveNarrowInstrumentBox) {
    const instrumentBottom = chapterTwelveNarrowInstrumentBox.y + chapterTwelveNarrowInstrumentBox.height;
    if (chapterTwelveNarrowFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 12 fallback overlaps the amplification lens instrument at 320x568: fallback top ${Math.round(chapterTwelveNarrowFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterTwelveNarrowFallbackBox && chapterTwelveNarrowReferenceMapBox) {
    const fallbackBottom = chapterTwelveNarrowFallbackBox.y + chapterTwelveNarrowFallbackBox.height;
    if (fallbackBottom > chapterTwelveNarrowReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 12 fallback overlaps the reference map at 320x568: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterTwelveNarrowReferenceMapBox.y)}`);
    }
  }

  await page.setViewportSize(mobileViewport);
  await gotoAppRoute(page, '/journey/chapter/ch13');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterThirteenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterThirteenReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterThirteenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterThirteenReferenceCount = await chapterThirteenReferenceNodes.count();
  const chapterThirteenPanelIds = await chapterThirteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterThirteenPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterThirteenCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterThirteenFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterThirteenFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterThirteenFallbackHeadingBox = await page.locator('.scene-host__fallback h2').boundingBox();
  const chapterThirteenFallbackBodyBox = await page.locator('.scene-host__fallback p:not(.eyebrow)').boundingBox();
  const chapterThirteenInstrumentCount = await page.locator('.gnostic-constellation-instrument').count();
  const chapterThirteenInstrumentBox = await page.locator('.gnostic-constellation-instrument').boundingBox();
  const chapterThirteenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterThirteenInstrumentMotion = await page.locator('.gnostic-constellation-instrument__field, .gnostic-constellation-instrument__axis, .gnostic-constellation-instrument__emanation, .gnostic-constellation-instrument__layer, .gnostic-constellation-instrument__source, .gnostic-constellation-instrument__descent, .gnostic-constellation-instrument__sophia, .gnostic-constellation-instrument__quaternio, .gnostic-constellation-instrument__point, .gnostic-constellation-instrument__center, .gnostic-constellation-instrument__rupture, .gnostic-constellation-instrument__shard').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterThirteenAnimatedParts = chapterThirteenInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterThirteenTransitioningParts = chapterThirteenInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterThirteenFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 13 scene');
  if (chapterThirteenReducedMotionAttribute !== 'true') failures.push('Chapter 13 did not record reduced-motion state');
  if (chapterThirteenReferenceCount !== 3) failures.push(`reduced-motion Chapter 13 reference node count mismatch: ${chapterThirteenReferenceCount}`);
  if (chapterThirteenPanelIds.join(',') !== 'gnosis,quaternio,paradox') failures.push(`reduced-motion Chapter 13 reference nodes out of order: ${chapterThirteenPanelIds.join(',')}`);
  if (chapterThirteenPauseControlCount !== 0) failures.push(`reduced-motion Chapter 13 rendered pause controls: ${chapterThirteenPauseControlCount}`);
  if (chapterThirteenCanvasCount !== 0) failures.push(`reduced-motion Chapter 13 rendered canvas: ${chapterThirteenCanvasCount}`);
  if (chapterThirteenInstrumentCount !== 1) failures.push(`reduced-motion Chapter 13 Gnostic constellation instrument count mismatch: ${chapterThirteenInstrumentCount}`);
  if (chapterThirteenAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 13 Gnostic constellation instrument still animates: ${JSON.stringify(chapterThirteenAnimatedParts)}`);
  if (chapterThirteenTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 13 Gnostic constellation instrument still transitions: ${JSON.stringify(chapterThirteenTransitioningParts)}`);
  if (!chapterThirteenFallbackText?.includes('Gnostic constellation') || !chapterThirteenFallbackText?.includes('fourfold pattern') || !chapterThirteenFallbackText?.includes('rupture line')) {
    failures.push('reduced-motion chapter fallback lost Chapter 13 Gnostic constellation teaching summary');
  }
  if (!chapterThirteenFallbackHeadingBox || chapterThirteenFallbackHeadingBox.width < 20 || chapterThirteenFallbackHeadingBox.height < 8) {
    failures.push(`reduced-motion Chapter 13 fallback heading is not visibly rendered: ${chapterThirteenFallbackHeadingBox ? `${Math.round(chapterThirteenFallbackHeadingBox.width)}x${Math.round(chapterThirteenFallbackHeadingBox.height)}` : 'missing'}`);
  }
  if (!chapterThirteenFallbackBodyBox || chapterThirteenFallbackBodyBox.width < 40 || chapterThirteenFallbackBodyBox.height < 8) {
    failures.push(`reduced-motion Chapter 13 fallback body is not visibly rendered: ${chapterThirteenFallbackBodyBox ? `${Math.round(chapterThirteenFallbackBodyBox.width)}x${Math.round(chapterThirteenFallbackBodyBox.height)}` : 'missing'}`);
  }
  if (chapterThirteenFallbackBox && chapterThirteenInstrumentBox) {
    const instrumentBottom = chapterThirteenInstrumentBox.y + chapterThirteenInstrumentBox.height;
    if (chapterThirteenFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 13 fallback overlaps the Gnostic constellation instrument on mobile: fallback top ${Math.round(chapterThirteenFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterThirteenFallbackBox && chapterThirteenReferenceMapBox) {
    const fallbackBottom = chapterThirteenFallbackBox.y + chapterThirteenFallbackBox.height;
    if (fallbackBottom > chapterThirteenReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 13 fallback overlaps the reference map on mobile: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterThirteenReferenceMapBox.y)}`);
    }
  }

  await page.setViewportSize(narrowMobileViewport);
  await gotoAppRoute(page, '/journey/chapter/ch13');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterThirteenNarrowFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterThirteenNarrowCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterThirteenNarrowFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterThirteenNarrowInstrumentBox = await page.locator('.gnostic-constellation-instrument').boundingBox();
  const chapterThirteenNarrowReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterThirteenNarrowScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (!chapterThirteenNarrowFallbackVisible) failures.push('reduced-motion Chapter 13 fallback is not visible at 320x568');
  if (chapterThirteenNarrowCanvasCount !== 0) failures.push(`reduced-motion Chapter 13 rendered canvas at 320x568: ${chapterThirteenNarrowCanvasCount}`);
  if (chapterThirteenNarrowScrollWidth > narrowMobileViewport.width + 2) {
    failures.push(`reduced-motion Chapter 13 horizontal overflow at 320x568: ${chapterThirteenNarrowScrollWidth}`);
  }
  if (chapterThirteenNarrowFallbackBox && chapterThirteenNarrowInstrumentBox) {
    const instrumentBottom = chapterThirteenNarrowInstrumentBox.y + chapterThirteenNarrowInstrumentBox.height;
    if (chapterThirteenNarrowFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 13 fallback overlaps the Gnostic constellation instrument at 320x568: fallback top ${Math.round(chapterThirteenNarrowFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterThirteenNarrowFallbackBox && chapterThirteenNarrowReferenceMapBox) {
    const fallbackBottom = chapterThirteenNarrowFallbackBox.y + chapterThirteenNarrowFallbackBox.height;
    if (fallbackBottom > chapterThirteenNarrowReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 13 fallback overlaps the reference map at 320x568: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterThirteenNarrowReferenceMapBox.y)}`);
    }
  }

  await page.setViewportSize(mobileViewport);
  await gotoAppRoute(page, '/journey/chapter/ch14');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterFourteenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterFourteenReducedMotionAttribute = await page.locator('.chapter-experience').getAttribute('data-reduced-motion');
  const chapterFourteenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterFourteenReferenceCount = await chapterFourteenReferenceNodes.count();
  const chapterFourteenPanelIds = await chapterFourteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterFourteenPauseControlCount = await page.locator('.scene-host__pause').count();
  const chapterFourteenCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterFourteenFallbackText = await page.locator('.scene-host__fallback').textContent();
  const chapterFourteenFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterFourteenFallbackHeadingBox = await page.locator('.scene-host__fallback h2').boundingBox();
  const chapterFourteenFallbackBodyBox = await page.locator('.scene-host__fallback p:not(.eyebrow)').boundingBox();
  const chapterFourteenInstrumentCount = await page.locator('.final-synthesis-instrument').count();
  const chapterFourteenInstrumentBox = await page.locator('.final-synthesis-instrument').boundingBox();
  const chapterFourteenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterFourteenInstrumentMotion = await page.locator('.final-synthesis-instrument__field, .final-synthesis-instrument__axis, .final-synthesis-instrument__orbit, .final-synthesis-instrument__motif-ring, .final-synthesis-instrument__motif, .final-synthesis-instrument__quaternity, .final-synthesis-instrument__point, .final-synthesis-instrument__ego, .final-synthesis-instrument__self, .final-synthesis-instrument__path, .final-synthesis-instrument__mark').evaluateAll((nodes) => nodes.map((node) => {
    const styles = window.getComputedStyle(node);
    return {
      animationName: styles.animationName,
      transitionDuration: styles.transitionDuration,
    };
  }));
  const chapterFourteenAnimatedParts = chapterFourteenInstrumentMotion.filter((motion) => motion.animationName !== 'none');
  const chapterFourteenTransitioningParts = chapterFourteenInstrumentMotion.filter((motion) => !motion.transitionDuration.split(',').every((duration) => duration.trim() === '0s'));

  if (!chapterFourteenFallbackVisible) failures.push('reduced-motion fallback is not visible for Chapter 14 scene');
  if (chapterFourteenReducedMotionAttribute !== 'true') failures.push('Chapter 14 did not record reduced-motion state');
  if (chapterFourteenReferenceCount !== 3) failures.push(`reduced-motion Chapter 14 reference node count mismatch: ${chapterFourteenReferenceCount}`);
  if (chapterFourteenPanelIds.join(',') !== 'gather,axis,aeon') failures.push(`reduced-motion Chapter 14 reference nodes out of order: ${chapterFourteenPanelIds.join(',')}`);
  if (chapterFourteenPauseControlCount !== 0) failures.push(`reduced-motion Chapter 14 rendered pause controls: ${chapterFourteenPauseControlCount}`);
  if (chapterFourteenCanvasCount !== 0) failures.push(`reduced-motion Chapter 14 rendered canvas: ${chapterFourteenCanvasCount}`);
  if (chapterFourteenInstrumentCount !== 1) failures.push(`reduced-motion Chapter 14 final synthesis instrument count mismatch: ${chapterFourteenInstrumentCount}`);
  if (chapterFourteenAnimatedParts.length > 0) failures.push(`reduced-motion Chapter 14 final synthesis instrument still animates: ${JSON.stringify(chapterFourteenAnimatedParts)}`);
  if (chapterFourteenTransitioningParts.length > 0) failures.push(`reduced-motion Chapter 14 final synthesis instrument still transitions: ${JSON.stringify(chapterFourteenTransitioningParts)}`);
  if (!chapterFourteenFallbackText?.includes('final synthesis mandala') || !chapterFourteenFallbackText?.includes('fourfold ordering field') || !chapterFourteenFallbackText?.includes('individuation')) {
    failures.push('reduced-motion chapter fallback lost Chapter 14 final synthesis teaching summary');
  }
  if (!chapterFourteenFallbackHeadingBox || chapterFourteenFallbackHeadingBox.width < 20 || chapterFourteenFallbackHeadingBox.height < 8) {
    failures.push(`reduced-motion Chapter 14 fallback heading is not visibly rendered: ${chapterFourteenFallbackHeadingBox ? `${Math.round(chapterFourteenFallbackHeadingBox.width)}x${Math.round(chapterFourteenFallbackHeadingBox.height)}` : 'missing'}`);
  }
  if (!chapterFourteenFallbackBodyBox || chapterFourteenFallbackBodyBox.width < 40 || chapterFourteenFallbackBodyBox.height < 8) {
    failures.push(`reduced-motion Chapter 14 fallback body is not visibly rendered: ${chapterFourteenFallbackBodyBox ? `${Math.round(chapterFourteenFallbackBodyBox.width)}x${Math.round(chapterFourteenFallbackBodyBox.height)}` : 'missing'}`);
  }
  if (chapterFourteenFallbackBox && chapterFourteenInstrumentBox) {
    const instrumentBottom = chapterFourteenInstrumentBox.y + chapterFourteenInstrumentBox.height;
    if (chapterFourteenFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 14 fallback overlaps the final synthesis instrument on mobile: fallback top ${Math.round(chapterFourteenFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterFourteenFallbackBox && chapterFourteenReferenceMapBox) {
    const fallbackBottom = chapterFourteenFallbackBox.y + chapterFourteenFallbackBox.height;
    if (fallbackBottom > chapterFourteenReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 14 fallback overlaps the reference map on mobile: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterFourteenReferenceMapBox.y)}`);
    }
  }

  await page.setViewportSize(narrowMobileViewport);
  await gotoAppRoute(page, '/journey/chapter/ch14');
  await page.locator('.scene-host__fallback').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterFourteenNarrowFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  const chapterFourteenNarrowCanvasCount = await page.locator('.scene-host canvas').count();
  const chapterFourteenNarrowFallbackBox = await page.locator('.scene-host__fallback').boundingBox();
  const chapterFourteenNarrowInstrumentBox = await page.locator('.final-synthesis-instrument').boundingBox();
  const chapterFourteenNarrowReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
  const chapterFourteenNarrowScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (!chapterFourteenNarrowFallbackVisible) failures.push('reduced-motion Chapter 14 fallback is not visible at 320x568');
  if (chapterFourteenNarrowCanvasCount !== 0) failures.push(`reduced-motion Chapter 14 rendered canvas at 320x568: ${chapterFourteenNarrowCanvasCount}`);
  if (chapterFourteenNarrowScrollWidth > narrowMobileViewport.width + 2) {
    failures.push(`reduced-motion Chapter 14 horizontal overflow at 320x568: ${chapterFourteenNarrowScrollWidth}`);
  }
  if (chapterFourteenNarrowFallbackBox && chapterFourteenNarrowInstrumentBox) {
    const instrumentBottom = chapterFourteenNarrowInstrumentBox.y + chapterFourteenNarrowInstrumentBox.height;
    if (chapterFourteenNarrowFallbackBox.y < instrumentBottom + 6) {
      failures.push(`reduced-motion Chapter 14 fallback overlaps the final synthesis instrument at 320x568: fallback top ${Math.round(chapterFourteenNarrowFallbackBox.y)}, instrument bottom ${Math.round(instrumentBottom)}`);
    }
  }
  if (chapterFourteenNarrowFallbackBox && chapterFourteenNarrowReferenceMapBox) {
    const fallbackBottom = chapterFourteenNarrowFallbackBox.y + chapterFourteenNarrowFallbackBox.height;
    if (fallbackBottom > chapterFourteenNarrowReferenceMapBox.y - 6) {
      failures.push(`reduced-motion Chapter 14 fallback overlaps the reference map at 320x568: fallback bottom ${Math.round(fallbackBottom)}, map top ${Math.round(chapterFourteenNarrowReferenceMapBox.y)}`);
    }
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
  await scrollSceneControlIntoView(locator);
  await locator.click({ timeout: 30_000 });
}

async function scrollSceneControlIntoView(locator) {
  await locator.waitFor({ state: 'visible', timeout: 30_000 });
  await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const isVisibleInViewport = rect.top >= 0
      && rect.left >= 0
      && rect.bottom <= window.innerHeight
      && rect.right <= window.innerWidth;
    if (!isVisibleInViewport) {
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
  });
}

async function assertChapterOneInstrumentState(page, failures, expected) {
  const instrumentGroup = page.getByRole('group', { name: /The Ego calibration instrument/ });
  const instrumentImage = page.getByRole('img', { name: /Ego depth model/ });
  const readout = page.locator('.chapter-one-reference__readout');
  const groupPanel = await instrumentGroup.getAttribute('data-active-panel');
  const imageLabel = await instrumentImage.getAttribute('aria-label');
  const readoutText = await readout.textContent();
  const activeStepCount = await page.locator('.chapter-one-reference__step--active').count();
  const ariaCurrentStepCount = await page.locator('.chapter-one-reference__step[aria-current="step"]').count();

  if (groupPanel !== expected.panelId) failures.push(`chapter 1 calibration instrument panel mismatch: ${groupPanel}`);
  if (activeStepCount !== 1) failures.push(`chapter 1 calibration active step count mismatch: ${activeStepCount}`);
  if (ariaCurrentStepCount !== 1) failures.push(`chapter 1 calibration aria-current count mismatch: ${ariaCurrentStepCount}`);
  if (!imageLabel?.includes(`Current emphasis: ${expected.emphasis}`)) {
    failures.push(`chapter 1 calibration image label did not follow ${expected.emphasis}: ${imageLabel}`);
  }
  if (!imageLabel?.includes(expected.insight)) {
    failures.push(`chapter 1 calibration image label lost insight for ${expected.emphasis}: ${imageLabel}`);
  }
  if (!readoutText?.includes(expected.insight)) {
    failures.push(`chapter 1 calibration readout did not follow ${expected.emphasis}: ${readoutText}`);
  }
}

async function smokeChapterSceneControls(page, failures) {
  await gotoAppRoute(page, '/journey/chapter/ch1');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterOneReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterOneReferenceCount = await chapterOneReferenceNodes.count();
  const chapterOnePanelIds = await chapterOneReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterOneInstrumentVisible = await page.getByRole('group', { name: /The Ego calibration instrument/ }).isVisible();
  const chapterOneModelVisible = await page.getByRole('img', { name: /Ego depth model/ }).isVisible();

  if (chapterOneReferenceCount !== 3) failures.push(`chapter 1 reference node count mismatch: ${chapterOneReferenceCount}`);
  if (chapterOnePanelIds.join(',') !== 'ego-light,roots,self-depth') failures.push(`chapter 1 reference nodes out of order: ${chapterOnePanelIds.join(',')}`);
  if (!chapterOneInstrumentVisible) failures.push('chapter 1 calibration instrument group is not visible');
  if (!chapterOneModelVisible) failures.push('chapter 1 ego depth model image is not visible');
  await assertChapterOneInstrumentState(page, failures, {
    panelId: 'ego-light',
    emphasis: 'Orientation',
    insight: 'The ego is necessary, but not total.',
  });

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
  await assertChapterOneInstrumentState(page, failures, {
    panelId: 'roots',
    emphasis: 'Depth',
    insight: 'Consciousness rests on what it cannot fully command.',
  });
  if (rootsReferencePressed !== 'true') failures.push(`chapter 1 reference node did not become active: ${rootsReferencePressed}`);
  if (rootsAnnotationState.egoVisible) failures.push('chapter 1 timed ego annotation stayed visible after selecting roots');
  if (!rootsAnnotationState.rootsPanelVisible) failures.push('chapter 1 roots annotation did not follow selected panel');

  const wholeness = page.getByRole('button', { name: /03\s+Wholeness/ });
  await activateSceneButton(wholeness);
  await page.waitForTimeout(250);

  const pressed = await wholeness.getAttribute('aria-pressed');
  const scrollY = await page.evaluate(() => window.scrollY);
  const sceneDescription = await page.locator('#scene-host-description-ch1').textContent();
  const wholenessPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="self-depth"]').count();
  await assertChapterOneInstrumentState(page, failures, {
    panelId: 'self-depth',
    emphasis: 'Wholeness',
    insight: 'The journey starts by scaling the I correctly.',
  });
  if (pressed !== 'true') failures.push(`chapter scene control did not become active: ${pressed}`);
  if (wholenessPanelActive !== 1) failures.push(`chapter 1 Wholeness panel did not become active: ${wholenessPanelActive}`);
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
  await scrollSceneControlIntoView(fourth);
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
  await scrollSceneControlIntoView(tree);
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
  await scrollSceneControlIntoView(zodiac);
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
  await scrollSceneControlIntoView(threshold);
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
  const [earlyCarrierOpacity, earlyThreadOpacity, earlyFishOpacity] = earlyImageVisualState;
  const earlyCarrierVisible = earlyCarrierOpacity >= 0.3;
  const earlySignalVisible = earlyThreadOpacity >= 0.45 && earlyFishOpacity >= 0.45;
  if (earlyImageVisualState.length !== 3 || !earlyCarrierVisible || !earlySignalVisible) {
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
  const [afterlifeDepthOpacity, afterlifeThreadOpacity, afterlifeLayerFourOpacity, afterlifeLayerFiveOpacity] = afterlifeVisualState;
  const afterlifeDepthVisible = afterlifeDepthOpacity >= 0.45 && afterlifeThreadOpacity >= 0.45;
  const afterlifeLayersVisible = afterlifeLayerFourOpacity >= 0.3 && afterlifeLayerFiveOpacity >= 0.3;
  if (afterlifeVisualState.length !== 4 || !afterlifeDepthVisible || !afterlifeLayersVisible) {
    failures.push(`chapter 8 historical strata instrument did not visually emphasize afterlife/depth: ${afterlifeVisualState.join(',')}`);
  }
  if (!afterlifeDescription?.includes('Afterlife: Old images keep speaking')) failures.push(`chapter 8 scene description did not follow afterlife panel: ${afterlifeDescription}`);
  if (chapterEightScrollY > 10) failures.push(`chapter 8 scene control unexpectedly scrolled page: ${chapterEightScrollY}`);

  const chapterEightCanvas = page.locator('.scene-host canvas').first();
  const chapterEightCanvasBox = await chapterEightCanvas.boundingBox();
  const chapterEightPixelSample = await waitForCanvasPixels(chapterEightCanvas);
  const chapterEightStyleCount = await page.locator('style#ch8-anim-style').count();
  if (!chapterEightCanvasBox || chapterEightCanvasBox.width < 300 || chapterEightCanvasBox.height < 300) {
    failures.push(`chapter 8 canvas geometry too small: ${chapterEightCanvasBox ? `${Math.round(chapterEightCanvasBox.width)}x${Math.round(chapterEightCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 8', chapterEightPixelSample);
  if (chapterEightStyleCount !== 1) failures.push(`chapter 8 injected style count mismatch: ${chapterEightStyleCount}`);

  await gotoAppRoute(page, '/journey/chapter/ch9');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterNineReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterNineReferenceCount = await chapterNineReferenceNodes.count();
  const chapterNinePanelIds = await chapterNineReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterNineInstrument = page.locator('.ambivalent-fish-instrument');
  const chapterNineInstrumentCount = await chapterNineInstrument.count();
  const chapterNineInstrumentRole = await chapterNineInstrument.getAttribute('role');
  const chapterNineInstrumentLabel = await chapterNineInstrument.getAttribute('aria-label');
  const chapterNineInstrumentPanel = await chapterNineInstrument.getAttribute('data-active-panel');
  const chapterNineInstrumentFieldCount = await page.locator('.ambivalent-fish-instrument__field').count();
  const chapterNineInstrumentMirrorCount = await page.locator('.ambivalent-fish-instrument__mirror').count();
  const chapterNineInstrumentRingCount = await page.locator('.ambivalent-fish-instrument__ring').count();
  const chapterNineInstrumentFishCount = await page.locator('.ambivalent-fish-instrument__fish').count();
  const chapterNineInstrumentJunctionCount = await page.locator('.ambivalent-fish-instrument__junction').count();
  const chapterNineInstrumentShadowCoreCount = await page.locator('.ambivalent-fish-instrument__shadow-core').count();
  const chapterNineInstrumentLabelCount = await page.locator('.ambivalent-fish-instrument__label').count();
  const chapterNineInitialDescription = await page.locator('#scene-host-description-ch9').textContent();
  const chapterNineInstrumentMarksVisible = await page.locator('.ambivalent-fish-instrument__field, .ambivalent-fish-instrument__mirror, .ambivalent-fish-instrument__ring, .ambivalent-fish-instrument__thread, .ambivalent-fish-instrument__fish, .ambivalent-fish-instrument__junction, .ambivalent-fish-instrument__shadow-core').evaluateAll((nodes) => nodes.length >= 10 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterNineReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="ambivalence"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="ouroboros"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="shadow-fish"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));

  if (chapterNineReferenceCount !== 3) failures.push(`chapter 9 reference node count mismatch: ${chapterNineReferenceCount}`);
  if (chapterNinePanelIds.join(',') !== 'ambivalence,ouroboros,shadow-fish') failures.push(`chapter 9 reference nodes out of order: ${chapterNinePanelIds.join(',')}`);
  if (chapterNineInstrumentCount !== 1) failures.push(`chapter 9 ambivalent fish instrument count mismatch: ${chapterNineInstrumentCount}`);
  if (chapterNineInstrumentFieldCount !== 2) failures.push(`chapter 9 ambivalent fish instrument field count mismatch: ${chapterNineInstrumentFieldCount}`);
  if (chapterNineInstrumentMirrorCount !== 1) failures.push(`chapter 9 ambivalent fish instrument mirror count mismatch: ${chapterNineInstrumentMirrorCount}`);
  if (chapterNineInstrumentRingCount !== 2) failures.push(`chapter 9 ambivalent fish instrument ring count mismatch: ${chapterNineInstrumentRingCount}`);
  if (chapterNineInstrumentFishCount !== 2) failures.push(`chapter 9 ambivalent fish instrument fish count mismatch: ${chapterNineInstrumentFishCount}`);
  if (chapterNineInstrumentJunctionCount !== 1) failures.push(`chapter 9 ambivalent fish instrument junction count mismatch: ${chapterNineInstrumentJunctionCount}`);
  if (chapterNineInstrumentShadowCoreCount !== 1) failures.push(`chapter 9 ambivalent fish instrument shadow core count mismatch: ${chapterNineInstrumentShadowCoreCount}`);
  if (chapterNineInstrumentLabelCount !== 3) failures.push(`chapter 9 ambivalent fish instrument label count mismatch: ${chapterNineInstrumentLabelCount}`);
  if (chapterNineInstrumentRole !== 'img') failures.push(`chapter 9 ambivalent fish instrument role mismatch: ${chapterNineInstrumentRole}`);
  if (!chapterNineInstrumentLabel?.includes('Ambivalent fish model') || !chapterNineInstrumentLabel?.includes('blessing and threat') || !chapterNineInstrumentLabel?.includes('Current emphasis: Paradox')) {
    failures.push(`chapter 9 ambivalent fish instrument label missing teaching text: ${chapterNineInstrumentLabel}`);
  }
  if (chapterNineInstrumentPanel !== 'ambivalence') failures.push(`chapter 9 ambivalent fish instrument did not start on ambivalence panel: ${chapterNineInstrumentPanel}`);
  if (!chapterNineInitialDescription?.includes('Paradox: The fish has a double edge')) failures.push(`chapter 9 initial scene description mismatch: ${chapterNineInitialDescription}`);
  if (!chapterNineInstrumentMarksVisible) failures.push('chapter 9 ambivalent fish instrument marks are not visibly rendered');
  if (!chapterNineReferenceGlyphsVisible) failures.push('chapter 9 reference glyphs are not visibly rendered');

  const ouroboros = page.locator('.chapter-stage__reference-node[data-panel-id="ouroboros"]');
  await ouroboros.waitFor({ state: 'visible', timeout: 30_000 });
  await ouroboros.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const ouroborosPressed = await ouroboros.getAttribute('aria-pressed');
  const ouroborosPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="ouroboros"]').count();
  const ouroborosDescription = await page.locator('#scene-host-description-ch9').textContent();
  const ouroborosInstrumentPanel = await chapterNineInstrument.getAttribute('data-active-panel');
  const ouroborosInstrumentLabel = await chapterNineInstrument.getAttribute('aria-label');
  const ouroborosVisualState = await page.locator('.ambivalent-fish-instrument__ring--outer, .ambivalent-fish-instrument__ring--inner, .ambivalent-fish-instrument__thread, .ambivalent-fish-instrument__junction').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (ouroborosPressed !== 'true') failures.push(`chapter 9 ouroboros reference did not become active: ${ouroborosPressed}`);
  if (ouroborosPanelActive !== 1) failures.push(`chapter 9 ouroboros panel did not become active: ${ouroborosPanelActive}`);
  if (ouroborosInstrumentPanel !== 'ouroboros') failures.push(`chapter 9 ambivalent fish instrument did not follow ouroboros panel: ${ouroborosInstrumentPanel}`);
  if (!ouroborosInstrumentLabel?.includes('Current emphasis: Return') || !ouroborosInstrumentLabel?.includes('The psyche circles what it cannot solve linearly')) {
    failures.push(`chapter 9 ambivalent fish instrument label did not follow ouroboros panel: ${ouroborosInstrumentLabel}`);
  }
  if (ouroborosVisualState.length !== 4 || !ouroborosVisualState.every((opacity) => opacity >= 0.65)) {
    failures.push(`chapter 9 ambivalent fish instrument did not visually emphasize return: ${ouroborosVisualState.join(',')}`);
  }
  if (!ouroborosDescription?.includes('Return: The image eats its tail')) failures.push(`chapter 9 scene description did not follow ouroboros panel: ${ouroborosDescription}`);

  const shadowFish = page.locator('.chapter-stage__reference-node[data-panel-id="shadow-fish"]');
  await shadowFish.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const shadowFishPressed = await shadowFish.getAttribute('aria-pressed');
  const shadowFishPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="shadow-fish"]').count();
  const shadowFishDescription = await page.locator('#scene-host-description-ch9').textContent();
  const shadowFishInstrumentPanel = await chapterNineInstrument.getAttribute('data-active-panel');
  const shadowFishInstrumentLabel = await chapterNineInstrument.getAttribute('aria-label');
  const shadowFishVisualState = await page.locator('.ambivalent-fish-instrument__field--shadow, .ambivalent-fish-instrument__shadow-core, .ambivalent-fish-instrument__fish--shadow, .ambivalent-fish-instrument__mirror').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  const chapterNineScrollY = await page.evaluate(() => window.scrollY);
  if (shadowFishPressed !== 'true') failures.push(`chapter 9 scene control did not become active: ${shadowFishPressed}`);
  if (shadowFishPanelActive !== 1) failures.push(`chapter 9 shadow fish panel did not become active: ${shadowFishPanelActive}`);
  if (shadowFishInstrumentPanel !== 'shadow-fish') failures.push(`chapter 9 ambivalent fish instrument did not follow shadow fish panel: ${shadowFishInstrumentPanel}`);
  if (!shadowFishInstrumentLabel?.includes('Current emphasis: Shadow') || !shadowFishInstrumentLabel?.includes('A total image includes its antagonist')) {
    failures.push(`chapter 9 ambivalent fish instrument label did not follow shadow fish panel: ${shadowFishInstrumentLabel}`);
  }
  if (shadowFishVisualState.length !== 4 || !shadowFishVisualState.every((opacity) => opacity >= 0.65)) {
    failures.push(`chapter 9 ambivalent fish instrument did not visually emphasize shadow fish: ${shadowFishVisualState.join(',')}`);
  }
  if (!shadowFishDescription?.includes('Shadow: Light casts its fish-shadow')) failures.push(`chapter 9 scene description did not follow shadow fish panel: ${shadowFishDescription}`);
  if (chapterNineScrollY > 10) failures.push(`chapter 9 scene control unexpectedly scrolled page: ${chapterNineScrollY}`);

  const chapterNineCanvas = page.locator('.scene-host canvas').first();
  const chapterNineCanvasBox = await chapterNineCanvas.boundingBox();
  const chapterNinePixelSample = await waitForCanvasPixels(chapterNineCanvas);
  if (!chapterNineCanvasBox || chapterNineCanvasBox.width < 300 || chapterNineCanvasBox.height < 300) {
    failures.push(`chapter 9 canvas geometry too small: ${chapterNineCanvasBox ? `${Math.round(chapterNineCanvasBox.width)}x${Math.round(chapterNineCanvasBox.height)}` : 'missing'}`);
  }
  recordCanvasPixelFailure(failures, 'chapter 9', chapterNinePixelSample);

  await gotoAppRoute(page, '/journey/chapter/ch10');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterTenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterTenReferenceCount = await chapterTenReferenceNodes.count();
  const chapterTenPanelIds = await chapterTenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterTenInstrument = page.locator('.alchemical-vessel-instrument');
  const chapterTenInstrumentCount = await chapterTenInstrument.count();
  const chapterTenInstrumentRole = await chapterTenInstrument.getAttribute('role');
  const chapterTenInstrumentLabel = await chapterTenInstrument.getAttribute('aria-label');
  const chapterTenInstrumentPanel = await chapterTenInstrument.getAttribute('data-active-panel');
  const chapterTenInstrumentStageCount = await page.locator('.alchemical-vessel-instrument__stage').count();
  const chapterTenInstrumentParticleCount = await page.locator('.alchemical-vessel-instrument__particle').count();
  const chapterTenInstrumentLabelCount = await page.locator('.alchemical-vessel-instrument__label').count();
  const chapterTenInitialDescription = await page.locator('#scene-host-description-ch10').textContent();
  const chapterTenInstrumentMarksVisible = await page.locator('.alchemical-vessel-instrument__field, .alchemical-vessel-instrument__heat, .alchemical-vessel-instrument__vessel, .alchemical-vessel-instrument__bath, .alchemical-vessel-instrument__fish, .alchemical-vessel-instrument__magnet, .alchemical-vessel-instrument__lapis, .alchemical-vessel-instrument__thread, .alchemical-vessel-instrument__particle, .alchemical-vessel-instrument__stages').evaluateAll((nodes) => nodes.length >= 14 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterTenReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="vessel"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="prima"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="opus"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.length === 3 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const before = window.getComputedStyle(node, '::before');
    const after = window.getComputedStyle(node, '::after');
    return styles.display !== 'none'
      && Number(styles.opacity) > 0
      && box.width > 0
      && box.height > 0
      && before.content !== 'none'
      && after.content !== 'none'
      && Number.parseFloat(before.width) > 0
      && Number.parseFloat(before.height) > 0
      && Number.parseFloat(after.width) > 0
      && Number.parseFloat(after.height) > 0;
  }));

  if (chapterTenReferenceCount !== 3) failures.push(`chapter 10 reference node count mismatch: ${chapterTenReferenceCount}`);
  if (chapterTenPanelIds.join(',') !== 'vessel,prima,opus') failures.push(`chapter 10 reference nodes out of order: ${chapterTenPanelIds.join(',')}`);
  if (chapterTenInstrumentCount !== 1) failures.push(`chapter 10 alchemical vessel instrument count mismatch: ${chapterTenInstrumentCount}`);
  if (chapterTenInstrumentStageCount !== 4) failures.push(`chapter 10 alchemical vessel stage count mismatch: ${chapterTenInstrumentStageCount}`);
  if (chapterTenInstrumentParticleCount !== 4) failures.push(`chapter 10 alchemical vessel particle count mismatch: ${chapterTenInstrumentParticleCount}`);
  if (chapterTenInstrumentLabelCount !== 3) failures.push(`chapter 10 alchemical vessel label count mismatch: ${chapterTenInstrumentLabelCount}`);
  if (chapterTenInstrumentRole !== 'img') failures.push(`chapter 10 alchemical vessel instrument role mismatch: ${chapterTenInstrumentRole}`);
  if (!chapterTenInstrumentLabel?.includes('Alchemical vessel model') || !chapterTenInstrumentLabel?.includes('fish-symbol enters') || !chapterTenInstrumentLabel?.includes('Current emphasis: Alchemy')) {
    failures.push(`chapter 10 alchemical vessel instrument label missing teaching text: ${chapterTenInstrumentLabel}`);
  }
  if (chapterTenInstrumentPanel !== 'vessel') failures.push(`chapter 10 alchemical vessel instrument did not start on vessel panel: ${chapterTenInstrumentPanel}`);
  if (!chapterTenInitialDescription?.includes('Alchemy: The fish enters the opus')) failures.push(`chapter 10 initial scene description mismatch: ${chapterTenInitialDescription}`);
  if (!chapterTenInstrumentMarksVisible) failures.push('chapter 10 alchemical vessel instrument marks are not visibly rendered');
  if (!chapterTenReferenceGlyphsVisible) failures.push('chapter 10 reference glyphs are not visibly rendered');

  const prima = page.locator('.chapter-stage__reference-node[data-panel-id="prima"]');
  await prima.waitFor({ state: 'visible', timeout: 30_000 });
  await prima.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const primaPressed = await prima.getAttribute('aria-pressed');
  const primaPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="prima"]').count();
  const primaDescription = await page.locator('#scene-host-description-ch10').textContent();
  const primaInstrumentPanel = await chapterTenInstrument.getAttribute('data-active-panel');
  const primaInstrumentLabel = await chapterTenInstrument.getAttribute('aria-label');
  const primaVisualState = await page.locator('.alchemical-vessel-instrument__bath, .alchemical-vessel-instrument__magnet, .alchemical-vessel-instrument__particle').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (primaPressed !== 'true') failures.push(`chapter 10 prima reference did not become active: ${primaPressed}`);
  if (primaPanelActive !== 1) failures.push(`chapter 10 prima panel did not become active: ${primaPanelActive}`);
  if (primaInstrumentPanel !== 'prima') failures.push(`chapter 10 alchemical vessel instrument did not follow prima panel: ${primaInstrumentPanel}`);
  if (!primaInstrumentLabel?.includes('Current emphasis: Prima Materia') || !primaInstrumentLabel?.includes('The raw state is not a mistake')) {
    failures.push(`chapter 10 alchemical vessel instrument label did not follow prima panel: ${primaInstrumentLabel}`);
  }
  if (primaVisualState.length !== 6 || !primaVisualState.every((opacity) => opacity >= 0.62)) {
    failures.push(`chapter 10 alchemical vessel instrument did not visually emphasize prima materia: ${primaVisualState.join(',')}`);
  }
  if (!primaDescription?.includes('Prima Materia: Begin with the mixed thing')) failures.push(`chapter 10 scene description did not follow prima panel: ${primaDescription}`);

  const opus = page.locator('.chapter-stage__reference-node[data-panel-id="opus"]');
  await opus.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const opusPressed = await opus.getAttribute('aria-pressed');
  const opusPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="opus"]').count();
  const opusDescription = await page.locator('#scene-host-description-ch10').textContent();
  const opusInstrumentPanel = await chapterTenInstrument.getAttribute('data-active-panel');
  const opusInstrumentLabel = await chapterTenInstrument.getAttribute('aria-label');
  const opusVisualState = await page.locator('.alchemical-vessel-instrument__stages, .alchemical-vessel-instrument__heat, .alchemical-vessel-instrument__lapis, .alchemical-vessel-instrument__thread--ascent').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  const chapterTenScrollY = await page.evaluate(() => window.scrollY);
  if (opusPressed !== 'true') failures.push(`chapter 10 scene control did not become active: ${opusPressed}`);
  if (opusPanelActive !== 1) failures.push(`chapter 10 opus panel did not become active: ${opusPanelActive}`);
  if (opusInstrumentPanel !== 'opus') failures.push(`chapter 10 alchemical vessel instrument did not follow opus panel: ${opusInstrumentPanel}`);
  if (!opusInstrumentLabel?.includes('Current emphasis: Opus') || !opusInstrumentLabel?.includes('Alchemy gives psychology a theater')) {
    failures.push(`chapter 10 alchemical vessel instrument label did not follow opus panel: ${opusInstrumentLabel}`);
  }
  if (opusVisualState.length !== 4 || !opusVisualState.every((opacity) => opacity >= 0.65)) {
    failures.push(`chapter 10 alchemical vessel instrument did not visually emphasize opus: ${opusVisualState.join(',')}`);
  }
  if (!opusDescription?.includes('Opus: Matter teaches psyche')) failures.push(`chapter 10 scene description did not follow opus panel: ${opusDescription}`);
  if (chapterTenScrollY > 10) failures.push(`chapter 10 scene control unexpectedly scrolled page: ${chapterTenScrollY}`);

  const chapterTenCanvas = page.locator('.scene-host canvas').first();
  const chapterTenCanvasCount = await chapterTenCanvas.count();
  const chapterTenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  if (chapterTenCanvasCount !== 1) {
    failures.push(`chapter 10 expected one ready canvas but found ${chapterTenCanvasCount}; fallback visible: ${chapterTenFallbackVisible}`);
  } else {
    const chapterTenCanvasBox = await chapterTenCanvas.boundingBox();
    const chapterTenPixelSample = await waitForCanvasPixels(chapterTenCanvas);
    if (!chapterTenCanvasBox || chapterTenCanvasBox.width < 300 || chapterTenCanvasBox.height < 300) {
      failures.push(`chapter 10 canvas geometry too small: ${chapterTenCanvasBox ? `${Math.round(chapterTenCanvasBox.width)}x${Math.round(chapterTenCanvasBox.height)}` : 'missing'}`);
    }
    recordCanvasPixelFailure(failures, 'chapter 10', chapterTenPixelSample);
  }

  await gotoAppRoute(page, '/journey/chapter/ch11');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterElevenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterElevenReferenceCount = await chapterElevenReferenceNodes.count();
  const chapterElevenPanelIds = await chapterElevenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterElevenInstrument = page.locator('.alchemical-tree-instrument');
  const chapterElevenInstrumentCount = await chapterElevenInstrument.count();
  const chapterElevenInstrumentRole = await chapterElevenInstrument.getAttribute('role');
  const chapterElevenInstrumentLabel = await chapterElevenInstrument.getAttribute('aria-label');
  const chapterElevenInstrumentPanel = await chapterElevenInstrument.getAttribute('data-active-panel');
  const chapterElevenInstrumentStageCount = await page.locator('.alchemical-tree-instrument__stage').count();
  const chapterElevenInstrumentRootCount = await page.locator('.alchemical-tree-instrument__root').count();
  const chapterElevenInstrumentBranchCount = await page.locator('.alchemical-tree-instrument__branch').count();
  const chapterElevenInstrumentLabelCount = await page.locator('.alchemical-tree-instrument__label').count();
  const chapterElevenInitialDescription = await page.locator('#scene-host-description-ch11').textContent();
  const chapterElevenInstrumentMarksVisible = await page.locator('.alchemical-tree-instrument__field, .alchemical-tree-instrument__root, .alchemical-tree-instrument__trunk, .alchemical-tree-instrument__branch, .alchemical-tree-instrument__thread, .alchemical-tree-instrument__mercurius, .alchemical-tree-instrument__wheel, .alchemical-tree-instrument__stage, .alchemical-tree-instrument__stone, .alchemical-tree-instrument__reflection').evaluateAll((nodes) => nodes.length >= 18 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterElevenReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="mercurius"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="opus-wheel"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="lapis"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.length === 3 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const before = window.getComputedStyle(node, '::before');
    const after = window.getComputedStyle(node, '::after');
    return styles.display !== 'none'
      && Number(styles.opacity) > 0
      && box.width > 0
      && box.height > 0
      && before.content !== 'none'
      && after.content !== 'none'
      && Number.parseFloat(before.width) > 0
      && Number.parseFloat(before.height) > 0
      && Number.parseFloat(after.width) > 0
      && Number.parseFloat(after.height) > 0;
  }));

  if (chapterElevenReferenceCount !== 3) failures.push(`chapter 11 reference node count mismatch: ${chapterElevenReferenceCount}`);
  if (chapterElevenPanelIds.join(',') !== 'mercurius,opus-wheel,lapis') failures.push(`chapter 11 reference nodes out of order: ${chapterElevenPanelIds.join(',')}`);
  if (chapterElevenInstrumentCount !== 1) failures.push(`chapter 11 alchemical tree instrument count mismatch: ${chapterElevenInstrumentCount}`);
  if (chapterElevenInstrumentStageCount !== 4) failures.push(`chapter 11 alchemical tree stage count mismatch: ${chapterElevenInstrumentStageCount}`);
  if (chapterElevenInstrumentRootCount !== 3) failures.push(`chapter 11 alchemical tree root count mismatch: ${chapterElevenInstrumentRootCount}`);
  if (chapterElevenInstrumentBranchCount !== 2) failures.push(`chapter 11 alchemical tree branch count mismatch: ${chapterElevenInstrumentBranchCount}`);
  if (chapterElevenInstrumentLabelCount !== 3) failures.push(`chapter 11 alchemical tree label count mismatch: ${chapterElevenInstrumentLabelCount}`);
  if (chapterElevenInstrumentRole !== 'img') failures.push(`chapter 11 alchemical tree instrument role mismatch: ${chapterElevenInstrumentRole}`);
  if (!chapterElevenInstrumentLabel?.includes('Philosophical tree model') || !chapterElevenInstrumentLabel?.includes('Mercurius holds the middle') || !chapterElevenInstrumentLabel?.includes('Current emphasis: Mediator')) {
    failures.push(`chapter 11 alchemical tree instrument label missing teaching text: ${chapterElevenInstrumentLabel}`);
  }
  if (chapterElevenInstrumentPanel !== 'mercurius') failures.push(`chapter 11 alchemical tree instrument did not start on Mercurius panel: ${chapterElevenInstrumentPanel}`);
  if (!chapterElevenInitialDescription?.includes('Mediator: The slippery middle')) failures.push(`chapter 11 initial scene description mismatch: ${chapterElevenInitialDescription}`);
  if (!chapterElevenInstrumentMarksVisible) failures.push('chapter 11 alchemical tree instrument marks are not visibly rendered');
  if (!chapterElevenReferenceGlyphsVisible) failures.push('chapter 11 reference glyphs are not visibly rendered');

  const opusWheel = page.locator('.chapter-stage__reference-node[data-panel-id="opus-wheel"]');
  await opusWheel.waitFor({ state: 'visible', timeout: 30_000 });
  await opusWheel.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const opusWheelPressed = await opusWheel.getAttribute('aria-pressed');
  const opusWheelPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="opus-wheel"]').count();
  const opusWheelDescription = await page.locator('#scene-host-description-ch11').textContent();
  const opusWheelInstrumentPanel = await chapterElevenInstrument.getAttribute('data-active-panel');
  const opusWheelInstrumentLabel = await chapterElevenInstrument.getAttribute('aria-label');
  const opusWheelVisualState = await page.locator('.alchemical-tree-instrument__wheel, .alchemical-tree-instrument__stage, .alchemical-tree-instrument__thread').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  if (opusWheelPressed !== 'true') failures.push(`chapter 11 opus wheel reference did not become active: ${opusWheelPressed}`);
  if (opusWheelPanelActive !== 1) failures.push(`chapter 11 opus wheel panel did not become active: ${opusWheelPanelActive}`);
  if (opusWheelInstrumentPanel !== 'opus-wheel') failures.push(`chapter 11 alchemical tree instrument did not follow opus wheel panel: ${opusWheelInstrumentPanel}`);
  if (!opusWheelInstrumentLabel?.includes('Current emphasis: Opus') || !opusWheelInstrumentLabel?.includes('Change returns to deepen itself')) {
    failures.push(`chapter 11 alchemical tree instrument label did not follow opus panel: ${opusWheelInstrumentLabel}`);
  }
  if (opusWheelVisualState.length !== 7 || !opusWheelVisualState.every((opacity) => opacity >= 0.65)) {
    failures.push(`chapter 11 alchemical tree instrument did not visually emphasize opus wheel: ${opusWheelVisualState.join(',')}`);
  }
  if (!opusWheelDescription?.includes('Opus: Transformation repeats')) failures.push(`chapter 11 scene description did not follow opus panel: ${opusWheelDescription}`);

  const stone = page.locator('.chapter-stage__reference-node[data-panel-id="lapis"]');
  await stone.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const stonePressed = await stone.getAttribute('aria-pressed');
  const stonePanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="lapis"]').count();
  const stoneDescription = await page.locator('#scene-host-description-ch11').textContent();
  const stoneInstrumentPanel = await chapterElevenInstrument.getAttribute('data-active-panel');
  const stoneInstrumentLabel = await chapterElevenInstrument.getAttribute('aria-label');
  const stoneVisualState = await page.locator('.alchemical-tree-instrument__stone, .alchemical-tree-instrument__reflection, .alchemical-tree-instrument__field').evaluateAll((nodes) => nodes.map((node) => Number(window.getComputedStyle(node).opacity)));
  const chapterElevenScrollY = await page.evaluate(() => window.scrollY);
  if (stonePressed !== 'true') failures.push(`chapter 11 scene control did not become active: ${stonePressed}`);
  if (stonePanelActive !== 1) failures.push(`chapter 11 stone panel did not become active: ${stonePanelActive}`);
  if (stoneInstrumentPanel !== 'lapis') failures.push(`chapter 11 alchemical tree instrument did not follow stone panel: ${stoneInstrumentPanel}`);
  if (!stoneInstrumentLabel?.includes('Current emphasis: Stone') || !stoneInstrumentLabel?.includes('Completion keeps the opposites alive')) {
    failures.push(`chapter 11 alchemical tree instrument label did not follow stone panel: ${stoneInstrumentLabel}`);
  }
  if (stoneVisualState.length !== 4 || !stoneVisualState.every((opacity) => opacity >= 0.65)) {
    failures.push(`chapter 11 alchemical tree instrument did not visually emphasize lapis: ${stoneVisualState.join(',')}`);
  }
  if (!stoneDescription?.includes('Stone: The goal is a formed paradox')) failures.push(`chapter 11 scene description did not follow stone panel: ${stoneDescription}`);
  if (chapterElevenScrollY > 10) failures.push(`chapter 11 scene control unexpectedly scrolled page: ${chapterElevenScrollY}`);

  const chapterElevenCanvas = page.locator('.scene-host canvas').first();
  const chapterElevenCanvasCount = await chapterElevenCanvas.count();
  const chapterElevenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  if (chapterElevenCanvasCount !== 1) {
    failures.push(`chapter 11 expected one ready canvas but found ${chapterElevenCanvasCount}; fallback visible: ${chapterElevenFallbackVisible}`);
  } else {
    const chapterElevenCanvasBox = await chapterElevenCanvas.boundingBox();
    const chapterElevenPixelSample = await waitForCanvasPixels(chapterElevenCanvas);
    if (!chapterElevenCanvasBox || chapterElevenCanvasBox.width < 300 || chapterElevenCanvasBox.height < 300) {
      failures.push(`chapter 11 canvas geometry too small: ${chapterElevenCanvasBox ? `${Math.round(chapterElevenCanvasBox.width)}x${Math.round(chapterElevenCanvasBox.height)}` : 'missing'}`);
    }
    recordCanvasPixelFailure(failures, 'chapter 11', chapterElevenPixelSample);
  }

  await gotoAppRoute(page, '/journey/chapter/ch12');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterTwelveReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterTwelveReferenceCount = await chapterTwelveReferenceNodes.count();
  const chapterTwelvePanelIds = await chapterTwelveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterTwelveInstrument = page.locator('.amplification-lens-instrument');
  const chapterTwelveInstrumentCount = await chapterTwelveInstrument.count();
  const chapterTwelveInstrumentRole = await chapterTwelveInstrument.getAttribute('role');
  const chapterTwelveInstrumentLabel = await chapterTwelveInstrument.getAttribute('aria-label');
  const chapterTwelveInstrumentPanel = await chapterTwelveInstrument.getAttribute('data-active-panel');
  const chapterTwelveInstrumentRingCount = await page.locator('.amplification-lens-instrument__ring').count();
  const chapterTwelveInstrumentRootCount = await page.locator('.amplification-lens-instrument__root').count();
  const chapterTwelveInstrumentImageCount = await page.locator('.amplification-lens-instrument__image').count();
  const chapterTwelveInstrumentLabelCount = await page.locator('.amplification-lens-instrument__label').count();
  const chapterTwelveInitialDescription = await page.locator('#scene-host-description-ch12').textContent();
  const chapterTwelveInstrumentMarksVisible = await page.locator('.amplification-lens-instrument__field, .amplification-lens-instrument__source, .amplification-lens-instrument__root, .amplification-lens-instrument__split, .amplification-lens-instrument__image, .amplification-lens-instrument__projection, .amplification-lens-instrument__fish, .amplification-lens-instrument__bridge, .amplification-lens-instrument__lens, .amplification-lens-instrument__ring').evaluateAll((nodes) => nodes.length >= 17 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterTwelveReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="background"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="roots"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="bridge"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.length === 3 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const before = window.getComputedStyle(node, '::before');
    const after = window.getComputedStyle(node, '::after');
    return styles.display !== 'none'
      && Number(styles.opacity) > 0
      && box.width > 0
      && box.height > 0
      && before.content !== 'none'
      && after.content !== 'none'
      && Number.parseFloat(before.width) > 0
      && Number.parseFloat(before.height) > 0
      && Number.parseFloat(after.width) > 0
      && Number.parseFloat(after.height) > 0;
  }));

  if (chapterTwelveReferenceCount !== 3) failures.push(`chapter 12 reference node count mismatch: ${chapterTwelveReferenceCount}`);
  if (chapterTwelvePanelIds.join(',') !== 'background,roots,bridge') failures.push(`chapter 12 reference nodes out of order: ${chapterTwelvePanelIds.join(',')}`);
  if (chapterTwelveInstrumentCount !== 1) failures.push(`chapter 12 amplification lens instrument count mismatch: ${chapterTwelveInstrumentCount}`);
  if (chapterTwelveInstrumentRingCount !== 3) failures.push(`chapter 12 amplification lens ring count mismatch: ${chapterTwelveInstrumentRingCount}`);
  if (chapterTwelveInstrumentRootCount !== 3) failures.push(`chapter 12 amplification lens root count mismatch: ${chapterTwelveInstrumentRootCount}`);
  if (chapterTwelveInstrumentImageCount !== 2) failures.push(`chapter 12 amplification lens image count mismatch: ${chapterTwelveInstrumentImageCount}`);
  if (chapterTwelveInstrumentLabelCount !== 3) failures.push(`chapter 12 amplification lens label count mismatch: ${chapterTwelveInstrumentLabelCount}`);
  if (chapterTwelveInstrumentRole !== 'img') failures.push(`chapter 12 amplification lens instrument role mismatch: ${chapterTwelveInstrumentRole}`);
  if (!chapterTwelveInstrumentLabel?.includes('Amplification lens model') || !chapterTwelveInstrumentLabel?.includes('disciplined symbolic lens') || !chapterTwelveInstrumentLabel?.includes('Current emphasis: Method')) {
    failures.push(`chapter 12 amplification lens instrument label missing teaching text: ${chapterTwelveInstrumentLabel}`);
  }
  if (chapterTwelveInstrumentPanel !== 'background') failures.push(`chapter 12 amplification lens instrument did not start on Method panel: ${chapterTwelveInstrumentPanel}`);
  if (!chapterTwelveInitialDescription?.includes('Method: Read through the lens')) failures.push(`chapter 12 initial scene description mismatch: ${chapterTwelveInitialDescription}`);
  if (!chapterTwelveInstrumentMarksVisible) failures.push('chapter 12 amplification lens instrument marks are not visibly rendered');
  if (!chapterTwelveReferenceGlyphsVisible) failures.push('chapter 12 reference glyphs are not visibly rendered');

  const roots = page.locator('.chapter-stage__reference-node[data-panel-id="roots"]');
  await roots.waitFor({ state: 'visible', timeout: 30_000 });
  await roots.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const rootsPressed = await roots.getAttribute('aria-pressed');
  const rootsPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="roots"]').count();
  const rootsDescription = await page.locator('#scene-host-description-ch12').textContent();
  const rootsInstrumentPanel = await chapterTwelveInstrument.getAttribute('data-active-panel');
  const rootsInstrumentLabel = await chapterTwelveInstrument.getAttribute('aria-label');
  const rootsVisualPartsVisible = await page.locator('.amplification-lens-instrument__root, .amplification-lens-instrument__split, .amplification-lens-instrument__source, .amplification-lens-instrument__image').evaluateAll((nodes) => nodes.length === 8 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  if (rootsPressed !== 'true') failures.push(`chapter 12 roots reference did not become active: ${rootsPressed}`);
  if (rootsPanelActive !== 1) failures.push(`chapter 12 roots panel did not become active: ${rootsPanelActive}`);
  if (rootsInstrumentPanel !== 'roots') failures.push(`chapter 12 amplification lens instrument did not follow roots panel: ${rootsInstrumentPanel}`);
  if (!rootsInstrumentLabel?.includes('Current emphasis: Genealogy') || !rootsInstrumentLabel?.includes('Symbols migrate between systems')) {
    failures.push(`chapter 12 amplification lens instrument label did not follow roots panel: ${rootsInstrumentLabel}`);
  }
  if (!rootsVisualPartsVisible) failures.push('chapter 12 amplification lens roots visual parts are not visibly rendered');
  if (!rootsDescription?.includes('Genealogy: Two languages share roots')) failures.push(`chapter 12 scene description did not follow roots panel: ${rootsDescription}`);

  const bridge = page.getByRole('button', { name: /03\s+Bridge/ });
  await bridge.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(700);

  const bridgePressed = await bridge.getAttribute('aria-pressed');
  const bridgePanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="bridge"]').count();
  const bridgeDescription = await page.locator('#scene-host-description-ch12').textContent();
  const bridgeInstrumentPanel = await chapterTwelveInstrument.getAttribute('data-active-panel');
  const bridgeInstrumentLabel = await chapterTwelveInstrument.getAttribute('aria-label');
  const bridgeVisualPartsVisible = await page.locator('.amplification-lens-instrument__fish, .amplification-lens-instrument__bridge, .amplification-lens-instrument__field').evaluateAll((nodes) => nodes.length === 4 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterTwelveScrollY = await page.evaluate(() => window.scrollY);
  if (bridgePressed !== 'true') failures.push(`chapter 12 scene control did not become active: ${bridgePressed}`);
  if (bridgePanelActive !== 1) failures.push(`chapter 12 bridge panel did not become active: ${bridgePanelActive}`);
  if (bridgeInstrumentPanel !== 'bridge') failures.push(`chapter 12 amplification lens instrument did not follow bridge panel: ${bridgeInstrumentPanel}`);
  if (!bridgeInstrumentLabel?.includes('Current emphasis: Bridge') || !bridgeInstrumentLabel?.includes('Aion reads tradition as inner drama')) {
    failures.push(`chapter 12 amplification lens instrument label did not follow bridge panel: ${bridgeInstrumentLabel}`);
  }
  if (!bridgeVisualPartsVisible) failures.push('chapter 12 amplification lens bridge visual parts are not visibly rendered');
  if (!bridgeDescription?.includes('Bridge: Projection turns inward')) failures.push(`chapter 12 scene description did not follow bridge panel: ${bridgeDescription}`);
  if (chapterTwelveScrollY > 10) failures.push(`chapter 12 scene control unexpectedly scrolled page: ${chapterTwelveScrollY}`);

  const chapterTwelveCanvas = page.locator('.scene-host canvas').first();
  const chapterTwelveCanvasCount = await chapterTwelveCanvas.count();
  const chapterTwelveFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  if (chapterTwelveCanvasCount !== 1) {
    failures.push(`chapter 12 expected one ready canvas but found ${chapterTwelveCanvasCount}; fallback visible: ${chapterTwelveFallbackVisible}`);
  } else {
    const chapterTwelveCanvasBox = await chapterTwelveCanvas.boundingBox();
    const chapterTwelvePixelSample = await waitForCanvasPixels(chapterTwelveCanvas);
    if (!chapterTwelveCanvasBox || chapterTwelveCanvasBox.width < 300 || chapterTwelveCanvasBox.height < 300) {
      failures.push(`chapter 12 canvas geometry too small: ${chapterTwelveCanvasBox ? `${Math.round(chapterTwelveCanvasBox.width)}x${Math.round(chapterTwelveCanvasBox.height)}` : 'missing'}`);
    }
    recordCanvasPixelFailure(failures, 'chapter 12', chapterTwelvePixelSample);
  }

  await gotoAppRoute(page, '/journey/chapter/ch13');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterThirteenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterThirteenReferenceCount = await chapterThirteenReferenceNodes.count();
  const chapterThirteenPanelIds = await chapterThirteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterThirteenInstrument = page.locator('.gnostic-constellation-instrument');
  const chapterThirteenInstrumentCount = await chapterThirteenInstrument.count();
  const chapterThirteenInstrumentRole = chapterThirteenInstrumentCount > 0 ? await chapterThirteenInstrument.getAttribute('role') : null;
  const chapterThirteenInstrumentLabel = chapterThirteenInstrumentCount > 0 ? await chapterThirteenInstrument.getAttribute('aria-label') : null;
  const chapterThirteenInstrumentPanel = chapterThirteenInstrumentCount > 0 ? await chapterThirteenInstrument.getAttribute('data-active-panel') : null;
  const chapterThirteenLayerCount = await page.locator('.gnostic-constellation-instrument__layer').count();
  const chapterThirteenPointCount = await page.locator('.gnostic-constellation-instrument__point').count();
  const chapterThirteenShardCount = await page.locator('.gnostic-constellation-instrument__shard').count();
  const chapterThirteenInstrumentLabelCount = await page.locator('.gnostic-constellation-instrument__label').count();
  const chapterThirteenInitialDescription = await page.locator('#scene-host-description-ch13').textContent();
  const chapterThirteenInstrumentMarksVisible = await page.locator('.gnostic-constellation-instrument__field, .gnostic-constellation-instrument__axis, .gnostic-constellation-instrument__emanation, .gnostic-constellation-instrument__layer, .gnostic-constellation-instrument__source, .gnostic-constellation-instrument__descent, .gnostic-constellation-instrument__sophia, .gnostic-constellation-instrument__quaternio, .gnostic-constellation-instrument__point, .gnostic-constellation-instrument__center, .gnostic-constellation-instrument__rupture, .gnostic-constellation-instrument__shard').evaluateAll((nodes) => nodes.length >= 22 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterThirteenReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="gnosis"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="quaternio"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="paradox"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.length === 3 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const before = window.getComputedStyle(node, '::before');
    const after = window.getComputedStyle(node, '::after');
    return styles.display !== 'none'
      && Number(styles.opacity) > 0
      && box.width > 0
      && box.height > 0
      && before.content !== 'none'
      && after.content !== 'none'
      && Number.parseFloat(before.width) > 0
      && Number.parseFloat(before.height) > 0
      && Number.parseFloat(after.width) > 0
      && Number.parseFloat(after.height) > 0;
  }));

  if (chapterThirteenReferenceCount !== 3) failures.push(`chapter 13 reference node count mismatch: ${chapterThirteenReferenceCount}`);
  if (chapterThirteenPanelIds.join(',') !== 'gnosis,quaternio,paradox') failures.push(`chapter 13 reference nodes out of order: ${chapterThirteenPanelIds.join(',')}`);
  if (chapterThirteenInstrumentCount !== 1) failures.push(`chapter 13 Gnostic constellation instrument count mismatch: ${chapterThirteenInstrumentCount}`);
  if (chapterThirteenLayerCount !== 4) failures.push(`chapter 13 Gnostic constellation layer count mismatch: ${chapterThirteenLayerCount}`);
  if (chapterThirteenPointCount !== 4) failures.push(`chapter 13 Gnostic constellation point count mismatch: ${chapterThirteenPointCount}`);
  if (chapterThirteenShardCount !== 3) failures.push(`chapter 13 Gnostic constellation shard count mismatch: ${chapterThirteenShardCount}`);
  if (chapterThirteenInstrumentLabelCount !== 3) failures.push(`chapter 13 Gnostic constellation label count mismatch: ${chapterThirteenInstrumentLabelCount}`);
  if (chapterThirteenInstrumentRole !== 'img') failures.push(`chapter 13 Gnostic constellation instrument role mismatch: ${chapterThirteenInstrumentRole}`);
  if (!chapterThirteenInstrumentLabel?.includes('Gnostic constellation model') || !chapterThirteenInstrumentLabel?.includes('symbolic') || !chapterThirteenInstrumentLabel?.includes('Current emphasis: Gnosis')) {
    failures.push(`chapter 13 Gnostic constellation instrument label missing teaching text: ${chapterThirteenInstrumentLabel}`);
  }
  if (chapterThirteenInstrumentPanel !== 'gnosis') failures.push(`chapter 13 Gnostic constellation instrument did not start on Gnosis panel: ${chapterThirteenInstrumentPanel}`);
  if (!chapterThirteenInitialDescription?.includes('Gnosis: Knowledge descends as image')) failures.push(`chapter 13 initial scene description mismatch: ${chapterThirteenInitialDescription}`);
  if (!chapterThirteenInstrumentMarksVisible) failures.push('chapter 13 Gnostic constellation instrument marks are not visibly rendered');
  if (!chapterThirteenReferenceGlyphsVisible) failures.push('chapter 13 reference glyphs are not visibly rendered');

  const quaternio = page.getByRole('button', { name: /02\s+Fourfold/ });
  await quaternio.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);

  const quaternioPressed = await quaternio.getAttribute('aria-pressed');
  const quaternioPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="quaternio"]').count();
  const quaternioDescription = await page.locator('#scene-host-description-ch13').textContent();
  const quaternioInstrumentPanel = await chapterThirteenInstrument.getAttribute('data-active-panel');
  const quaternioInstrumentLabel = await chapterThirteenInstrument.getAttribute('aria-label');
  const quaternioVisualPartsVisible = await page.locator('.gnostic-constellation-instrument__quaternio, .gnostic-constellation-instrument__point, .gnostic-constellation-instrument__center, .gnostic-constellation-instrument__axis').evaluateAll((nodes) => nodes.length === 8 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  if (quaternioPressed !== 'true') failures.push(`chapter 13 fourfold reference did not become active: ${quaternioPressed}`);
  if (quaternioPanelActive !== 1) failures.push(`chapter 13 fourfold panel did not become active: ${quaternioPanelActive}`);
  if (quaternioInstrumentPanel !== 'quaternio') failures.push(`chapter 13 Gnostic constellation instrument did not follow fourfold panel: ${quaternioInstrumentPanel}`);
  if (!quaternioInstrumentLabel?.includes('Current emphasis: Fourfold') || !quaternioInstrumentLabel?.includes('Wholeness has a structural signature')) {
    failures.push(`chapter 13 Gnostic constellation instrument label did not follow fourfold panel: ${quaternioInstrumentLabel}`);
  }
  if (!quaternioVisualPartsVisible) failures.push('chapter 13 Gnostic constellation fourfold visual parts are not visibly rendered');
  if (!quaternioDescription?.includes('Fourfold: The Self appears as four')) failures.push(`chapter 13 scene description did not follow fourfold panel: ${quaternioDescription}`);

  const paradox = page.getByRole('button', { name: /03\s+Paradox/ });
  await paradox.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(700);

  const paradoxPressed = await paradox.getAttribute('aria-pressed');
  const paradoxPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="paradox"]').count();
  const paradoxDescription = await page.locator('#scene-host-description-ch13').textContent();
  const paradoxInstrumentPanel = await chapterThirteenInstrument.getAttribute('data-active-panel');
  const paradoxInstrumentLabel = await chapterThirteenInstrument.getAttribute('aria-label');
  const paradoxVisualPartsVisible = await page.locator('.gnostic-constellation-instrument__field--rupture, .gnostic-constellation-instrument__rupture, .gnostic-constellation-instrument__shard, .gnostic-constellation-instrument__sophia, .gnostic-constellation-instrument__center').evaluateAll((nodes) => nodes.length === 7 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterThirteenScrollY = await page.evaluate(() => window.scrollY);
  if (paradoxPressed !== 'true') failures.push(`chapter 13 scene control did not become active: ${paradoxPressed}`);
  if (paradoxPanelActive !== 1) failures.push(`chapter 13 paradox panel did not become active: ${paradoxPanelActive}`);
  if (paradoxInstrumentPanel !== 'paradox') failures.push(`chapter 13 Gnostic constellation instrument did not follow paradox panel: ${paradoxInstrumentPanel}`);
  if (!paradoxInstrumentLabel?.includes('Current emphasis: Paradox') || !paradoxInstrumentLabel?.includes('The Self is approached through contradiction')) {
    failures.push(`chapter 13 Gnostic constellation instrument label did not follow paradox panel: ${paradoxInstrumentLabel}`);
  }
  if (!paradoxVisualPartsVisible) failures.push('chapter 13 Gnostic constellation paradox visual parts are not visibly rendered');
  if (!paradoxDescription?.includes('Paradox: Wisdom includes rupture')) failures.push(`chapter 13 scene description did not follow paradox panel: ${paradoxDescription}`);
  if (chapterThirteenScrollY > 10) failures.push(`chapter 13 scene control unexpectedly scrolled page: ${chapterThirteenScrollY}`);

  const chapterThirteenCanvas = page.locator('.scene-host canvas').first();
  const chapterThirteenCanvasCount = await chapterThirteenCanvas.count();
  const chapterThirteenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  if (chapterThirteenCanvasCount !== 1) {
    failures.push(`chapter 13 expected one ready canvas but found ${chapterThirteenCanvasCount}; fallback visible: ${chapterThirteenFallbackVisible}`);
  } else {
    const chapterThirteenCanvasBox = await chapterThirteenCanvas.boundingBox();
    const chapterThirteenPixelSample = await waitForCanvasPixels(chapterThirteenCanvas);
    if (!chapterThirteenCanvasBox || chapterThirteenCanvasBox.width < 300 || chapterThirteenCanvasBox.height < 300) {
      failures.push(`chapter 13 canvas geometry too small: ${chapterThirteenCanvasBox ? `${Math.round(chapterThirteenCanvasBox.width)}x${Math.round(chapterThirteenCanvasBox.height)}` : 'missing'}`);
    }
    recordCanvasPixelFailure(failures, 'chapter 13', chapterThirteenPixelSample);
  }

  await gotoAppRoute(page, '/journey/chapter/ch14');
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const chapterFourteenReferenceNodes = page.locator('.chapter-stage__reference-node');
  const chapterFourteenReferenceCount = await chapterFourteenReferenceNodes.count();
  const chapterFourteenPanelIds = await chapterFourteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
  const chapterFourteenInstrument = page.locator('.final-synthesis-instrument');
  const chapterFourteenInstrumentCount = await chapterFourteenInstrument.count();
  const chapterFourteenInstrumentRole = chapterFourteenInstrumentCount > 0 ? await chapterFourteenInstrument.getAttribute('role') : null;
  const chapterFourteenInstrumentLabel = chapterFourteenInstrumentCount > 0 ? await chapterFourteenInstrument.getAttribute('aria-label') : null;
  const chapterFourteenInstrumentPanel = chapterFourteenInstrumentCount > 0 ? await chapterFourteenInstrument.getAttribute('data-active-panel') : null;
  const chapterFourteenMotifCount = await page.locator('.final-synthesis-instrument__motif').count();
  const chapterFourteenPointCount = await page.locator('.final-synthesis-instrument__point').count();
  const chapterFourteenMarkCount = await page.locator('.final-synthesis-instrument__mark').count();
  const chapterFourteenInstrumentLabelCount = await page.locator('.final-synthesis-instrument__label').count();
  const chapterFourteenInitialDescription = await page.locator('#scene-host-description-ch14').textContent();
  const chapterFourteenInstrumentMarksVisible = await page.locator('.final-synthesis-instrument__field, .final-synthesis-instrument__axis, .final-synthesis-instrument__orbit, .final-synthesis-instrument__motif-ring, .final-synthesis-instrument__motif, .final-synthesis-instrument__quaternity, .final-synthesis-instrument__point, .final-synthesis-instrument__ego, .final-synthesis-instrument__self, .final-synthesis-instrument__path, .final-synthesis-instrument__mark').evaluateAll((nodes) => nodes.length >= 23 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterFourteenReferenceGlyphsVisible = await page.locator('.chapter-stage__reference-node[data-panel-id="gather"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="axis"] .chapter-stage__reference-mark, .chapter-stage__reference-node[data-panel-id="aeon"] .chapter-stage__reference-mark').evaluateAll((nodes) => nodes.length === 3 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    const before = window.getComputedStyle(node, '::before');
    const after = window.getComputedStyle(node, '::after');
    return styles.display !== 'none'
      && Number(styles.opacity) > 0
      && box.width > 0
      && box.height > 0
      && before.content !== 'none'
      && after.content !== 'none'
      && Number.parseFloat(before.width) > 0
      && Number.parseFloat(before.height) > 0
      && Number.parseFloat(after.width) > 0
      && Number.parseFloat(after.height) > 0;
  }));

  if (chapterFourteenReferenceCount !== 3) failures.push(`chapter 14 reference node count mismatch: ${chapterFourteenReferenceCount}`);
  if (chapterFourteenPanelIds.join(',') !== 'gather,axis,aeon') failures.push(`chapter 14 reference nodes out of order: ${chapterFourteenPanelIds.join(',')}`);
  if (chapterFourteenInstrumentCount !== 1) failures.push(`chapter 14 final synthesis instrument count mismatch: ${chapterFourteenInstrumentCount}`);
  if (chapterFourteenInstrumentRole !== 'img') failures.push(`chapter 14 final synthesis instrument role mismatch: ${chapterFourteenInstrumentRole}`);
  if (!chapterFourteenInstrumentLabel?.includes('Final synthesis mandala') || !chapterFourteenInstrumentLabel?.includes('fourfold Self field') || !chapterFourteenInstrumentLabel?.includes('Current emphasis: Synthesis')) {
    failures.push(`chapter 14 final synthesis instrument label missing teaching text: ${chapterFourteenInstrumentLabel}`);
  }
  if (chapterFourteenInstrumentPanel !== 'gather') failures.push(`chapter 14 final synthesis instrument did not start on synthesis panel: ${chapterFourteenInstrumentPanel}`);
  if (chapterFourteenMotifCount !== 6) failures.push(`chapter 14 final synthesis motif count mismatch: ${chapterFourteenMotifCount}`);
  if (chapterFourteenPointCount !== 4) failures.push(`chapter 14 final synthesis quaternity point count mismatch: ${chapterFourteenPointCount}`);
  if (chapterFourteenMarkCount !== 3) failures.push(`chapter 14 final synthesis path mark count mismatch: ${chapterFourteenMarkCount}`);
  if (chapterFourteenInstrumentLabelCount !== 3) failures.push(`chapter 14 final synthesis label count mismatch: ${chapterFourteenInstrumentLabelCount}`);
  if (!chapterFourteenInitialDescription?.includes('Synthesis: The book gathers into one field')) failures.push(`chapter 14 initial scene description mismatch: ${chapterFourteenInitialDescription}`);
  if (!chapterFourteenInstrumentMarksVisible) failures.push('chapter 14 final synthesis instrument marks are not visibly rendered');
  if (!chapterFourteenReferenceGlyphsVisible) failures.push('chapter 14 reference glyphs are not visibly rendered');

  const axis = page.getByRole('button', { name: /02\s+Axis/ });
  await activateSceneButton(axis);
  await page.waitForTimeout(250);

  const axisPressed = await axis.getAttribute('aria-pressed');
  const axisPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="axis"]').count();
  const axisDescription = await page.locator('#scene-host-description-ch14').textContent();
  const axisInstrumentPanel = await chapterFourteenInstrument.getAttribute('data-active-panel');
  const axisInstrumentLabel = await chapterFourteenInstrument.getAttribute('aria-label');
  const axisVisualPartsVisible = await page.locator('.final-synthesis-instrument__axis, .final-synthesis-instrument__quaternity, .final-synthesis-instrument__point, .final-synthesis-instrument__ego, .final-synthesis-instrument__self').evaluateAll((nodes) => nodes.length === 9 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  if (axisPressed !== 'true') failures.push(`chapter 14 axis scene control did not become active: ${axisPressed}`);
  if (axisPanelActive !== 1) failures.push(`chapter 14 axis panel did not become active: ${axisPanelActive}`);
  if (axisInstrumentPanel !== 'axis') failures.push(`chapter 14 final synthesis instrument did not follow axis panel: ${axisInstrumentPanel}`);
  if (!axisInstrumentLabel?.includes('Current emphasis: Axis') || !axisInstrumentLabel?.includes('The goal is right relation')) {
    failures.push(`chapter 14 final synthesis instrument label did not follow axis panel: ${axisInstrumentLabel}`);
  }
  if (!axisVisualPartsVisible) failures.push('chapter 14 final synthesis axis visual parts are not visibly rendered');
  if (!axisDescription?.includes('Axis: Ego and Self stay in relation')) failures.push(`chapter 14 scene description did not follow axis panel: ${axisDescription}`);

  const aeon = page.getByRole('button', { name: /03\s+Path/ });
  await activateSceneButton(aeon);
  await page.waitForTimeout(250);

  const aeonPressed = await aeon.getAttribute('aria-pressed');
  const aeonPanelActive = await page.locator('.chapter-panel.chapter-panel--active[data-panel-id="aeon"]').count();
  const aeonDescription = await page.locator('#scene-host-description-ch14').textContent();
  const aeonInstrumentPanel = await chapterFourteenInstrument.getAttribute('data-active-panel');
  const aeonInstrumentLabel = await chapterFourteenInstrument.getAttribute('aria-label');
  const aeonVisualPartsVisible = await page.locator('.final-synthesis-instrument__field--future, .final-synthesis-instrument__path, .final-synthesis-instrument__mark, .final-synthesis-instrument__orbit, .final-synthesis-instrument__self').evaluateAll((nodes) => nodes.length === 8 && nodes.every((node) => {
    const styles = window.getComputedStyle(node);
    const box = node.getBoundingClientRect();
    return styles.display !== 'none' && Number(styles.opacity) > 0 && box.width > 0 && box.height > 0;
  }));
  const chapterFourteenScrollY = await page.evaluate(() => window.scrollY);
  if (aeonPressed !== 'true') failures.push(`chapter 14 scene control did not become active: ${aeonPressed}`);
  if (aeonPanelActive !== 1) failures.push(`chapter 14 aeon panel did not become active: ${aeonPanelActive}`);
  if (aeonInstrumentPanel !== 'aeon') failures.push(`chapter 14 final synthesis instrument did not follow path panel: ${aeonInstrumentPanel}`);
  if (!aeonInstrumentLabel?.includes('Current emphasis: Path') || !aeonInstrumentLabel?.includes('Aion ends with motion')) {
    failures.push(`chapter 14 final synthesis instrument label did not follow path panel: ${aeonInstrumentLabel}`);
  }
  if (!aeonVisualPartsVisible) failures.push('chapter 14 final synthesis individuation visual parts are not visibly rendered');
  if (!aeonDescription?.includes('Path: Individuation keeps moving')) failures.push(`chapter 14 scene description did not follow path panel: ${aeonDescription}`);
  if (chapterFourteenScrollY > 10) failures.push(`chapter 14 scene control unexpectedly scrolled page: ${chapterFourteenScrollY}`);

  const chapterFourteenCanvas = page.locator('.scene-host canvas').first();
  const chapterFourteenCanvasCount = await chapterFourteenCanvas.count();
  const chapterFourteenFallbackVisible = await page.locator('.scene-host__fallback').isVisible();
  if (chapterFourteenCanvasCount !== 1) {
    failures.push(`chapter 14 expected one ready canvas but found ${chapterFourteenCanvasCount}; fallback visible: ${chapterFourteenFallbackVisible}`);
  } else {
    const chapterFourteenCanvasBox = await chapterFourteenCanvas.boundingBox();
    const chapterFourteenPixelSample = await waitForCanvasPixels(chapterFourteenCanvas);
    if (!chapterFourteenCanvasBox || chapterFourteenCanvasBox.width < 300 || chapterFourteenCanvasBox.height < 300) {
      failures.push(`chapter 14 canvas geometry too small: ${chapterFourteenCanvasBox ? `${Math.round(chapterFourteenCanvasBox.width)}x${Math.round(chapterFourteenCanvasBox.height)}` : 'missing'}`);
    }
    recordCanvasPixelFailure(failures, 'chapter 14', chapterFourteenPixelSample);
  }
}

async function smokeMobile(page, failures) {
  await page.setViewportSize(mobileViewport);
  for (const route of ['/', '/chapters', '/atlas', '/timeline', '/symbols', '/about', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch5', '/journey/chapter/ch6', '/journey/chapter/ch7', '/journey/chapter/ch8', '/journey/chapter/ch9', '/journey/chapter/ch10', '/journey/chapter/ch11', '/journey/chapter/ch12', '/journey/chapter/ch13', '/journey/chapter/ch14']) {
    await gotoAppRoute(page, route);
    await assertHealthyShell(page, `mobile ${route}`, failures);
  }

  for (const viewport of [mobileViewport, narrowMobileViewport]) {
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

    await smokeChaptersMobileLayout(page, failures, viewport);

    await gotoAppRoute(page, '/journey/chapter/ch1');
    const chapterNavBox = await page.locator('.app-nav').boundingBox();
    const chapterHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const referenceNodes = page.locator('.chapter-stage__reference-node');
    const referenceCount = await referenceNodes.count();
    const panelIds = await referenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const referenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const instrumentBox = await page.locator('.chapter-one-reference').boundingBox();
    if (!chapterNavBox || !chapterHeadingBox) {
      failures.push(`mobile chapter 1 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterNavBottom = chapterNavBox.y + chapterNavBox.height;
    if (chapterNavBottom > chapterHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 1 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterNavBottom)}, heading top ${Math.round(chapterHeadingBox.y)}`);
    }
    if (referenceCount !== 3) failures.push(`mobile chapter 1 reference node count mismatch at ${viewport.width}x${viewport.height}: ${referenceCount}`);
    if (panelIds.join(',') !== 'ego-light,roots,self-depth') failures.push(`mobile chapter 1 reference nodes out of order at ${viewport.width}x${viewport.height}: ${panelIds.join(',')}`);
    if (chapterScrollWidth > viewport.width + 2) failures.push(`mobile chapter 1 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterScrollWidth}`);
    if (referenceMapBox && referenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 1 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(referenceMapBox.width)}`);
    }
    if (!instrumentBox) failures.push(`mobile chapter 1 calibration instrument missing at ${viewport.width}x${viewport.height}`);
    if (instrumentBox && instrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 1 calibration instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(instrumentBox.width)}`);
    }

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
        const chapterEightPixelSample = await waitForCanvasPixels(chapterEightCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 8 at ${viewport.width}x${viewport.height}`, chapterEightPixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch9');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterNineNavBox = await page.locator('.app-nav').boundingBox();
    const chapterNineHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterNineReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterNineReferenceCount = await chapterNineReferenceNodes.count();
    const chapterNinePanelIds = await chapterNineReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterNineScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterNineReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterNineInstrumentBox = await page.locator('.ambivalent-fish-instrument').boundingBox();
    if (!chapterNineNavBox || !chapterNineHeadingBox) {
      failures.push(`mobile chapter 9 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterNineNavBottom = chapterNineNavBox.y + chapterNineNavBox.height;
    if (chapterNineNavBottom > chapterNineHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 9 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterNineNavBottom)}, heading top ${Math.round(chapterNineHeadingBox.y)}`);
    }
    if (chapterNineReferenceCount !== 3) failures.push(`mobile chapter 9 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterNineReferenceCount}`);
    if (chapterNinePanelIds.join(',') !== 'ambivalence,ouroboros,shadow-fish') failures.push(`mobile chapter 9 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterNinePanelIds.join(',')}`);
    if (chapterNineScrollWidth > viewport.width + 2) failures.push(`mobile chapter 9 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterNineScrollWidth}`);
    if (chapterNineReferenceMapBox && chapterNineReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 9 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterNineReferenceMapBox.width)}`);
    }
    if (!chapterNineInstrumentBox) failures.push(`mobile chapter 9 ambivalent fish instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterNineInstrumentBox && chapterNineInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 9 ambivalent fish instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterNineInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterNineCanvas = page.locator('.scene-host canvas').first();
      const chapterNineCanvasCount = await chapterNineCanvas.count();
      if (chapterNineCanvasCount > 0) {
        const chapterNinePixelSample = await waitForCanvasPixels(chapterNineCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 9 at ${viewport.width}x${viewport.height}`, chapterNinePixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch10');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterTenNavBox = await page.locator('.app-nav').boundingBox();
    const chapterTenHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterTenReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterTenReferenceCount = await chapterTenReferenceNodes.count();
    const chapterTenPanelIds = await chapterTenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterTenScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterTenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterTenInstrumentBox = await page.locator('.alchemical-vessel-instrument').boundingBox();
    if (!chapterTenNavBox || !chapterTenHeadingBox) {
      failures.push(`mobile chapter 10 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterTenNavBottom = chapterTenNavBox.y + chapterTenNavBox.height;
    if (chapterTenNavBottom > chapterTenHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 10 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterTenNavBottom)}, heading top ${Math.round(chapterTenHeadingBox.y)}`);
    }
    if (chapterTenReferenceCount !== 3) failures.push(`mobile chapter 10 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterTenReferenceCount}`);
    if (chapterTenPanelIds.join(',') !== 'vessel,prima,opus') failures.push(`mobile chapter 10 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterTenPanelIds.join(',')}`);
    if (chapterTenScrollWidth > viewport.width + 2) failures.push(`mobile chapter 10 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterTenScrollWidth}`);
    if (chapterTenReferenceMapBox && chapterTenReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 10 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterTenReferenceMapBox.width)}`);
    }
    if (!chapterTenInstrumentBox) failures.push(`mobile chapter 10 alchemical vessel instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterTenInstrumentBox && chapterTenInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 10 alchemical vessel instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterTenInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterTenCanvas = page.locator('.scene-host canvas').first();
      const chapterTenCanvasCount = await chapterTenCanvas.count();
      if (chapterTenCanvasCount > 0) {
        const chapterTenPixelSample = await waitForCanvasPixels(chapterTenCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 10 at ${viewport.width}x${viewport.height}`, chapterTenPixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch11');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterElevenNavBox = await page.locator('.app-nav').boundingBox();
    const chapterElevenHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterElevenReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterElevenReferenceCount = await chapterElevenReferenceNodes.count();
    const chapterElevenPanelIds = await chapterElevenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterElevenScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterElevenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterElevenInstrumentBox = await page.locator('.alchemical-tree-instrument').boundingBox();
    if (!chapterElevenNavBox || !chapterElevenHeadingBox) {
      failures.push(`mobile chapter 11 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterElevenNavBottom = chapterElevenNavBox.y + chapterElevenNavBox.height;
    if (chapterElevenNavBottom > chapterElevenHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 11 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterElevenNavBottom)}, heading top ${Math.round(chapterElevenHeadingBox.y)}`);
    }
    if (chapterElevenReferenceCount !== 3) failures.push(`mobile chapter 11 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterElevenReferenceCount}`);
    if (chapterElevenPanelIds.join(',') !== 'mercurius,opus-wheel,lapis') failures.push(`mobile chapter 11 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterElevenPanelIds.join(',')}`);
    if (chapterElevenScrollWidth > viewport.width + 2) failures.push(`mobile chapter 11 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterElevenScrollWidth}`);
    if (chapterElevenReferenceMapBox && chapterElevenReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 11 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterElevenReferenceMapBox.width)}`);
    }
    if (!chapterElevenInstrumentBox) failures.push(`mobile chapter 11 alchemical tree instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterElevenInstrumentBox && chapterElevenInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 11 alchemical tree instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterElevenInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterElevenCanvas = page.locator('.scene-host canvas').first();
      const chapterElevenCanvasCount = await chapterElevenCanvas.count();
      if (chapterElevenCanvasCount > 0) {
        const chapterElevenPixelSample = await waitForCanvasPixels(chapterElevenCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 11 at ${viewport.width}x${viewport.height}`, chapterElevenPixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch12');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterTwelveNavBox = await page.locator('.app-nav').boundingBox();
    const chapterTwelveHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterTwelveReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterTwelveReferenceCount = await chapterTwelveReferenceNodes.count();
    const chapterTwelvePanelIds = await chapterTwelveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterTwelveScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterTwelveReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterTwelveInstrumentBox = await page.locator('.amplification-lens-instrument').boundingBox();
    const chapterTwelveReferenceGlyphLayout = await chapterTwelveReferenceNodes.evaluateAll((nodes) => nodes.map((node) => {
      const label = node.querySelector('.chapter-stage__reference-label');
      const mark = node.querySelector('.chapter-stage__reference-mark');
      if (!label || !mark) return { panelId: node.getAttribute('data-panel-id'), ok: false };
      const before = window.getComputedStyle(mark, '::before');
      const after = window.getComputedStyle(mark, '::after');
      const labelBox = label.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      const beforeLeft = Number.parseFloat(before.left);
      const beforeWidth = Number.parseFloat(before.width);
      const afterLeft = Number.parseFloat(after.left);
      const afterWidth = Number.parseFloat(after.width);
      const beforeRight = beforeLeft + (before.transform === 'none' ? beforeWidth : beforeWidth / 2);
      const afterRight = afterLeft + (after.transform === 'none' ? afterWidth : afterWidth / 2);
      const labelLeft = labelBox.left - nodeBox.left;
      return {
        panelId: node.getAttribute('data-panel-id'),
        ok: [beforeLeft, beforeWidth, afterLeft, afterWidth].every(Number.isFinite)
          && beforeWidth > 0
          && afterWidth > 0
          && beforeRight < labelLeft - 4
          && afterRight < labelLeft - 4,
      };
    }));
    if (!chapterTwelveNavBox || !chapterTwelveHeadingBox) {
      failures.push(`mobile chapter 12 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterTwelveNavBottom = chapterTwelveNavBox.y + chapterTwelveNavBox.height;
    if (chapterTwelveNavBottom > chapterTwelveHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 12 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterTwelveNavBottom)}, heading top ${Math.round(chapterTwelveHeadingBox.y)}`);
    }
    if (chapterTwelveReferenceCount !== 3) failures.push(`mobile chapter 12 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterTwelveReferenceCount}`);
    if (chapterTwelvePanelIds.join(',') !== 'background,roots,bridge') failures.push(`mobile chapter 12 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterTwelvePanelIds.join(',')}`);
    if (chapterTwelveScrollWidth > viewport.width + 2) failures.push(`mobile chapter 12 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterTwelveScrollWidth}`);
    if (chapterTwelveReferenceMapBox && chapterTwelveReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 12 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterTwelveReferenceMapBox.width)}`);
    }
    for (const glyph of chapterTwelveReferenceGlyphLayout) {
      if (!glyph.ok) failures.push(`mobile chapter 12 reference glyph overlaps label rail at ${viewport.width}x${viewport.height}: ${glyph.panelId}`);
    }
    if (!chapterTwelveInstrumentBox) failures.push(`mobile chapter 12 amplification lens instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterTwelveInstrumentBox && chapterTwelveInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 12 amplification lens instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterTwelveInstrumentBox.width)}`);
    }

    if (viewport.width === mobileViewport.width) {
      const chapterTwelveCanvas = page.locator('.scene-host canvas').first();
      const chapterTwelveCanvasCount = await chapterTwelveCanvas.count();
      if (chapterTwelveCanvasCount > 0) {
        const chapterTwelvePixelSample = await waitForCanvasPixels(chapterTwelveCanvas);
        recordCanvasPixelFailure(failures, `mobile chapter 12 at ${viewport.width}x${viewport.height}`, chapterTwelvePixelSample);
      }
    }

    await gotoAppRoute(page, '/journey/chapter/ch13');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterThirteenNavBox = await page.locator('.app-nav').boundingBox();
    const chapterThirteenHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterThirteenReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterThirteenReferenceCount = await chapterThirteenReferenceNodes.count();
    const chapterThirteenPanelIds = await chapterThirteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterThirteenScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterThirteenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterThirteenInstrumentBox = await page.locator('.gnostic-constellation-instrument').boundingBox();
    const chapterThirteenReferenceGlyphLayout = await chapterThirteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => {
      const label = node.querySelector('.chapter-stage__reference-label');
      const mark = node.querySelector('.chapter-stage__reference-mark');
      if (!label || !mark) return { panelId: node.getAttribute('data-panel-id'), ok: false };
      const before = window.getComputedStyle(mark, '::before');
      const after = window.getComputedStyle(mark, '::after');
      const labelBox = label.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      const beforeLeft = Number.parseFloat(before.left);
      const beforeWidth = Number.parseFloat(before.width);
      const afterLeft = Number.parseFloat(after.left);
      const afterWidth = Number.parseFloat(after.width);
      const beforeRight = beforeLeft + (before.transform === 'none' ? beforeWidth : beforeWidth / 2);
      const afterRight = afterLeft + (after.transform === 'none' ? afterWidth : afterWidth / 2);
      const labelLeft = labelBox.left - nodeBox.left;
      return {
        panelId: node.getAttribute('data-panel-id'),
        ok: [beforeLeft, beforeWidth, afterLeft, afterWidth].every(Number.isFinite)
          && beforeWidth > 0
          && afterWidth > 0
          && beforeRight < labelLeft - 4
          && afterRight < labelLeft - 4,
      };
    }));
    if (!chapterThirteenNavBox || !chapterThirteenHeadingBox) {
      failures.push(`mobile chapter 13 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterThirteenNavBottom = chapterThirteenNavBox.y + chapterThirteenNavBox.height;
    if (chapterThirteenNavBottom > chapterThirteenHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 13 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterThirteenNavBottom)}, heading top ${Math.round(chapterThirteenHeadingBox.y)}`);
    }
    if (chapterThirteenReferenceCount !== 3) failures.push(`mobile chapter 13 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterThirteenReferenceCount}`);
    if (chapterThirteenPanelIds.join(',') !== 'gnosis,quaternio,paradox') failures.push(`mobile chapter 13 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterThirteenPanelIds.join(',')}`);
    if (chapterThirteenScrollWidth > viewport.width + 2) failures.push(`mobile chapter 13 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterThirteenScrollWidth}`);
    if (chapterThirteenReferenceMapBox && chapterThirteenReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 13 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterThirteenReferenceMapBox.width)}`);
    }
    for (const glyph of chapterThirteenReferenceGlyphLayout) {
      if (!glyph.ok) failures.push(`mobile chapter 13 reference glyph overlaps label rail at ${viewport.width}x${viewport.height}: ${glyph.panelId}`);
    }
    if (!chapterThirteenInstrumentBox) failures.push(`mobile chapter 13 Gnostic constellation instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterThirteenInstrumentBox && chapterThirteenInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 13 Gnostic constellation instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterThirteenInstrumentBox.width)}`);
    }

    const chapterThirteenCanvas = page.locator('.scene-host canvas').first();
    const chapterThirteenCanvasCount = await chapterThirteenCanvas.count();
    if (chapterThirteenCanvasCount !== 1) {
      failures.push(`mobile chapter 13 expected one ready canvas at ${viewport.width}x${viewport.height} but found ${chapterThirteenCanvasCount}`);
    } else {
      const chapterThirteenCanvasBox = await chapterThirteenCanvas.boundingBox();
      const minCanvasWidth = viewport.width <= 320 ? 260 : 300;
      if (!chapterThirteenCanvasBox || chapterThirteenCanvasBox.width < minCanvasWidth || chapterThirteenCanvasBox.height < 260) {
        failures.push(`mobile chapter 13 canvas geometry too small at ${viewport.width}x${viewport.height}: ${chapterThirteenCanvasBox ? `${Math.round(chapterThirteenCanvasBox.width)}x${Math.round(chapterThirteenCanvasBox.height)}` : 'missing'}`);
      }
      const chapterThirteenPixelSample = await waitForCanvasPixels(chapterThirteenCanvas);
      recordCanvasPixelFailure(failures, `mobile chapter 13 at ${viewport.width}x${viewport.height}`, chapterThirteenPixelSample);
    }

    await gotoAppRoute(page, '/journey/chapter/ch14');
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    const chapterFourteenNavBox = await page.locator('.app-nav').boundingBox();
    const chapterFourteenHeadingBox = await page.locator('.chapter-stage__intro h1').boundingBox();
    const chapterFourteenReferenceNodes = page.locator('.chapter-stage__reference-node');
    const chapterFourteenReferenceCount = await chapterFourteenReferenceNodes.count();
    const chapterFourteenPanelIds = await chapterFourteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-panel-id')));
    const chapterFourteenScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const chapterFourteenReferenceMapBox = await page.locator('.chapter-stage__reference-map').boundingBox();
    const chapterFourteenInstrumentBox = await page.locator('.final-synthesis-instrument').boundingBox();
    const chapterFourteenReferenceGlyphLayout = await chapterFourteenReferenceNodes.evaluateAll((nodes) => nodes.map((node) => {
      const label = node.querySelector('.chapter-stage__reference-label');
      const mark = node.querySelector('.chapter-stage__reference-mark');
      if (!label || !mark) return { panelId: node.getAttribute('data-panel-id'), ok: false };
      const before = window.getComputedStyle(mark, '::before');
      const after = window.getComputedStyle(mark, '::after');
      const labelBox = label.getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      const beforeLeft = Number.parseFloat(before.left);
      const beforeWidth = Number.parseFloat(before.width);
      const afterLeft = Number.parseFloat(after.left);
      const afterWidth = Number.parseFloat(after.width);
      const beforeRight = beforeLeft + (before.transform === 'none' ? beforeWidth : beforeWidth / 2);
      const afterRight = afterLeft + (after.transform === 'none' ? afterWidth : afterWidth / 2);
      const labelLeft = labelBox.left - nodeBox.left;
      return {
        panelId: node.getAttribute('data-panel-id'),
        ok: [beforeLeft, beforeWidth, afterLeft, afterWidth].every(Number.isFinite)
          && beforeWidth > 0
          && afterWidth > 0
          && beforeRight < labelLeft - 4
          && afterRight < labelLeft - 4,
      };
    }));
    if (!chapterFourteenNavBox || !chapterFourteenHeadingBox) {
      failures.push(`mobile chapter 14 geometry missing at ${viewport.width}x${viewport.height}`);
      continue;
    }

    const chapterFourteenNavBottom = chapterFourteenNavBox.y + chapterFourteenNavBox.height;
    if (chapterFourteenNavBottom > chapterFourteenHeadingBox.y - 1) {
      failures.push(`mobile nav overlaps chapter 14 heading at ${viewport.width}x${viewport.height}: nav bottom ${Math.round(chapterFourteenNavBottom)}, heading top ${Math.round(chapterFourteenHeadingBox.y)}`);
    }
    if (chapterFourteenReferenceCount !== 3) failures.push(`mobile chapter 14 reference node count mismatch at ${viewport.width}x${viewport.height}: ${chapterFourteenReferenceCount}`);
    if (chapterFourteenPanelIds.join(',') !== 'gather,axis,aeon') failures.push(`mobile chapter 14 reference nodes out of order at ${viewport.width}x${viewport.height}: ${chapterFourteenPanelIds.join(',')}`);
    if (chapterFourteenScrollWidth > viewport.width + 2) failures.push(`mobile chapter 14 horizontal overflow at ${viewport.width}x${viewport.height}: ${chapterFourteenScrollWidth}`);
    if (chapterFourteenReferenceMapBox && chapterFourteenReferenceMapBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 14 reference map exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterFourteenReferenceMapBox.width)}`);
    }
    for (const glyph of chapterFourteenReferenceGlyphLayout) {
      if (!glyph.ok) failures.push(`mobile chapter 14 reference glyph overlaps label rail at ${viewport.width}x${viewport.height}: ${glyph.panelId}`);
    }
    if (!chapterFourteenInstrumentBox) failures.push(`mobile chapter 14 final synthesis instrument missing at ${viewport.width}x${viewport.height}`);
    if (chapterFourteenInstrumentBox && chapterFourteenInstrumentBox.width > viewport.width + 2) {
      failures.push(`mobile chapter 14 final synthesis instrument exceeds viewport at ${viewport.width}x${viewport.height}: ${Math.round(chapterFourteenInstrumentBox.width)}`);
    }

    const chapterFourteenCanvas = page.locator('.scene-host canvas').first();
    const chapterFourteenCanvasCount = await chapterFourteenCanvas.count();
    if (chapterFourteenCanvasCount !== 1) {
      failures.push(`mobile chapter 14 expected one ready canvas at ${viewport.width}x${viewport.height} but found ${chapterFourteenCanvasCount}`);
    } else {
      const chapterFourteenCanvasBox = await chapterFourteenCanvas.boundingBox();
      const minCanvasWidth = viewport.width <= 320 ? 260 : 300;
      if (!chapterFourteenCanvasBox || chapterFourteenCanvasBox.width < minCanvasWidth || chapterFourteenCanvasBox.height < 260) {
        failures.push(`mobile chapter 14 canvas geometry too small at ${viewport.width}x${viewport.height}: ${chapterFourteenCanvasBox ? `${Math.round(chapterFourteenCanvasBox.width)}x${Math.round(chapterFourteenCanvasBox.height)}` : 'missing'}`);
      }
      const chapterFourteenPixelSample = await waitForCanvasPixels(chapterFourteenCanvas);
      recordCanvasPixelFailure(failures, `mobile chapter 14 at ${viewport.width}x${viewport.height}`, chapterFourteenPixelSample);
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
    await smokeChaptersArcHub(page, failures);
    await smokeAtlasVisualSearch(page, failures);
    await smokeTimelineVisualField(page, failures);
    await smokeSymbolsVisualField(page, failures);
    await smokeAboutOrientation(page, failures);
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
