import fs from 'node:fs/promises';
import path from 'node:path';
import budgets from './performance-budgets.json' with { type: 'json' };

const lighthouseDir = path.resolve('tests/reports/lighthouse/current');
const runtimePath = path.resolve('tests/reports/performance/runtime-metrics.json');
const summaryPath = path.resolve('tests/reports/performance/route-performance-summary.json');
const markdownPath = path.resolve('tests/reports/performance/route-performance-summary.md');
const historyPath = path.resolve('tests/reports/performance-history/route-performance-history.json');

function routeFromUrl(url) {
  const parsed = new URL(url);
  return parsed.pathname || '/';
}

async function readLighthouseReports() {
  const files = await fs.readdir(lighthouseDir);
  const reportFiles = files.filter(file => file.endsWith('.report.json'));

  const reports = [];
  for (const file of reportFiles) {
    const report = JSON.parse(await fs.readFile(path.join(lighthouseDir, file), 'utf8'));
    reports.push(report);
  }
  return reports;
}

function extractJsKb(lhr) {
  const items = lhr.audits['resource-summary']?.details?.items || [];
  const script = items.find(item => item.resourceType === 'script');
  return script ? Number((script.transferSize / 1024).toFixed(2)) : 0;
}

async function main() {
  const [lighthouseReports, runtimeData] = await Promise.all([
    readLighthouseReports(),
    fs.readFile(runtimePath, 'utf8').then(JSON.parse)
  ]);

  const runtimeByRoute = new Map(runtimeData.routes.map(entry => [entry.route, entry]));
  const reportByRoute = new Map();

  for (const lhr of lighthouseReports) {
    const route = routeFromUrl(lhr.finalDisplayedUrl || lhr.requestedUrl);
    reportByRoute.set(route, lhr);
  }

  const rows = budgets.routes.map(route => {
    const lhr = reportByRoute.get(route);
    const runtime = runtimeByRoute.get(route);

    if (!lhr) {
      throw new Error(`Missing lighthouse report for ${route}`);
    }
    if (!runtime) {
      throw new Error(`Missing runtime metrics for ${route}`);
    }

    return {
      route,
      lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
      tbtMs: lhr.audits['total-blocking-time'].numericValue,
      cls: lhr.audits['cumulative-layout-shift'].numericValue,
      jsKb: extractJsKb(lhr),
      fps: runtime.fps,
      memoryMb: runtime.memoryMb
    };
  });

  const failures = [];
  for (const row of rows) {
    if (row.lcpMs > budgets.webVitals.lcpMs) failures.push(`${row.route} LCP ${row.lcpMs} > ${budgets.webVitals.lcpMs}`);
    if (row.tbtMs > budgets.webVitals.tbtMs) failures.push(`${row.route} TBT ${row.tbtMs} > ${budgets.webVitals.tbtMs}`);
    if (row.cls > budgets.webVitals.cls) failures.push(`${row.route} CLS ${row.cls} > ${budgets.webVitals.cls}`);
    if (row.jsKb > budgets.payload.jsKb) failures.push(`${row.route} JS ${row.jsKb}KB > ${budgets.payload.jsKb}KB`);
    if (row.fps < budgets.runtime.minFps) failures.push(`${row.route} FPS ${row.fps} < ${budgets.runtime.minFps}`);
    if (row.memoryMb > budgets.runtime.maxMemoryMb) failures.push(`${row.route} memory ${row.memoryMb}MB > ${budgets.runtime.maxMemoryMb}MB`);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    budgets,
    rows,
    passed: failures.length === 0,
    failures
  };

  await fs.mkdir(path.dirname(summaryPath), { recursive: true });
  await fs.mkdir(path.dirname(historyPath), { recursive: true });
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  const markdownLines = [
    '# Route Performance Summary',
    '',
    '| Route | LCP (ms) | TBT (ms) | CLS | JS (KB) | FPS | Memory (MB) |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(row => `| ${row.route} | ${row.lcpMs.toFixed(0)} | ${row.tbtMs.toFixed(0)} | ${row.cls.toFixed(3)} | ${row.jsKb.toFixed(2)} | ${row.fps.toFixed(2)} | ${row.memoryMb.toFixed(2)} |`),
    '',
    summary.passed ? '✅ All route budgets passed.' : `❌ Budget failures:\n${failures.map(item => `- ${item}`).join('\n')}`
  ];

  await fs.writeFile(markdownPath, `${markdownLines.join('\n')}\n`);

  let history = [];
  try {
    history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
  } catch {
    history = [];
  }

  history.push({ generatedAt: summary.generatedAt, rows });
  await fs.writeFile(historyPath, JSON.stringify(history.slice(-60), null, 2));

  if (!summary.passed) {
    throw new Error(`Performance budget regression:\n${failures.join('\n')}`);
  }

  console.log(`Performance summary written to ${summaryPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
