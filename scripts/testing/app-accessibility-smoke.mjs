import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.AION_A11Y_PORT || 4175);
const baseUrl = `http://127.0.0.1:${port}`;
const canonicalRoutes = ['/', '/chapters', '/atlas', '/timeline', '/symbols', '/about'];
const chapterRoutes = Array.from({ length: 14 }, (_, index) => `/journey/chapter/ch${index + 1}`);
const desktopViewport = { width: 1440, height: 1000 };
const mobileViewport = { width: 390, height: 844 };
const viteBin = process.platform === 'win32'
  ? resolve(repoRoot, 'node_modules/.bin/vite.cmd')
  : resolve(repoRoot, 'node_modules/.bin/vite');

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

async function checkRoute(page, route, failures) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });

  const report = await page.evaluate(() => {
    const getName = (element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const labelledByText = labelledBy
        ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ')
        : '';
      const labelForText = element.id
        ? Array.from(document.querySelectorAll(`label[for="${CSS.escape(element.id)}"]`))
          .map((label) => label.textContent?.trim())
          .filter(Boolean)
          .join(' ')
        : '';

      return [
        element.getAttribute('aria-label'),
        labelledByText,
        labelForText,
        element.getAttribute('alt'),
        element.getAttribute('title'),
        element.textContent?.trim(),
      ].filter(Boolean).join(' ').trim();
    };

    const isVisible = (element) => {
      const box = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return box.width > 0
        && box.height > 0
        && style.visibility !== 'hidden'
        && style.display !== 'none'
        && Number(style.opacity) > 0;
    };

    const interactive = Array.from(document.querySelectorAll(
      'a[href],button,input,select,textarea,[role="button"],[role="link"],[role="tab"],[role="switch"],[role="slider"],[tabindex]',
    )).filter((element) => !element.hasAttribute('disabled') && isVisible(element));

    const unnamedInteractive = interactive
      .filter((element) => !getName(element))
      .map((element) => element.outerHTML.slice(0, 140));

    const positiveTabindex = interactive
      .filter((element) => Number(element.getAttribute('tabindex')) > 0)
      .map((element) => element.outerHTML.slice(0, 140));

    const nonKeyboardInteractive = Array.from(document.querySelectorAll('[onclick], [role="button"], [role="tab"], [role="switch"], [role="slider"]'))
      .filter((element) => !element.hasAttribute('disabled') && isVisible(element))
      .filter((element) => {
        const nativeFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
        const hasTabindex = element.hasAttribute('tabindex');
        return !nativeFocusable && !hasTabindex;
      })
      .map((element) => element.outerHTML.slice(0, 140));

    const smallTargets = interactive
      .filter((element) => !element.classList.contains('skip-link'))
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { html: element.outerHTML.slice(0, 140), width: box.width, height: box.height };
      })
      .filter((target) => target.width < 24 || target.height < 24)
      .slice(0, 8);

    return {
      title: document.title,
      htmlLang: document.documentElement.lang,
      landmarkCounts: {
        banner: document.querySelectorAll('header, [role="banner"]').length,
        nav: document.querySelectorAll('nav, [role="navigation"]').length,
        main: document.querySelectorAll('main, [role="main"]').length,
      },
      skipHref: document.querySelector('.skip-link')?.getAttribute('href'),
      unnamedInteractive,
      positiveTabindex,
      nonKeyboardInteractive,
      smallTargets,
    };
  });

  if (!report.title) failures.push(`${route}: missing document title`);
  if (!report.htmlLang) failures.push(`${route}: missing html lang`);
  if (report.landmarkCounts.banner < 1) failures.push(`${route}: missing banner landmark`);
  if (report.landmarkCounts.nav < 1) failures.push(`${route}: missing navigation landmark`);
  if (report.landmarkCounts.main !== 1) failures.push(`${route}: expected exactly one main landmark, found ${report.landmarkCounts.main}`);
  if (report.skipHref !== '#main-content') failures.push(`${route}: skip link does not target main content`);
  if (report.unnamedInteractive.length > 0) failures.push(`${route}: unnamed interactive controls: ${report.unnamedInteractive.join(' | ')}`);
  if (report.positiveTabindex.length > 0) failures.push(`${route}: positive tabindex found: ${report.positiveTabindex.join(' | ')}`);
  if (report.nonKeyboardInteractive.length > 0) failures.push(`${route}: non-keyboard interactive controls: ${report.nonKeyboardInteractive.join(' | ')}`);
  if (report.smallTargets.length > 0) {
    const targetSummary = report.smallTargets
      .map((target) => `${Math.round(target.width)}x${Math.round(target.height)} ${target.html}`)
      .join(' | ');
    failures.push(`${route}: touch targets below 24px: ${targetSummary}`);
  }
}

async function checkChapterOneDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch1`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrumentGroup = page.getByRole('group', { name: /The Ego calibration instrument/ });
  const instrument = page.getByRole('img', { name: /Ego depth model/ });
  const readout = page.locator('.chapter-one-reference__readout');
  const thesisControls = page.locator('.chapter-stage__thesis-node[aria-controls^="ch1-"]');
  const referenceControls = page.locator('.chapter-stage__reference-node[aria-controls^="ch1-"]');
  const instrumentVisible = await instrument.isVisible();
  const groupPanel = await instrumentGroup.getAttribute('data-active-panel');
  const initialLabel = await instrument.getAttribute('aria-label');
  const readoutLive = await readout.getAttribute('aria-live');
  const readoutAtomic = await readout.getAttribute('aria-atomic');
  const thesisControlCount = await thesisControls.count();
  const referenceControlCount = await referenceControls.count();
  const initialDescription = await page.locator('#scene-host-description-ch1').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch1: ego calibration instrument is missing an accessible image role');
  if (groupPanel !== 'ego-light') failures.push(`/journey/chapter/ch1: initial instrument panel mismatch: ${groupPanel}`);
  if (!initialLabel?.includes('Current emphasis: Orientation') || !initialLabel?.includes('The ego is necessary, but not total')) failures.push(`/journey/chapter/ch1: initial instrument label mismatch: ${initialLabel}`);
  if (!initialDescription?.includes('Orientation: A point of consciousness')) failures.push(`/journey/chapter/ch1: initial scene description mismatch: ${initialDescription}`);
  if (readoutLive !== 'polite') failures.push(`/journey/chapter/ch1: readout aria-live mismatch: ${readoutLive}`);
  if (readoutAtomic !== 'true') failures.push(`/journey/chapter/ch1: readout aria-atomic mismatch: ${readoutAtomic}`);
  if (thesisControlCount !== 3) failures.push(`/journey/chapter/ch1: thesis control count mismatch: ${thesisControlCount}`);
  if (referenceControlCount !== 3) failures.push(`/journey/chapter/ch1: reference control count mismatch: ${referenceControlCount}`);

  const depth = page.getByRole('button', { name: /02\s+Depth/ });
  await depth.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const depthPressed = await depth.getAttribute('aria-pressed');
  const depthPanel = await instrumentGroup.getAttribute('data-active-panel');
  const depthLabel = await instrument.getAttribute('aria-label');
  const depthDescription = await page.locator('#scene-host-description-ch1').textContent();
  if (depthPressed !== 'true') failures.push(`/journey/chapter/ch1: depth button did not become pressed: ${depthPressed}`);
  if (depthPanel !== 'roots') failures.push(`/journey/chapter/ch1: depth instrument panel mismatch: ${depthPanel}`);
  if (!depthLabel?.includes('Current emphasis: Depth') || !depthLabel?.includes('Consciousness rests on what it cannot fully command')) failures.push(`/journey/chapter/ch1: depth instrument label mismatch: ${depthLabel}`);
  if (!depthDescription?.includes('Depth: Two roots feed the I')) failures.push(`/journey/chapter/ch1: depth scene description mismatch: ${depthDescription}`);

  const wholeness = page.getByRole('button', { name: /03\s+Wholeness/ });
  await wholeness.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const wholenessPressed = await wholeness.getAttribute('aria-pressed');
  const wholenessPanel = await instrumentGroup.getAttribute('data-active-panel');
  const wholenessLabel = await instrument.getAttribute('aria-label');
  const wholenessDescription = await page.locator('#scene-host-description-ch1').textContent();
  const pressedThesisCount = await page.locator('.chapter-stage__thesis-node[aria-pressed="true"]').count();
  const ariaCurrentStepCount = await page.locator('.chapter-one-reference__step[aria-current="step"]').count();
  if (wholenessPressed !== 'true') failures.push(`/journey/chapter/ch1: wholeness button did not become pressed: ${wholenessPressed}`);
  if (wholenessPanel !== 'self-depth') failures.push(`/journey/chapter/ch1: wholeness instrument panel mismatch: ${wholenessPanel}`);
  if (!wholenessLabel?.includes('Current emphasis: Wholeness') || !wholenessLabel?.includes('The journey starts by scaling the I correctly')) failures.push(`/journey/chapter/ch1: wholeness instrument label mismatch: ${wholenessLabel}`);
  if (!wholenessDescription?.includes('Wholeness: The Self holds the field')) failures.push(`/journey/chapter/ch1: wholeness scene description mismatch: ${wholenessDescription}`);
  if (pressedThesisCount !== 1) failures.push(`/journey/chapter/ch1: pressed thesis control count mismatch: ${pressedThesisCount}`);
  if (ariaCurrentStepCount !== 1) failures.push(`/journey/chapter/ch1: aria-current calibration step count mismatch: ${ariaCurrentStepCount}`);
}

async function checkPsycheArcDynamicAccessibility(page, failures) {
  const configs = [
    {
      route: '/journey/chapter/ch2',
      arc: 'Shadow',
      model: 'Shadow projection model',
      steps: [
        { panelId: 'mirror', kicker: 'Opposition', title: 'The refused likeness', insight: 'Recognition begins when the image becomes personal.' },
        { panelId: 'projection', kicker: 'Projection', title: 'Thrown outward', insight: 'Projection makes inner conflict look external.' },
        { panelId: 'integration', kicker: 'Integration', title: 'Return without collapse', insight: 'The ego grows by admitting what it excludes.' },
      ],
    },
    {
      route: '/journey/chapter/ch3',
      arc: 'Syzygy',
      model: 'Syzygy relation model',
      steps: [
        { panelId: 'pair', kicker: 'Syzygy', title: 'Two poles, one psyche', insight: 'The psyche thinks in living opposites.' },
        { panelId: 'orbit', kicker: 'Relation', title: 'Projection becomes orbit', insight: 'Wholeness needs tension, not sameness.' },
        { panelId: 'union', kicker: 'Conjunction', title: 'Union flashes, then moves', insight: 'Integration is rhythmic, not static.' },
      ],
    },
    {
      route: '/journey/chapter/ch4',
      arc: 'Self',
      model: 'Self mandala model',
      steps: [
        { panelId: 'seed', kicker: 'Center', title: 'The small center opens', insight: 'The deepest center is not the loudest form.' },
        { panelId: 'quaternity', kicker: 'Fourfold', title: 'Wholeness takes four directions', insight: 'A totality image must include more than perfection.' },
        { panelId: 'mandala', kicker: 'Mandala', title: 'Chaos receives a form', insight: 'The Self orders by holding difference.' },
      ],
    },
  ];

  for (const config of configs) {
    await page.goto(`${baseUrl}${config.route}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

    const group = page.getByRole('group', { name: new RegExp(`Psyche arc instrument for ${config.arc}`, 'i') });
    const image = page.getByRole('img', { name: new RegExp(config.model, 'i') });
    const readout = page.locator('.psyche-arc-instrument__readout');
    const referenceControls = page.locator('.chapter-stage__reference-node');
    const initial = config.steps[0];

    const groupVisible = await group.isVisible();
    const imageVisible = await image.isVisible();
    const initialGroupPanel = await group.getAttribute('data-active-panel');
    const initialImagePanel = await image.getAttribute('data-active-panel');
    const initialLabel = await image.getAttribute('aria-label');
    const readoutLive = await readout.getAttribute('aria-live');
    const readoutAtomic = await readout.getAttribute('aria-atomic');
    const referenceCount = await referenceControls.count();
    const railLinkCount = await page.locator('.psyche-arc-instrument__rail-link').count();
    const currentRailLinkCount = await page.locator('.psyche-arc-instrument__rail-link[aria-current="page"]').count();
    const stepCount = await page.locator('.psyche-arc-instrument__step').count();
    const currentStepCount = await page.locator('.psyche-arc-instrument__step[aria-current="step"]').count();
    const initialDescription = await page.locator(`#scene-host-description-${config.route.split('/').at(-1)}`).textContent();

    if (!groupVisible) failures.push(`${config.route}: psyche arc group is not visible`);
    if (!imageVisible) failures.push(`${config.route}: ${config.model} is missing an accessible image role`);
    if (initialGroupPanel !== initial.panelId) failures.push(`${config.route}: initial psyche arc group panel mismatch: ${initialGroupPanel}`);
    if (initialImagePanel !== initial.panelId) failures.push(`${config.route}: initial psyche arc image panel mismatch: ${initialImagePanel}`);
    if (!initialLabel?.includes(`Current emphasis: ${initial.kicker}`) || !initialLabel?.includes(initial.insight)) failures.push(`${config.route}: initial psyche arc label mismatch: ${initialLabel}`);
    if (!initialDescription?.includes(`${initial.kicker}: ${initial.title}`)) failures.push(`${config.route}: initial scene description mismatch: ${initialDescription}`);
    if (readoutLive !== 'polite') failures.push(`${config.route}: psyche arc readout aria-live mismatch: ${readoutLive}`);
    if (readoutAtomic !== 'true') failures.push(`${config.route}: psyche arc readout aria-atomic mismatch: ${readoutAtomic}`);
    if (referenceCount !== 3) failures.push(`${config.route}: reference control count mismatch: ${referenceCount}`);
    if (railLinkCount !== 3) failures.push(`${config.route}: psyche arc rail link count mismatch: ${railLinkCount}`);
    if (currentRailLinkCount !== 1) failures.push(`${config.route}: current psyche arc rail count mismatch: ${currentRailLinkCount}`);
    if (stepCount !== 3) failures.push(`${config.route}: psyche arc step count mismatch: ${stepCount}`);
    if (currentStepCount !== 1) failures.push(`${config.route}: initial psyche arc current step count mismatch: ${currentStepCount}`);

    const second = config.steps[1];
    const secondControl = page.locator(`.chapter-stage__reference-node[data-panel-id="${second.panelId}"]`);
    await secondControl.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    const secondPressed = await secondControl.getAttribute('aria-pressed');
    const secondGroupPanel = await group.getAttribute('data-active-panel');
    const secondImageLabel = await image.getAttribute('aria-label');
    const secondDescription = await page.locator(`#scene-host-description-${config.route.split('/').at(-1)}`).textContent();
    if (secondPressed !== 'true') failures.push(`${config.route}: second psyche arc control did not become pressed: ${secondPressed}`);
    if (secondGroupPanel !== second.panelId) failures.push(`${config.route}: second psyche arc panel mismatch: ${secondGroupPanel}`);
    if (!secondImageLabel?.includes(`Current emphasis: ${second.kicker}`) || !secondImageLabel?.includes(second.insight)) failures.push(`${config.route}: second psyche arc label mismatch: ${secondImageLabel}`);
    if (!secondDescription?.includes(`${second.kicker}: ${second.title}`)) failures.push(`${config.route}: second scene description mismatch: ${secondDescription}`);

    const third = config.steps[2];
    const thirdControl = page.locator(`.chapter-stage__reference-node[data-panel-id="${third.panelId}"]`);
    await thirdControl.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    const thirdPressed = await thirdControl.getAttribute('aria-pressed');
    const thirdGroupPanel = await group.getAttribute('data-active-panel');
    const thirdImageLabel = await image.getAttribute('aria-label');
    const thirdDescription = await page.locator(`#scene-host-description-${config.route.split('/').at(-1)}`).textContent();
    const pressedReferenceCount = await page.locator('.chapter-stage__reference-node[aria-pressed="true"]').count();
    const finalCurrentStepCount = await page.locator('.psyche-arc-instrument__step[aria-current="step"]').count();
    if (thirdPressed !== 'true') failures.push(`${config.route}: third psyche arc control did not become pressed: ${thirdPressed}`);
    if (thirdGroupPanel !== third.panelId) failures.push(`${config.route}: third psyche arc panel mismatch: ${thirdGroupPanel}`);
    if (!thirdImageLabel?.includes(`Current emphasis: ${third.kicker}`) || !thirdImageLabel?.includes(third.insight)) failures.push(`${config.route}: third psyche arc label mismatch: ${thirdImageLabel}`);
    if (!thirdDescription?.includes(`${third.kicker}: ${third.title}`)) failures.push(`${config.route}: third scene description mismatch: ${thirdDescription}`);
    if (pressedReferenceCount !== 1) failures.push(`${config.route}: pressed reference control count mismatch: ${pressedReferenceCount}`);
    if (finalCurrentStepCount !== 1) failures.push(`${config.route}: final psyche arc current step count mismatch: ${finalCurrentStepCount}`);
  }
}

async function checkChaptersDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/chapters`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });

  const arcHub = page.getByLabel('Interactive chapter arc hub');
  const orbit = page.getByLabel('Interactive chapter orbit');
  const selectedDetail = page.locator('#chapters-selected-detail');
  const arcButtons = page.locator('.chapters-arc-map__cluster');
  const orbitButtons = page.locator('.chapters-orbit__node');
  const selectedLink = page.locator('.chapters-selected-panel__link');
  const chapterOneButton = page.getByRole('button', { name: /Preview chapter 1: The Ego/ });
  const chapterFourteenButton = page.getByRole('button', { name: /Preview chapter 14: The Structure and Dynamics of the Self/ });

  if (!await arcHub.isVisible()) failures.push('/chapters: arc hub is not exposed by label');
  if (!await orbit.isVisible()) failures.push('/chapters: chapter orbit is not exposed by label');
  if (await arcButtons.count() !== 7) failures.push(`/chapters: arc button count mismatch: ${await arcButtons.count()}`);
  if (await orbitButtons.count() !== 14) failures.push(`/chapters: orbit button count mismatch: ${await orbitButtons.count()}`);
  if (await page.locator('.chapters-orbit__node[aria-controls~="chapters-selected-detail"]').count() !== 14) {
    failures.push('/chapters: orbit buttons do not all control selected detail');
  }
  if (await page.locator('.chapters-orbit__node[aria-pressed="true"]').count() !== 1) {
    failures.push('/chapters: initial orbit pressed count is not one');
  }

  await chapterOneButton.focus();
  await chapterOneButton.press('End');
  await page.waitForTimeout(100);
  const chapterFourteenPressed = await chapterFourteenButton.getAttribute('aria-pressed');
  const detailChapter = await selectedDetail.getAttribute('data-selected-chapter');
  const linkHref = await selectedLink.getAttribute('href');
  if (chapterFourteenPressed !== 'true') failures.push(`/chapters: End key did not select chapter 14: ${chapterFourteenPressed}`);
  if (detailChapter !== 'ch14') failures.push(`/chapters: selected detail did not announce chapter 14: ${detailChapter}`);
  if (linkHref !== '/journey/chapter/ch14') failures.push(`/chapters: selected chapter link mismatch after keyboard selection: ${linkHref}`);

  await chapterFourteenButton.press('Home');
  await page.waitForTimeout(100);
  const chapterOnePressed = await chapterOneButton.getAttribute('aria-pressed');
  const resetChapter = await selectedDetail.getAttribute('data-selected-chapter');
  if (chapterOnePressed !== 'true') failures.push(`/chapters: Home key did not return to chapter 1: ${chapterOnePressed}`);
  if (resetChapter !== 'ch1') failures.push(`/chapters: selected detail did not return to chapter 1: ${resetChapter}`);
}

async function checkAtlasDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/atlas`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });

  const fieldImage = page.getByRole('img', { name: /The Ego Concept Field/ });
  const search = page.locator('#atlas-search');
  const chapterRail = page.locator('.atlas-constellation__chapter-rail');
  const initialRailLabel = await chapterRail.getAttribute('aria-label');
  const initialCheckedCount = await page.locator('.atlas-constellation__chapter[role="radio"][aria-checked="true"]').count();

  if (!await fieldImage.isVisible()) failures.push('/atlas: constellation image is missing an accessible name');
  if (initialRailLabel !== '14 chapters in view') failures.push(`/atlas: initial chapter rail label mismatch: ${initialRailLabel}`);
  if (initialCheckedCount !== 1) failures.push(`/atlas: checked radio count mismatch: ${initialCheckedCount}`);

  await search.fill('syzygy');
  await page.waitForFunction(() => {
    const count = document.querySelectorAll('.atlas-constellation__chapter').length;
    return count > 0 && count < 14;
  }, null, { timeout: 2_000 }).catch(() => {});

  const filteredChapterCount = await page.locator('.atlas-constellation__chapter').count();
  const filteredRailLabel = await chapterRail.getAttribute('aria-label');
  const filteredRailLabelExpected = `${filteredChapterCount} chapter${filteredChapterCount === 1 ? '' : 's'} in view`;
  const syzygyRadioVisible = await page.getByRole('radio', { name: /Select chapter 3: The Syzygy/ }).isVisible();
  const filteredImageVisible = await page.getByRole('img', { name: /The Syzygy: Anima and Animus Concept Field/ }).isVisible();

  if (filteredChapterCount <= 0 || filteredChapterCount >= 14) failures.push(`/atlas: filtered chapter count did not narrow: ${filteredChapterCount}`);
  if (filteredRailLabel !== filteredRailLabelExpected) failures.push(`/atlas: filtered chapter rail label mismatch: ${filteredRailLabel}`);
  if (!syzygyRadioVisible) failures.push('/atlas: filtered syzygy radio is not visible');
  if (!filteredImageVisible) failures.push('/atlas: filtered constellation image did not update accessible name');

  await search.fill('not-a-real-term');
  await page.waitForTimeout(100);
  const emptyRailLabel = await chapterRail.getAttribute('aria-label');
  const emptyFieldVisible = await page.getByRole('img', { name: /Empty Atlas Field/ }).isVisible();
  if (emptyRailLabel !== '0 chapters in view') failures.push(`/atlas: empty chapter rail label mismatch: ${emptyRailLabel}`);
  if (!emptyFieldVisible) failures.push('/atlas: empty constellation field is missing an accessible name');
}

async function checkTimelineDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/timeline`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });

  const search = page.getByLabel('Search');
  const category = page.getByLabel('Category');
  const timelineField = page.getByRole('group', { name: /Timeline field:/ });
  const quickFilters = page.getByRole('group', { name: 'Timeline filter chips' });
  const detailLens = page.getByRole('group', { name: 'Selected event interpretive lens' });
  const orbitLabel = await page.locator('.timeline-orbit').getAttribute('aria-label');
  const initialFieldLabel = await timelineField.getAttribute('aria-label');
  const searchVisible = await search.isVisible();
  const categoryVisible = await category.isVisible();
  const fieldVisible = await timelineField.isVisible();
  const quickFiltersVisible = await quickFilters.isVisible();
  const detailLensVisible = await detailLens.isVisible();
  const initialActiveRailCount = await page.locator('.timeline-rail__item[aria-pressed="true"]').count();
  const initialActiveFieldCount = await page.locator('.timeline-field__node[aria-pressed="true"]').count();
  const initialChipCount = await page.locator('.timeline-controls__chip').count();
  const initialPressedChipCount = await page.locator('.timeline-controls__chip[aria-pressed="true"]').count();
  const initialPhaseCount = await page.locator('.timeline-field__phase').count();
  const initialLensText = await page.locator('.timeline-detail__lens').textContent();
  const firstOrbitControls = await page.locator('.timeline-orbit__node').first().getAttribute('aria-controls');
  const firstFieldControls = await page.locator('.timeline-field__node').first().getAttribute('aria-controls');

  if (!searchVisible) failures.push('/timeline: search input is not visible by label');
  if (!categoryVisible) failures.push('/timeline: category select is not visible by label');
  if (!fieldVisible) failures.push('/timeline: timeline field group is missing an accessible name');
  if (!quickFiltersVisible) failures.push('/timeline: quick filter group is missing an accessible name');
  if (!detailLensVisible) failures.push('/timeline: interpretive lens group is missing an accessible name');
  if (!orbitLabel?.includes('12 events in view')) failures.push(`/timeline: initial orbit label mismatch: ${orbitLabel}`);
  if (!initialFieldLabel?.includes('22 of 22 events visible')) failures.push(`/timeline: initial field label mismatch: ${initialFieldLabel}`);
  if (initialActiveRailCount !== 1) failures.push(`/timeline: initial active rail count mismatch: ${initialActiveRailCount}`);
  if (initialActiveFieldCount !== 1) failures.push(`/timeline: initial active field count mismatch: ${initialActiveFieldCount}`);
  if (initialChipCount !== 5) failures.push(`/timeline: category chip count mismatch: ${initialChipCount}`);
  if (initialPressedChipCount !== 1) failures.push(`/timeline: pressed category chip count mismatch: ${initialPressedChipCount}`);
  if (initialPhaseCount !== 4) failures.push(`/timeline: phase count mismatch: ${initialPhaseCount}`);
  if (!initialLensText?.includes('1875') || !initialLensText?.includes('Clinical roots')) failures.push(`/timeline: initial lens mismatch: ${initialLensText}`);
  if (!firstOrbitControls?.includes('timeline-selected-detail') || !firstOrbitControls?.includes('timeline-field')) failures.push(`/timeline: orbit controls mismatch: ${firstOrbitControls}`);
  if (!firstFieldControls?.includes('timeline-selected-detail') || !firstFieldControls?.includes('timeline-selected-orbit-detail')) failures.push(`/timeline: field controls mismatch: ${firstFieldControls}`);

  const freudRail = page.getByRole('button', { name: /1907 · Encounters First meeting with Sigmund Freud/ });
  await freudRail.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const freudPressed = await freudRail.getAttribute('aria-pressed');
  const freudDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const freudOrbit = await page.locator('#timeline-selected-orbit-detail').textContent();
  const freudLens = await page.locator('.timeline-detail__lens').textContent();
  if (freudPressed !== 'true') failures.push(`/timeline: Freud rail did not become pressed: ${freudPressed}`);
  if (!freudDetail?.includes('First meeting with Sigmund Freud')) failures.push(`/timeline: Freud detail mismatch: ${freudDetail}`);
  if (!freudOrbit?.includes('1907') || !freudOrbit?.includes('First meeting with Sigmund Freud')) failures.push(`/timeline: Freud orbit mismatch: ${freudOrbit}`);
  if (!freudLens?.includes('Encounters') || !freudLens?.includes('Rupture / descent')) failures.push(`/timeline: Freud lens mismatch: ${freudLens}`);

  await search.fill('not-a-real-term');
  await page.waitForTimeout(100);
  const emptyDetail = await page.locator('#timeline-selected-detail h2').textContent();
  const emptyStatus = await page.locator('.timeline-field__empty').textContent();
  const emptyFieldLabel = await timelineField.getAttribute('aria-label');
  const emptyPressedCount = await page.locator('.timeline-rail__item[aria-pressed="true"], .timeline-field__node[aria-pressed="true"], .timeline-orbit__node[aria-pressed="true"]').count();
  if (!emptyDetail?.includes('Adjust the field')) failures.push(`/timeline: empty detail mismatch: ${emptyDetail}`);
  if (!emptyStatus?.includes('No matching events')) failures.push(`/timeline: empty status mismatch: ${emptyStatus}`);
  if (!emptyFieldLabel?.includes('0 of 22 events visible')) failures.push(`/timeline: empty field label mismatch: ${emptyFieldLabel}`);
  if (emptyPressedCount !== 0) failures.push(`/timeline: empty state still has pressed controls: ${emptyPressedCount}`);
}

async function checkSymbolsDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/symbols`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });

  const fishField = page.getByRole('img', { name: /Fish symbol field/ });
  const initialFieldVisible = await fishField.isVisible();
  const initialFieldLabel = initialFieldVisible ? await fishField.getAttribute('aria-label') : null;
  const detailRegion = page.locator('#symbol-selected-detail');
  const detailAtomic = await detailRegion.getAttribute('aria-atomic');
  const initialDetail = await page.locator('#symbol-selected-detail h2').textContent();

  if (!initialFieldVisible) failures.push('/symbols: active symbol field is missing an accessible image role');
  if (!initialFieldLabel?.includes('Piscean fish pair') || !initialFieldLabel?.includes('Chapter 6')) failures.push(`/symbols: initial field label mismatch: ${initialFieldLabel}`);
  if (detailAtomic !== 'true') failures.push(`/symbols: detail live region is not atomic: ${detailAtomic}`);
  if (!initialDetail?.includes('Fish')) failures.push(`/symbols: initial detail mismatch: ${initialDetail}`);

  const sophia = page.getByRole('button', { name: /Select Sophia:/ });
  await sophia.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const sophiaPressed = await sophia.getAttribute('aria-pressed');
  const sophiaFieldLabel = await page.getByRole('img', { name: /Sophia symbol field/ }).getAttribute('aria-label');
  const sophiaDetail = await page.locator('#symbol-selected-detail h2').textContent();
  if (sophiaPressed !== 'true') failures.push(`/symbols: Sophia orbit button did not become pressed: ${sophiaPressed}`);
  if (!sophiaFieldLabel?.includes('Sophia / wisdom figure') || !sophiaFieldLabel?.includes('The Syzygy')) failures.push(`/symbols: Sophia field label mismatch: ${sophiaFieldLabel}`);
  if (!sophiaDetail?.includes('Sophia')) failures.push(`/symbols: Sophia detail mismatch: ${sophiaDetail}`);

  const lapis = page.getByRole('button', { name: /Focus Lapis in the symbol field/ });
  await lapis.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const lapisPressed = await lapis.getAttribute('aria-pressed');
  const lapisFieldLabel = await page.getByRole('img', { name: /Lapis symbol field/ }).getAttribute('aria-label');
  const lapisDetail = await page.locator('#symbol-selected-detail h2').textContent();
  if (lapisPressed !== 'true') failures.push(`/symbols: Lapis panel button did not become pressed: ${lapisPressed}`);
  if (!lapisFieldLabel?.includes('Lapis philosophorum') || !lapisFieldLabel?.toLowerCase().includes('individuation')) failures.push(`/symbols: Lapis field label mismatch: ${lapisFieldLabel}`);
  if (!lapisDetail?.includes('Lapis')) failures.push(`/symbols: Lapis detail mismatch: ${lapisDetail}`);
}

async function checkAboutDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/about`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });

  const orientation = page.getByRole('group', { name: /Aion orientation instrument/ });
  const controls = page.getByRole('group', { name: /Learning orientation modes/ });
  const detail = page.locator('#about-orientation-detail');
  const field = page.getByRole('img', { name: /Aion learning orientation field/ });
  const modeButtons = page.locator('.about-orientation-node');
  const detailLive = await detail.getAttribute('aria-live');
  const detailAtomic = await detail.getAttribute('aria-atomic');
  const controlsCount = await modeButtons.count();
  const controlsWithTargets = await page.locator('.about-orientation-node[aria-controls~="about-orientation-detail"][aria-controls~="about-orientation-field"]').count();
  const initialPressed = await page.locator('.about-orientation-node[aria-pressed="true"]').count();

  if (!await orientation.isVisible()) failures.push('/about: orientation group is missing an accessible name');
  if (!await controls.isVisible()) failures.push('/about: orientation controls group is missing an accessible name');
  if (!await field.isVisible()) failures.push('/about: orientation field image is missing an accessible name');
  if (detailLive !== 'polite') failures.push(`/about: detail live region mismatch: ${detailLive}`);
  if (detailAtomic !== 'true') failures.push(`/about: detail live region should be atomic: ${detailAtomic}`);
  if (controlsCount !== 4) failures.push(`/about: orientation button count mismatch: ${controlsCount}`);
  if (controlsWithTargets !== 4) failures.push(`/about: orientation buttons controls mismatch: ${controlsWithTargets}`);
  if (initialPressed !== 1) failures.push(`/about: initial pressed count mismatch: ${initialPressed}`);

  const map = page.getByRole('button', { name: /Map: See concepts as relations/ });
  await map.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const mapPressed = await map.getAttribute('aria-pressed');
  const mapDetail = await detail.textContent();
  if (mapPressed !== 'true') failures.push(`/about: Map button did not become pressed: ${mapPressed}`);
  if (!mapDetail?.includes('See concepts as relations') || !mapDetail?.includes('Concept graph')) failures.push(`/about: Map detail did not update: ${mapDetail}`);

  const verify = page.getByRole('button', { name: /Verify: Keep the orientation honest/ });
  await verify.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
  const verifyPressed = await verify.getAttribute('aria-pressed');
  const verifyDetail = await detail.textContent();
  if (verifyPressed !== 'true') failures.push(`/about: Verify button did not become pressed: ${verifyPressed}`);
  if (!verifyDetail?.includes('Keep the orientation honest') || !verifyDetail?.includes('Quality gate')) failures.push(`/about: Verify detail did not update: ${verifyDetail}`);

  const finalPressed = await page.locator('.about-orientation-node[aria-pressed="true"]').count();
  if (finalPressed !== 1) failures.push(`/about: final pressed count mismatch: ${finalPressed}`);
}

async function checkChapterSixDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch6`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Sign of the Fishes model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch6').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch6: aeon fish instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Pisces')) failures.push(`/journey/chapter/ch6: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Pisces: Two fish, two directions')) failures.push(`/journey/chapter/ch6: initial scene description mismatch: ${initialDescription}`);

  const aeon = page.getByRole('button', { name: /02\s+Aeon/ });
  await aeon.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const aeonPressed = await aeon.getAttribute('aria-pressed');
  const aeonLabel = await instrument.getAttribute('aria-label');
  const aeonDescription = await page.locator('#scene-host-description-ch6').textContent();
  if (aeonPressed !== 'true') failures.push(`/journey/chapter/ch6: aeon button did not become pressed: ${aeonPressed}`);
  if (!aeonLabel?.includes('Current emphasis: Aeon') || !aeonLabel?.includes('History gains a wheel')) failures.push(`/journey/chapter/ch6: aeon instrument label mismatch: ${aeonLabel}`);
  if (!aeonDescription?.includes('Aeon: History gains a wheel')) failures.push(`/journey/chapter/ch6: aeon scene description mismatch: ${aeonDescription}`);

  const threshold = page.getByRole('button', { name: /03\s+Threshold/ });
  await threshold.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const thresholdPressed = await threshold.getAttribute('aria-pressed');
  const thresholdLabel = await instrument.getAttribute('aria-label');
  const thresholdDescription = await page.locator('#scene-host-description-ch6').textContent();
  if (thresholdPressed !== 'true') failures.push(`/journey/chapter/ch6: threshold button did not become pressed: ${thresholdPressed}`);
  if (!thresholdLabel?.includes('Current emphasis: Threshold') || !thresholdLabel?.includes('The age turns slowly')) failures.push(`/journey/chapter/ch6: threshold instrument label mismatch: ${thresholdLabel}`);
  if (!thresholdDescription?.includes('Threshold: The age turns slowly')) failures.push(`/journey/chapter/ch6: threshold scene description mismatch: ${thresholdDescription}`);
}

async function checkChapterSevenDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch7`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Prophecy field model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch7').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch7: prophecy field instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Prophecy')) failures.push(`/journey/chapter/ch7: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Prophecy: Meaning under pressure')) failures.push(`/journey/chapter/ch7: initial scene description mismatch: ${initialDescription}`);

  const collective = page.getByRole('button', { name: /02\s+Collective/ });
  await collective.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const collectivePressed = await collective.getAttribute('aria-pressed');
  const collectiveLabel = await instrument.getAttribute('aria-label');
  const collectiveDescription = await page.locator('#scene-host-description-ch7').textContent();
  if (collectivePressed !== 'true') failures.push(`/journey/chapter/ch7: collective button did not become pressed: ${collectivePressed}`);
  if (!collectiveLabel?.includes('Current emphasis: Collective') || !collectiveLabel?.includes('Private fear becomes shared image')) failures.push(`/journey/chapter/ch7: collective instrument label mismatch: ${collectiveLabel}`);
  if (!collectiveDescription?.includes('Collective: Private fear becomes shared image')) failures.push(`/journey/chapter/ch7: collective scene description mismatch: ${collectiveDescription}`);

  const threshold = page.getByRole('button', { name: /03\s+Threshold/ });
  await threshold.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const thresholdPressed = await threshold.getAttribute('aria-pressed');
  const thresholdLabel = await instrument.getAttribute('aria-label');
  const thresholdDescription = await page.locator('#scene-host-description-ch7').textContent();
  if (thresholdPressed !== 'true') failures.push(`/journey/chapter/ch7: threshold button did not become pressed: ${thresholdPressed}`);
  if (!thresholdLabel?.includes('Current emphasis: Threshold') || !thresholdLabel?.includes('The future looks backward')) failures.push(`/journey/chapter/ch7: threshold instrument label mismatch: ${thresholdLabel}`);
  if (!thresholdDescription?.includes('Threshold: The future looks backward')) failures.push(`/journey/chapter/ch7: threshold scene description mismatch: ${thresholdDescription}`);
}

async function checkChapterEightDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch8`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Historical strata model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch8').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch8: historical strata instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: History') || !initialInstrumentLabel?.includes('fish motif')) failures.push(`/journey/chapter/ch8: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('History: Symbols gather sediment')) failures.push(`/journey/chapter/ch8: initial scene description mismatch: ${initialDescription}`);

  const earlyImage = page.getByRole('button', { name: /02\s+Early Image/ });
  await earlyImage.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const earlyImagePressed = await earlyImage.getAttribute('aria-pressed');
  const earlyImageLabel = await instrument.getAttribute('aria-label');
  const earlyImageDescription = await page.locator('#scene-host-description-ch8').textContent();
  if (earlyImagePressed !== 'true') failures.push(`/journey/chapter/ch8: early image button did not become pressed: ${earlyImagePressed}`);
  if (!earlyImageLabel?.includes('Current emphasis: Early Image') || !earlyImageLabel?.includes('A small sign can hold a total world')) failures.push(`/journey/chapter/ch8: early image instrument label mismatch: ${earlyImageLabel}`);
  if (!earlyImageDescription?.includes('Early Image: The fish becomes a carrier')) failures.push(`/journey/chapter/ch8: early image scene description mismatch: ${earlyImageDescription}`);

  const afterlife = page.getByRole('button', { name: /03\s+Afterlife/ });
  await afterlife.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const afterlifePressed = await afterlife.getAttribute('aria-pressed');
  const afterlifeLabel = await instrument.getAttribute('aria-label');
  const afterlifeDescription = await page.locator('#scene-host-description-ch8').textContent();
  if (afterlifePressed !== 'true') failures.push(`/journey/chapter/ch8: afterlife button did not become pressed: ${afterlifePressed}`);
  if (!afterlifeLabel?.includes('Current emphasis: Afterlife') || !afterlifeLabel?.includes('The unconscious preserves symbolic depth')) failures.push(`/journey/chapter/ch8: afterlife instrument label mismatch: ${afterlifeLabel}`);
  if (!afterlifeDescription?.includes('Afterlife: Old images keep speaking')) failures.push(`/journey/chapter/ch8: afterlife scene description mismatch: ${afterlifeDescription}`);
}

async function checkChapterNineDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch9`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Ambivalent fish model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch9').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch9: ambivalent fish instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Paradox') || !initialInstrumentLabel?.includes('blessing and threat')) failures.push(`/journey/chapter/ch9: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Paradox: The fish has a double edge')) failures.push(`/journey/chapter/ch9: initial scene description mismatch: ${initialDescription}`);

  const ouroboros = page.getByRole('button', { name: /02\s+Return/ });
  await ouroboros.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const ouroborosPressed = await ouroboros.getAttribute('aria-pressed');
  const ouroborosLabel = await instrument.getAttribute('aria-label');
  const ouroborosDescription = await page.locator('#scene-host-description-ch9').textContent();
  if (ouroborosPressed !== 'true') failures.push(`/journey/chapter/ch9: return button did not become pressed: ${ouroborosPressed}`);
  if (!ouroborosLabel?.includes('Current emphasis: Return') || !ouroborosLabel?.includes('The psyche circles what it cannot solve linearly')) failures.push(`/journey/chapter/ch9: return instrument label mismatch: ${ouroborosLabel}`);
  if (!ouroborosDescription?.includes('Return: The image eats its tail')) failures.push(`/journey/chapter/ch9: return scene description mismatch: ${ouroborosDescription}`);

  const shadow = page.getByRole('button', { name: /03\s+Shadow/ });
  await shadow.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const shadowPressed = await shadow.getAttribute('aria-pressed');
  const shadowLabel = await instrument.getAttribute('aria-label');
  const shadowDescription = await page.locator('#scene-host-description-ch9').textContent();
  if (shadowPressed !== 'true') failures.push(`/journey/chapter/ch9: shadow button did not become pressed: ${shadowPressed}`);
  if (!shadowLabel?.includes('Current emphasis: Shadow') || !shadowLabel?.includes('A total image includes its antagonist')) failures.push(`/journey/chapter/ch9: shadow instrument label mismatch: ${shadowLabel}`);
  if (!shadowDescription?.includes('Shadow: Light casts its fish-shadow')) failures.push(`/journey/chapter/ch9: shadow scene description mismatch: ${shadowDescription}`);
}

async function checkChapterTenDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch10`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Alchemical vessel model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch10').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch10: alchemical vessel instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Alchemy') || !initialInstrumentLabel?.includes('fish-symbol enters')) failures.push(`/journey/chapter/ch10: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Alchemy: The fish enters the opus')) failures.push(`/journey/chapter/ch10: initial scene description mismatch: ${initialDescription}`);

  const prima = page.getByRole('button', { name: /02\s+Prima Materia/ });
  await prima.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const primaPressed = await prima.getAttribute('aria-pressed');
  const primaLabel = await instrument.getAttribute('aria-label');
  const primaDescription = await page.locator('#scene-host-description-ch10').textContent();
  if (primaPressed !== 'true') failures.push(`/journey/chapter/ch10: prima materia button did not become pressed: ${primaPressed}`);
  if (!primaLabel?.includes('Current emphasis: Prima Materia') || !primaLabel?.includes('The raw state is not a mistake')) failures.push(`/journey/chapter/ch10: prima materia instrument label mismatch: ${primaLabel}`);
  if (!primaDescription?.includes('Prima Materia: Begin with the mixed thing')) failures.push(`/journey/chapter/ch10: prima materia scene description mismatch: ${primaDescription}`);

  const opus = page.getByRole('button', { name: /03\s+Opus/ });
  await opus.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const opusPressed = await opus.getAttribute('aria-pressed');
  const opusLabel = await instrument.getAttribute('aria-label');
  const opusDescription = await page.locator('#scene-host-description-ch10').textContent();
  if (opusPressed !== 'true') failures.push(`/journey/chapter/ch10: opus button did not become pressed: ${opusPressed}`);
  if (!opusLabel?.includes('Current emphasis: Opus') || !opusLabel?.includes('Alchemy gives psychology a theater')) failures.push(`/journey/chapter/ch10: opus instrument label mismatch: ${opusLabel}`);
  if (!opusDescription?.includes('Opus: Matter teaches psyche')) failures.push(`/journey/chapter/ch10: opus scene description mismatch: ${opusDescription}`);
}

async function checkChapterElevenDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch11`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Philosophical tree model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch11').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch11: philosophical tree instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Mediator') || !initialInstrumentLabel?.includes('Mercurius holds the middle')) failures.push(`/journey/chapter/ch11: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Mediator: The slippery middle')) failures.push(`/journey/chapter/ch11: initial scene description mismatch: ${initialDescription}`);

  const opus = page.getByRole('button', { name: /02\s+Opus/ });
  await opus.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const opusPressed = await opus.getAttribute('aria-pressed');
  const opusLabel = await instrument.getAttribute('aria-label');
  const opusDescription = await page.locator('#scene-host-description-ch11').textContent();
  if (opusPressed !== 'true') failures.push(`/journey/chapter/ch11: opus button did not become pressed: ${opusPressed}`);
  if (!opusLabel?.includes('Current emphasis: Opus') || !opusLabel?.includes('Change returns to deepen itself')) failures.push(`/journey/chapter/ch11: opus instrument label mismatch: ${opusLabel}`);
  if (!opusDescription?.includes('Opus: Transformation repeats')) failures.push(`/journey/chapter/ch11: opus scene description mismatch: ${opusDescription}`);

  const stone = page.getByRole('button', { name: /03\s+Stone/ });
  await stone.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const stonePressed = await stone.getAttribute('aria-pressed');
  const stoneLabel = await instrument.getAttribute('aria-label');
  const stoneDescription = await page.locator('#scene-host-description-ch11').textContent();
  if (stonePressed !== 'true') failures.push(`/journey/chapter/ch11: stone button did not become pressed: ${stonePressed}`);
  if (!stoneLabel?.includes('Current emphasis: Stone') || !stoneLabel?.includes('Completion keeps the opposites alive')) failures.push(`/journey/chapter/ch11: stone instrument label mismatch: ${stoneLabel}`);
  if (!stoneDescription?.includes('Stone: The goal is a formed paradox')) failures.push(`/journey/chapter/ch11: stone scene description mismatch: ${stoneDescription}`);
}

async function checkChapterTwelveDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch12`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Amplification lens model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = await instrument.getAttribute('aria-label');
  const initialDescription = await page.locator('#scene-host-description-ch12').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch12: amplification lens instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Method') || !initialInstrumentLabel?.includes('disciplined symbolic lens')) failures.push(`/journey/chapter/ch12: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Method: Read through the lens')) failures.push(`/journey/chapter/ch12: initial scene description mismatch: ${initialDescription}`);

  const genealogy = page.getByRole('button', { name: /02\s+Genealogy/ });
  await genealogy.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const genealogyPressed = await genealogy.getAttribute('aria-pressed');
  const genealogyLabel = await instrument.getAttribute('aria-label');
  const genealogyDescription = await page.locator('#scene-host-description-ch12').textContent();
  if (genealogyPressed !== 'true') failures.push(`/journey/chapter/ch12: genealogy button did not become pressed: ${genealogyPressed}`);
  if (!genealogyLabel?.includes('Current emphasis: Genealogy') || !genealogyLabel?.includes('Symbols migrate between systems')) failures.push(`/journey/chapter/ch12: genealogy instrument label mismatch: ${genealogyLabel}`);
  if (!genealogyDescription?.includes('Genealogy: Two languages share roots')) failures.push(`/journey/chapter/ch12: genealogy scene description mismatch: ${genealogyDescription}`);

  const bridge = page.getByRole('button', { name: /03\s+Bridge/ });
  await bridge.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const bridgePressed = await bridge.getAttribute('aria-pressed');
  const bridgeLabel = await instrument.getAttribute('aria-label');
  const bridgeDescription = await page.locator('#scene-host-description-ch12').textContent();
  if (bridgePressed !== 'true') failures.push(`/journey/chapter/ch12: bridge button did not become pressed: ${bridgePressed}`);
  if (!bridgeLabel?.includes('Current emphasis: Bridge') || !bridgeLabel?.includes('Aion reads tradition as inner drama')) failures.push(`/journey/chapter/ch12: bridge instrument label mismatch: ${bridgeLabel}`);
  if (!bridgeDescription?.includes('Bridge: Projection turns inward')) failures.push(`/journey/chapter/ch12: bridge scene description mismatch: ${bridgeDescription}`);
}

async function checkChapterThirteenDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch13`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Gnostic constellation model/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = instrumentVisible ? await instrument.getAttribute('aria-label') : null;
  const initialDescription = await page.locator('#scene-host-description-ch13').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch13: Gnostic constellation instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Gnosis') || !initialInstrumentLabel?.includes('fullness into differentiated images')) failures.push(`/journey/chapter/ch13: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Gnosis: Knowledge descends as image')) failures.push(`/journey/chapter/ch13: initial scene description mismatch: ${initialDescription}`);

  const fourfold = page.getByRole('button', { name: /02\s+Fourfold/ });
  await fourfold.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const fourfoldPressed = await fourfold.getAttribute('aria-pressed');
  const fourfoldLabel = await instrument.getAttribute('aria-label');
  const fourfoldDescription = await page.locator('#scene-host-description-ch13').textContent();
  if (fourfoldPressed !== 'true') failures.push(`/journey/chapter/ch13: fourfold button did not become pressed: ${fourfoldPressed}`);
  if (!fourfoldLabel?.includes('Current emphasis: Fourfold') || !fourfoldLabel?.includes('Wholeness has a structural signature')) failures.push(`/journey/chapter/ch13: fourfold instrument label mismatch: ${fourfoldLabel}`);
  if (!fourfoldDescription?.includes('Fourfold: The Self appears as four')) failures.push(`/journey/chapter/ch13: fourfold scene description mismatch: ${fourfoldDescription}`);

  const paradox = page.getByRole('button', { name: /03\s+Paradox/ });
  await paradox.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const paradoxPressed = await paradox.getAttribute('aria-pressed');
  const paradoxLabel = await instrument.getAttribute('aria-label');
  const paradoxDescription = await page.locator('#scene-host-description-ch13').textContent();
  if (paradoxPressed !== 'true') failures.push(`/journey/chapter/ch13: paradox button did not become pressed: ${paradoxPressed}`);
  if (!paradoxLabel?.includes('Current emphasis: Paradox') || !paradoxLabel?.includes('The Self is approached through contradiction')) failures.push(`/journey/chapter/ch13: paradox instrument label mismatch: ${paradoxLabel}`);
  if (!paradoxDescription?.includes('Paradox: Wisdom includes rupture')) failures.push(`/journey/chapter/ch13: paradox scene description mismatch: ${paradoxDescription}`);
}

async function checkChapterFourteenDynamicAccessibility(page, failures) {
  await page.goto(`${baseUrl}/journey/chapter/ch14`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('.scene-host__mount[data-state="ready"], .scene-host__fallback').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

  const instrument = page.getByRole('img', { name: /Final synthesis mandala/ });
  const instrumentVisible = await instrument.isVisible();
  const initialInstrumentLabel = instrumentVisible ? await instrument.getAttribute('aria-label') : null;
  const initialDescription = await page.locator('#scene-host-description-ch14').textContent();

  if (!instrumentVisible) failures.push('/journey/chapter/ch14: final synthesis instrument is missing an accessible image role');
  if (!initialInstrumentLabel?.includes('Current emphasis: Synthesis') || !initialInstrumentLabel?.includes('earlier motifs gather')) failures.push(`/journey/chapter/ch14: initial instrument label mismatch: ${initialInstrumentLabel}`);
  if (!initialDescription?.includes('Synthesis: The book gathers into one field')) failures.push(`/journey/chapter/ch14: initial scene description mismatch: ${initialDescription}`);

  const axis = page.getByRole('button', { name: /02\s+Axis/ });
  await axis.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);

  const axisPressed = await axis.getAttribute('aria-pressed');
  const axisLabel = await instrument.getAttribute('aria-label');
  const axisDescription = await page.locator('#scene-host-description-ch14').textContent();
  if (axisPressed !== 'true') failures.push(`/journey/chapter/ch14: axis button did not become pressed: ${axisPressed}`);
  if (!axisLabel?.includes('Current emphasis: Axis') || !axisLabel?.includes('The goal is right relation')) failures.push(`/journey/chapter/ch14: axis instrument label mismatch: ${axisLabel}`);
  if (!axisDescription?.includes('Axis: Ego and Self stay in relation')) failures.push(`/journey/chapter/ch14: axis scene description mismatch: ${axisDescription}`);

  const individuation = page.getByRole('button', { name: /03\s+Path/ });
  await individuation.focus();
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);

  const individuationPressed = await individuation.getAttribute('aria-pressed');
  const individuationLabel = await instrument.getAttribute('aria-label');
  const individuationDescription = await page.locator('#scene-host-description-ch14').textContent();
  if (individuationPressed !== 'true') failures.push(`/journey/chapter/ch14: individuation button did not become pressed: ${individuationPressed}`);
  if (!individuationLabel?.includes('Current emphasis: Path') || !individuationLabel?.includes('Aion ends with motion')) failures.push(`/journey/chapter/ch14: path instrument label mismatch: ${individuationLabel}`);
  if (!individuationDescription?.includes('Path: Individuation keeps moving')) failures.push(`/journey/chapter/ch14: path scene description mismatch: ${individuationDescription}`);
}

async function runAccessibilitySmoke() {
  const server = startPreviewServer();
  const failures = [];
  let browser;

  try {
    await waitForServer(server);
    browser = await chromium.launch({ headless: true });

    const desktop = await browser.newPage({ viewport: desktopViewport });
    for (const route of [...canonicalRoutes, ...chapterRoutes]) {
      await checkRoute(desktop, route, failures);
    }
    await checkChaptersDynamicAccessibility(desktop, failures);
    await checkAtlasDynamicAccessibility(desktop, failures);
    await checkTimelineDynamicAccessibility(desktop, failures);
    await checkSymbolsDynamicAccessibility(desktop, failures);
    await checkAboutDynamicAccessibility(desktop, failures);
    await checkChapterOneDynamicAccessibility(desktop, failures);
    await checkPsycheArcDynamicAccessibility(desktop, failures);
    await checkChapterSixDynamicAccessibility(desktop, failures);
    await checkChapterSevenDynamicAccessibility(desktop, failures);
    await checkChapterEightDynamicAccessibility(desktop, failures);
    await checkChapterNineDynamicAccessibility(desktop, failures);
    await checkChapterTenDynamicAccessibility(desktop, failures);
    await checkChapterElevenDynamicAccessibility(desktop, failures);
    await checkChapterTwelveDynamicAccessibility(desktop, failures);
    await checkChapterThirteenDynamicAccessibility(desktop, failures);
    await checkChapterFourteenDynamicAccessibility(desktop, failures);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: mobileViewport });
    for (const route of ['/', '/chapters', '/atlas', '/timeline', '/symbols', '/about', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch5', '/journey/chapter/ch6', '/journey/chapter/ch7', '/journey/chapter/ch8', '/journey/chapter/ch9', '/journey/chapter/ch10', '/journey/chapter/ch11', '/journey/chapter/ch12', '/journey/chapter/ch13', '/journey/chapter/ch14']) {
      await checkRoute(mobile, `mobile ${route}`.replace('mobile ', ''), failures);
    }
    await mobile.close();

    if (failures.length > 0) {
      throw new Error(failures.join('\n'));
    }

    console.log('Aion app accessibility smoke passed: landmarks, accessible names, keyboard semantics, tabindex, and 24px touch targets.');
  } finally {
    if (browser) await browser.close();
    await stopPreviewServer(server);
  }
}

runAccessibilitySmoke().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
