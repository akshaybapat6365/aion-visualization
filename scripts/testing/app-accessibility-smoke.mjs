import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

import { chromium } from 'playwright';

const port = Number(process.env.AION_A11Y_PORT || 4175);
const baseUrl = `http://127.0.0.1:${port}`;
const canonicalRoutes = ['/', '/chapters', '/atlas', '/timeline', '/symbols', '/about'];
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
    await checkAtlasDynamicAccessibility(desktop, failures);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: mobileViewport });
    for (const route of ['/', '/chapters', '/atlas', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch6', '/journey/chapter/ch14']) {
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
