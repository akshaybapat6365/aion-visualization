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
    await checkChapterSixDynamicAccessibility(desktop, failures);
    await checkChapterSevenDynamicAccessibility(desktop, failures);
    await checkChapterEightDynamicAccessibility(desktop, failures);
    await checkChapterNineDynamicAccessibility(desktop, failures);
    await checkChapterTenDynamicAccessibility(desktop, failures);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: mobileViewport });
    for (const route of ['/', '/chapters', '/atlas', '/journey/chapter/ch1', '/journey/chapter/ch2', '/journey/chapter/ch3', '/journey/chapter/ch4', '/journey/chapter/ch5', '/journey/chapter/ch6', '/journey/chapter/ch7', '/journey/chapter/ch8', '/journey/chapter/ch9', '/journey/chapter/ch10', '/journey/chapter/ch14']) {
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
