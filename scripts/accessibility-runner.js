#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'tests', 'reports', 'accessibility');
const JSON_REPORT = path.join(REPORT_DIR, 'accessibility-report.json');
const CHECKLIST_REPORT = path.join(REPORT_DIR, 'release-accessibility-checklist.md');

const CORE_ROUTES = [
  '/src/index.html',
  '/chapters/index.html',
  '/src/timeline.html',
  '/src/symbols.html',
  '/src/about.html'
];

const VISUALIZATION_ROUTES = [
  '/src/visualizations/clock/aion-clock-demo.html',
  '/src/visualizations/alchemy/alchemy-lab-demo.html',
  '/src/visualizations/cosmology/gnostic-map-demo.html'
];

function getContrastRatio(fg, bg) {
  const toLinear = (value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const luminance = ([r, g, b]) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function startServer() {
  const server = spawn('python3', ['-m', 'http.server', '4173'], { cwd: ROOT, stdio: 'pipe' });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return server;
}

async function checkCoreRoute(page, route) {
  await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(200);

  const report = await page.evaluate(() => {
    const requiredLandmarks = ['main', 'nav'];
    const landmarkSummary = {
      main: document.querySelectorAll('main, [role="main"]').length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      header: document.querySelectorAll('header, [role="banner"]').length,
      footer: document.querySelectorAll('footer, [role="contentinfo"]').length
    };

    const interactive = Array.from(document.querySelectorAll('a,button,input,select,textarea,[tabindex],[role="button"],[role="link"],[role="tab"],[role="switch"],[role="slider"]'));
    const unnamedInteractive = interactive
      .filter((el) => !el.hasAttribute('disabled'))
      .filter((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        const labelledBy = el.getAttribute('aria-labelledby');
        const title = el.getAttribute('title');
        const text = el.textContent?.trim();
        const alt = el.getAttribute('alt');
        const inputLabel = el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() : '';
        return !(ariaLabel || labelledBy || title || text || alt || inputLabel);
      })
      .map((el) => el.outerHTML.slice(0, 120));

    const focusable = Array.from(document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'));
    const focusWithoutIndicator = focusable
      .filter((el) => !el.hasAttribute('disabled'))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const outlineHidden = style.outlineStyle === 'none' || parseFloat(style.outlineWidth) === 0;
        const hasFocusRingShadow = style.boxShadow && style.boxShadow !== 'none';
        return outlineHidden && !hasFocusRingShadow;
      })
      .map((el) => el.outerHTML.slice(0, 120));

    const nonKeyboardInteractive = Array.from(document.querySelectorAll('[onclick], [role="button"], [role="tab"], [role="switch"], [role="slider"]'))
      .filter((el) => {
        const nativeFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
        const hasTabindex = el.hasAttribute('tabindex');
        return !nativeFocusable && !hasTabindex;
      })
      .map((el) => el.outerHTML.slice(0, 120));

    const missingRequired = requiredLandmarks.filter((name) => !landmarkSummary[name]);

    return {
      title: document.title,
      landmarkSummary,
      missingRequired,
      unnamedInteractive,
      focusWithoutIndicator,
      nonKeyboardInteractive
    };
  });

  const contrastSamples = await page.$$eval('p,li,a,button,h1,h2,h3,span', (nodes) => {
    const parseRgba = (color) => {
      if (!color || color === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
      const matched = color.match(/\d+(\.\d+)?/g);
      if (!matched || matched.length < 3) return { r: 0, g: 0, b: 0, a: 0 };
      const [r, g, b] = matched.slice(0, 3).map((v) => Number(v));
      const a = matched.length >= 4 ? Number(matched[3]) : 1;
      return { r, g, b, a: Number.isFinite(a) ? a : 1 };
    };

    const blend = (fg, bg) => {
      // Porter-Duff "over": fg over bg
      const outA = fg.a + bg.a * (1 - fg.a);
      if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 };
      const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / outA;
      const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / outA;
      const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / outA;
      return { r, g, b, a: outA };
    };

    const getRootBackground = () => {
      const bodyBg = parseRgba(window.getComputedStyle(document.body).backgroundColor);
      if (bodyBg.a > 0) return bodyBg;
      const htmlBg = parseRgba(window.getComputedStyle(document.documentElement).backgroundColor);
      if (htmlBg.a > 0) return htmlBg;
      return { r: 255, g: 255, b: 255, a: 1 };
    };

    const rootBg = getRootBackground();

    const getEffectiveBackground = (node) => {
      const stack = [];
      let current = node;
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        const bg = parseRgba(window.getComputedStyle(current).backgroundColor);
        if (bg.a > 0) stack.push(bg);
        current = current.parentElement;
      }

      let composite = rootBg;
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        composite = blend(stack[i], composite);
      }

      // Ensure we return an opaque background for contrast math.
      if (composite.a < 1) composite = blend({ r: 255, g: 255, b: 255, a: 1 }, composite);
      return composite;
    };

    return nodes.slice(0, 80).map((node) => {
      const rawText = (node.textContent || '').trim();
      if (!rawText) return null;

      const style = window.getComputedStyle(node);
      const fontSize = parseFloat(style.fontSize) || 16;
      const fontWeight = Number(style.fontWeight) || 400;

      const bg = getEffectiveBackground(node);
      const fg = parseRgba(style.color);
      const effectiveFg = fg.a < 1 ? blend(fg, bg) : fg;

      return {
        text: rawText.slice(0, 80),
        color: [Math.round(effectiveFg.r), Math.round(effectiveFg.g), Math.round(effectiveFg.b)],
        background: [Math.round(bg.r), Math.round(bg.g), Math.round(bg.b)],
        fontSize,
        fontWeight
      };
    }).filter(Boolean);
  });

  const contrastFailures = contrastSamples
    .map((sample) => {
      const ratio = getContrastRatio(sample.color, sample.background);
      const isLarge = sample.fontSize >= 24 || (sample.fontSize >= 18.66 && sample.fontWeight >= 700);
      const threshold = isLarge ? 3 : 4.5;
      return { ...sample, ratio, threshold };
    })
    .filter((sample) => sample.ratio < sample.threshold)
    .slice(0, 8);

  return { route, ...report, contrastFailures };
}

async function checkVisualizationRoute(page, route) {
  await page.goto(`http://127.0.0.1:4173${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll('button,input,select,textarea,[role="button"],[role="slider"],[role="tab"],[aria-controls]'));
    const nonFocusableControls = controls
      .filter((el) => !el.hasAttribute('disabled'))
      .filter((el) => {
        const isNative = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
        const hasTabIndex = el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
        const anchorFocusable = el.tagName === 'A' && el.hasAttribute('href');
        return !(isNative || hasTabIndex || anchorFocusable);
      })
      .map((el) => el.outerHTML.slice(0, 120));

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasKeyboardInstruction = /keyboard|tab|arrow|enter|space/i.test(document.body.innerText || '');

    return {
      controlCount: controls.length,
      nonFocusableControls,
      reducedMotionQuery,
      hasKeyboardInstruction
    };
  });

  return { route, ...result };
}

function generateChecklist(summary) {
  const lines = [
    '# Release Accessibility Checklist',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Automated Core Route Checks',
    ''
  ];

  for (const route of summary.coreRoutes) {
    const landmarkStatus = route.missingRequired.length === 0 ? '✅' : '⚠️';
    const ariaStatus = route.unnamedInteractive.length === 0 ? '✅' : '❌';
    const keyboardStatus = route.nonKeyboardInteractive.length === 0 ? '✅' : '❌';
    const focusStatus = route.focusWithoutIndicator.length === 0 ? '✅' : '⚠️';
    const contrastStatus = route.contrastFailures.length === 0 ? '✅' : '❌';

    lines.push(`### ${route.route}`);
    lines.push(`- ${landmarkStatus} Landmark completeness (main/nav required)`);
    lines.push(`- ${ariaStatus} ARIA/accessibility naming completeness`);
    lines.push(`- ${keyboardStatus} Keyboard operability of interactive controls`);
    lines.push(`- ${focusStatus} Focus visibility coverage`);
    lines.push(`- ${contrastStatus} Contrast threshold checks`);
    lines.push('');
  }

  lines.push('## Visualization Control Checks (No Pointer / Reduced Motion)');
  lines.push('');

  for (const viz of summary.visualizations) {
    const operable = viz.nonFocusableControls.length === 0 ? '✅' : '❌';
    const guidance = viz.hasKeyboardInstruction ? '✅' : '⚠️';
    lines.push(`### ${viz.route}`);
    lines.push(`- ${operable} Controls keyboard-operable without pointer`);
    lines.push(`- ${guidance} Keyboard instruction text present`);
    lines.push('');
  }

  lines.push('## Manual Audit Protocol');
  lines.push('- See `docs/accessibility-screen-reader-audit-protocol.md` for required release walkthrough steps.');
  lines.push('');

  lines.push('## Critical Gate Result');
  lines.push(summary.criticalIssues.length === 0
    ? '- ✅ PASS: no critical accessibility issues detected.'
    : `- ❌ FAIL: ${summary.criticalIssues.length} critical issue(s) detected.`);

  return lines.join('\n');
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    coreRoutes: [],
    visualizations: [],
    criticalIssues: []
  };

  try {
    for (const route of CORE_ROUTES) {
      const page = await browser.newPage();
      const report = await checkCoreRoute(page, route);
      await page.close();
      summary.coreRoutes.push(report);

      if (report.unnamedInteractive.length > 0) {
        summary.criticalIssues.push({ route, type: 'aria-name', count: report.unnamedInteractive.length });
      }
      if (report.nonKeyboardInteractive.length > 0) {
        summary.criticalIssues.push({ route, type: 'keyboard-operability', count: report.nonKeyboardInteractive.length });
      }
      if (report.contrastFailures.length > 0) {
        summary.criticalIssues.push({ route, type: 'contrast', count: report.contrastFailures.length });
      }
    }

    for (const route of VISUALIZATION_ROUTES) {
      const page = await browser.newPage();
      const report = await checkVisualizationRoute(page, route);
      await page.close();
      summary.visualizations.push(report);

      if (report.nonFocusableControls.length > 0) {
        summary.criticalIssues.push({ route, type: 'viz-keyboard-controls', count: report.nonFocusableControls.length });
      }
    }

    await fs.writeFile(JSON_REPORT, JSON.stringify(summary, null, 2));
    await fs.writeFile(CHECKLIST_REPORT, generateChecklist(summary));

    console.log(`Accessibility JSON report: ${JSON_REPORT}`);
    console.log(`Accessibility release checklist: ${CHECKLIST_REPORT}`);

    if (summary.criticalIssues.length > 0) {
      console.error('Critical accessibility issues detected:', summary.criticalIssues);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
