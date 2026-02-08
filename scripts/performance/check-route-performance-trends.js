import fs from 'node:fs/promises';
import path from 'node:path';

const historyPath = path.resolve('tests/reports/performance-history/route-performance-history.json');
const trendPath = path.resolve('tests/reports/performance/route-performance-trends.md');

function toMap(rows) {
  return new Map(rows.map(row => [row.route, row]));
}

async function main() {
  const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
  if (history.length < 2) {
    await fs.mkdir(path.dirname(trendPath), { recursive: true });
    await fs.writeFile(trendPath, '# Route Performance Trends\n\nNot enough historical samples yet.\n');
    console.log('Trend report created (insufficient baseline).');
    return;
  }

  const previous = history[history.length - 2];
  const latest = history[history.length - 1];
  const previousByRoute = toMap(previous.rows);

  const lines = [
    '# Route Performance Trends',
    '',
    `Comparing ${latest.generatedAt} against ${previous.generatedAt}.`,
    '',
    '| Route | ΔLCP (ms) | ΔTBT (ms) | ΔCLS | ΔJS (KB) | ΔFPS | ΔMemory (MB) |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
  ];

  latest.rows.forEach(row => {
    const prior = previousByRoute.get(row.route);
    if (!prior) return;

    lines.push(`| ${row.route} | ${(row.lcpMs - prior.lcpMs).toFixed(0)} | ${(row.tbtMs - prior.tbtMs).toFixed(0)} | ${(row.cls - prior.cls).toFixed(3)} | ${(row.jsKb - prior.jsKb).toFixed(2)} | ${(row.fps - prior.fps).toFixed(2)} | ${(row.memoryMb - prior.memoryMb).toFixed(2)} |`);
  });

  await fs.mkdir(path.dirname(trendPath), { recursive: true });
  await fs.writeFile(trendPath, `${lines.join('\n')}\n`);
  console.log(`Trend report written to ${trendPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
