import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path, { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.AION_VISUAL_QA_PORT || 4177);
const baseUrl = `http://127.0.0.1:${port}`;
const minScore = Number(process.env.AION_VISUAL_MIN_SCORE || 0);
const runStamp = new Date().toISOString().replace(/[:.]/g, '-');
const artifactRoot = resolve(repoRoot, 'test-results/control-tower');
const artifactDir = resolve(artifactRoot, 'latest');
const viteBin = process.platform === 'win32'
  ? resolve(repoRoot, 'node_modules/.bin/vite.cmd')
  : resolve(repoRoot, 'node_modules/.bin/vite');

const chaptersJson = JSON.parse(
  await readFile(resolve(repoRoot, 'src/data/aion-core/chapters.json'), 'utf8'),
);

const supportRoutes = [
  { route: '/', label: 'Home', kind: 'orientation' },
  { route: '/chapters', label: 'Chapters', kind: 'orientation' },
  { route: '/atlas', label: 'Atlas', kind: 'map' },
  { route: '/timeline', label: 'Timeline', kind: 'support' },
  { route: '/symbols', label: 'Symbols', kind: 'support' },
  { route: '/about', label: 'About', kind: 'support' },
];

const chapterRoutes = [...chaptersJson.chapters]
  .sort((a, b) => a.order - b.order)
  .map((chapter) => ({
    route: `/journey/chapter/${chapter.id}`,
    label: `Chapter ${chapter.order}`,
    kind: 'chapter',
    expectsCanvas: true,
  }));

const routes = [...supportRoutes, ...chapterRoutes];

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'narrow', width: 320, height: 568 },
];

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
      // Server is still warming up.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for Vite preview at ${baseUrl}.\n${server.getOutput()}`);
}

function watchRouteFailures(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const notFound = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400 && !url.endsWith('/favicon.ico')) {
      notFound.push(`${response.status()} ${url}`);
    }
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!url.endsWith('/favicon.ico')) {
      failedRequests.push(`${request.failure()?.errorText || 'request failed'} ${url}`);
    }
  });

  return { consoleErrors, pageErrors, notFound, failedRequests };
}

function screenshotName(route, viewport) {
  const routeSlug = route === '/'
    ? 'home'
    : route.replace(/^\/+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/-$/g, '');
  return `${routeSlug}-${viewport.name}.png`;
}

async function countCanvasPixels(canvas) {
  return canvas.evaluate((element) => new Promise((resolveCanvas) => {
    requestAnimationFrame(() => {
      const gl = element.getContext('webgl2')
        || element.getContext('webgl')
        || element.getContext('experimental-webgl');

      if (!gl) {
        resolveCanvas(0);
        return;
      }

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const pixel = new Uint8Array(4);
      let visiblePixels = 0;
      const grid = 28;

      for (let y = 0; y < grid; y += 1) {
        for (let x = 0; x < grid; x += 1) {
          const px = Math.max(0, Math.min(width - 1, Math.round((x / (grid - 1)) * (width - 1))));
          const py = Math.max(0, Math.min(height - 1, Math.round((y / (grid - 1)) * (height - 1))));
          gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          if (pixel[3] > 0 && pixel[0] + pixel[1] + pixel[2] > 18) visiblePixels += 1;
        }
      }

      resolveCanvas(visiblePixels);
    });
  }));
}

async function getRouteMetrics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return box.width > 0
        && box.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0;
    };

    const accessibleName = (element) => {
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

    const visualSelectors = [
      'canvas',
      'svg',
      '[class*="diagram"]',
      '[class*="constellation"]',
      '[class*="orbit"]',
      '[class*="field"]',
      '[class*="sigil"]',
      '[class*="stage"]',
      '[class*="timeline"]',
      '[class*="symbol"]',
      '[class*="mandala"]',
      '[class*="map"]',
    ].join(',');

    const visuals = Array.from(document.querySelectorAll(visualSelectors)).filter(visible);
    const largeVisuals = visuals.filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width * box.height >= 25_000;
    });

    const interactive = Array.from(document.querySelectorAll(
      'a[href],button,input,select,textarea,[role="button"],[role="link"],[role="radio"],[role="tab"],[role="switch"],[role="slider"],[tabindex]',
    )).filter((element) => !element.hasAttribute('disabled') && visible(element));

    const routeInteractive = interactive.filter((element) => !element.closest('.app-nav'));
    const unnamedInteractive = interactive.filter((element) => !accessibleName(element));
    const positiveTabindex = interactive.filter((element) => Number(element.getAttribute('tabindex')) > 0);
    const smallTargets = interactive
      .filter((element) => !element.classList.contains('skip-link'))
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width < 24 || box.height < 24;
      });

    const text = document.body.innerText || '';
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const horizontalOverflow = Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth,
    );

    return {
      title: document.title,
      routeContext: document.querySelector('.app-nav__context strong')?.textContent?.trim() || '',
      hasMain: Boolean(document.querySelector('main#main-content')),
      hasGlobalNav: Boolean(document.querySelector('header[aria-label="Global navigation"]')),
      hasPrimaryNav: Boolean(document.querySelector('nav[aria-label="Primary"]')),
      hasChapterJump: Boolean(document.querySelector('#chapter-jump-select')),
      skipHref: document.querySelector('.skip-link')?.getAttribute('href') || '',
      visualCount: visuals.length,
      largeVisualCount: largeVisuals.length,
      canvasCount: Array.from(document.querySelectorAll('canvas')).filter(visible).length,
      svgCount: Array.from(document.querySelectorAll('svg')).filter(visible).length,
      interactiveCount: interactive.length,
      routeInteractiveCount: routeInteractive.length,
      unnamedInteractiveCount: unnamedInteractive.length,
      positiveTabindexCount: positiveTabindex.length,
      smallTargetCount: smallTargets.length,
      wordCount,
      horizontalOverflow,
    };
  });
}

function scoreMetric(value, notes) {
  return { value, notes };
}

function scoreRoute(metrics, technicalFailures, canvasPixels) {
  const visualAnchor = metrics.largeVisualCount >= 1 || metrics.canvasCount >= 1
    ? scoreMetric(2, 'Dominant visual surface is present.')
    : metrics.visualCount >= 3
      ? scoreMetric(1, 'Visual elements exist, but no large visual anchor was detected.')
      : scoreMetric(0, 'No meaningful first-viewport visual anchor detected.');

  const visualFirstDensity = metrics.wordCount <= 850
    ? scoreMetric(2, `Text density is controlled (${metrics.wordCount} words in page body).`)
    : metrics.wordCount <= 1_300
      ? scoreMetric(1, `Text density is moderate (${metrics.wordCount} words).`)
      : scoreMetric(0, `Text density is high (${metrics.wordCount} words).`);

  const interaction = metrics.routeInteractiveCount >= 4
    ? scoreMetric(2, `${metrics.routeInteractiveCount} route-level controls or links detected.`)
    : metrics.routeInteractiveCount >= 1
      ? scoreMetric(1, `${metrics.routeInteractiveCount} route-level control/link detected.`)
      : scoreMetric(0, 'No route-level interaction beyond global navigation detected.');

  const navigation = metrics.hasMain && metrics.hasGlobalNav && metrics.hasPrimaryNav && metrics.hasChapterJump && metrics.skipHref === '#main-content'
    ? scoreMetric(2, 'Global navigation, primary nav, chapter jump, and skip target are present.')
    : scoreMetric(0, 'One or more shell/navigation landmarks are missing.');

  const accessibility = metrics.unnamedInteractiveCount === 0
    && metrics.positiveTabindexCount === 0
    && metrics.smallTargetCount === 0
    ? scoreMetric(2, 'No unnamed controls, positive tabindex, or sub-24px targets detected.')
    : scoreMetric(0, `A11y probe found unnamed=${metrics.unnamedInteractiveCount}, positiveTabindex=${metrics.positiveTabindexCount}, smallTargets=${metrics.smallTargetCount}.`);

  const responsive = metrics.horizontalOverflow <= 2
    ? scoreMetric(2, 'No horizontal overflow detected.')
    : metrics.horizontalOverflow <= 12
      ? scoreMetric(1, `Minor horizontal overflow detected (${metrics.horizontalOverflow}px).`)
      : scoreMetric(0, `Horizontal overflow detected (${metrics.horizontalOverflow}px).`);

  const reliability = technicalFailures.length === 0 && (canvasPixels === null || canvasPixels > 8)
    ? scoreMetric(2, canvasPixels === null ? 'No console/404 blockers detected.' : `No blockers; chapter canvas sampled ${canvasPixels} visible pixels.`)
    : scoreMetric(0, 'Technical blockers detected.');

  const categories = {
    visualAnchor,
    visualFirstDensity,
    meaningfulInteraction: interaction,
    canonicalNavigation: navigation,
    accessibilityBasics: accessibility,
    responsiveStability: responsive,
    reliabilityAndSceneHealth: reliability,
  };
  const points = Object.values(categories).reduce((sum, category) => sum + category.value, 0);
  const percent = Math.round((points / (Object.keys(categories).length * 2)) * 100);

  return { categories, points, percent };
}

async function inspectRoute(browser, routeConfig, viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  const routeFailures = watchRouteFailures(page);
  const technicalFailures = [];
  let metrics = null;
  let canvasPixels = null;
  let screenshotPath = null;

  try {
    const response = await page.goto(`${baseUrl}${routeConfig.route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    if (response && response.status() >= 400) {
      technicalFailures.push(`HTTP ${response.status()}`);
    }

    await page.locator('main#main-content').waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForTimeout(routeConfig.expectsCanvas && viewport.name === 'desktop' ? 900 : 350);

    screenshotPath = resolve(artifactDir, 'screenshots', screenshotName(routeConfig.route, viewport));
    await page.screenshot({ path: screenshotPath, fullPage: false });

    metrics = await getRouteMetrics(page);

    if (!metrics.hasMain) technicalFailures.push('missing main#main-content');
    if (!metrics.hasGlobalNav) technicalFailures.push('missing global navigation');
    if (!metrics.hasPrimaryNav) technicalFailures.push('missing primary navigation');
    if (!metrics.hasChapterJump) technicalFailures.push('missing chapter jump');
    if (metrics.skipHref !== '#main-content') technicalFailures.push(`bad skip link target: ${metrics.skipHref || 'missing'}`);
    if (metrics.horizontalOverflow > 2) technicalFailures.push(`horizontal overflow (${metrics.horizontalOverflow}px)`);

    if (routeConfig.expectsCanvas && viewport.name === 'desktop') {
      const canvas = page.locator('.scene-host canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 15_000 });
      canvasPixels = await countCanvasPixels(canvas);
      if (canvasPixels <= 8) technicalFailures.push(`blank canvas (${canvasPixels} sampled visible pixels)`);
    }
  } catch (error) {
    technicalFailures.push(error instanceof Error ? error.message : String(error));
  } finally {
    technicalFailures.push(...routeFailures.notFound);
    technicalFailures.push(...routeFailures.failedRequests.map((message) => `request ${message}`));
    technicalFailures.push(...routeFailures.pageErrors.map((message) => `pageerror ${message}`));
    technicalFailures.push(...routeFailures.consoleErrors.map((message) => `console ${message}`));
    await page.close();
  }

  const score = metrics
    ? scoreRoute(metrics, technicalFailures, canvasPixels)
    : null;

  return {
    ...routeConfig,
    viewport: viewport.name,
    viewportSize: `${viewport.width}x${viewport.height}`,
    screenshotPath: screenshotPath ? path.relative(repoRoot, screenshotPath) : null,
    metrics,
    canvasPixels,
    technicalFailures,
    score,
  };
}

function formatCategories(score) {
  if (!score) return 'not scored';
  return Object.entries(score.categories)
    .map(([key, category]) => `${key}:${category.value}`)
    .join(', ');
}

function buildMarkdownReport(results) {
  const desktopResults = results.filter((result) => result.viewport === 'desktop');
  const blockers = results.filter((result) => result.technicalFailures.length > 0);
  const belowThreshold = minScore > 0
    ? desktopResults.filter((result) => (result.score?.percent || 0) < minScore)
    : [];
  const rankedRoutes = [...desktopResults].sort((a, b) => (a.score?.percent || 0) - (b.score?.percent || 0));

  const lines = [
    '# Aion Visual QA Control Tower Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Preview URL: ${baseUrl}`,
    `Evidence directory: \`${path.relative(repoRoot, artifactDir)}\``,
    `Run stamp: \`${runStamp}\``,
    '',
    '## Summary',
    '',
    `- Routes inspected: ${routes.length}`,
    `- Viewports per route: ${viewports.map((viewport) => viewport.name).join(', ')}`,
    `- Technical blockers: ${blockers.length}`,
    `- Desktop route score threshold: ${minScore > 0 ? `${minScore}%` : 'report-only'}`,
    '',
    '## Desktop Scoreboard',
    '',
    '| Route | Kind | Score | Categories | Blockers | Screenshot |',
    '|---|---:|---:|---|---|---|',
    ...desktopResults.map((result) => [
      `\`${result.route}\``,
      result.kind,
      result.score ? `${result.score.percent}%` : 'n/a',
      formatCategories(result.score),
      result.technicalFailures.length ? result.technicalFailures.join('<br>') : 'none',
      result.screenshotPath ? `\`${result.screenshotPath}\`` : 'none',
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
    '## Next-Batch Candidates',
    '',
    ...rankedRoutes.slice(0, 8).map((result, index) => (
      `${index + 1}. \`${result.route}\` - ${result.score?.percent ?? 'n/a'}% (${result.label})`
    )),
    '',
    '## Rubric',
    '',
    '- `visualAnchor`: dominant canvas, SVG, constellation, diagram, orbit, field, map, or stage.',
    '- `visualFirstDensity`: text stays concise enough for visual learning.',
    '- `meaningfulInteraction`: page has route-level controls or links beyond global navigation.',
    '- `canonicalNavigation`: shell, primary navigation, chapter jump, main landmark, and skip link exist.',
    '- `accessibilityBasics`: no unnamed controls, positive tabindex, or sub-24px touch targets in the probe.',
    '- `responsiveStability`: no horizontal overflow at the inspected viewport.',
    '- `reliabilityAndSceneHealth`: no console errors, no unexpected 404s, and nonblank chapter canvas where expected.',
    '',
    '## Mobile And Narrow Evidence',
    '',
    '| Route | Viewport | Overflow | Blockers | Screenshot |',
    '|---|---:|---:|---|---|',
    ...results.filter((result) => result.viewport !== 'desktop').map((result) => [
      `\`${result.route}\``,
      result.viewportSize,
      result.metrics ? `${result.metrics.horizontalOverflow}px` : 'n/a',
      result.technicalFailures.length ? result.technicalFailures.join('<br>') : 'none',
      result.screenshotPath ? `\`${result.screenshotPath}\`` : 'none',
    ].join(' | ')).map((row) => `| ${row} |`),
    '',
  ];

  if (belowThreshold.length > 0) {
    lines.push('## Threshold Failures', '');
    lines.push(...belowThreshold.map((result) => `- \`${result.route}\` scored ${result.score?.percent ?? 'n/a'}%.`));
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function runVisualControlTower() {
  await rm(artifactDir, { recursive: true, force: true });
  await mkdir(resolve(artifactDir, 'screenshots'), { recursive: true });

  const server = startPreviewServer();
  let browser;
  const results = [];

  try {
    await waitForServer(server);
    browser = await chromium.launch({ headless: true });

    for (const routeConfig of routes) {
      for (const viewport of viewports) {
        results.push(await inspectRoute(browser, routeConfig, viewport));
      }
    }

    const jsonPath = resolve(artifactRoot, 'summary.json');
    const markdownPath = resolve(artifactRoot, 'route-scores.md');
    await writeFile(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, results }, null, 2)}\n`);
    await writeFile(markdownPath, buildMarkdownReport(results));

    const blockers = results.filter((result) => result.technicalFailures.length > 0);
    const scoreFailures = minScore > 0
      ? results.filter((result) => result.viewport === 'desktop' && (result.score?.percent || 0) < minScore)
      : [];

    console.log(`Aion visual control tower report written to ${path.relative(repoRoot, markdownPath)}`);

    if (blockers.length || scoreFailures.length) {
      const blockerSummary = blockers.map((result) => `${result.route} ${result.viewport}: ${result.technicalFailures.join(' | ')}`);
      const scoreSummary = scoreFailures.map((result) => `${result.route}: ${result.score?.percent ?? 'n/a'}%`);
      throw new Error([...blockerSummary, ...scoreSummary].join('\n'));
    }
  } finally {
    if (browser) await browser.close();
    await stopPreviewServer(server);
  }
}

runVisualControlTower().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
