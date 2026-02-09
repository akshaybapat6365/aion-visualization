import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const chapterDirs = ['chapters', 'chapters/standard', 'chapters/enhanced'];

function getChapterFiles(dir) {
  return fs.readdirSync(path.join(repoRoot, dir))
    .filter((name) => /^chapter-\d+\.html$/.test(name))
    .map((name) => path.join(repoRoot, dir, name));
}

const violations = [];

for (const dir of chapterDirs) {
  const files = getChapterFiles(dir);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('data-compat-redirect="chapter-shell"') || !content.includes('/journey/chapter/')) {
      violations.push(path.relative(repoRoot, file));
    }
  }
}

const routeShell = fs.readFileSync(path.join(repoRoot, 'journey/chapter/index.html'), 'utf8');
if (!routeShell.includes('ChapterRenderer.js')) {
  violations.push('journey/chapter/index.html (must render through ChapterRenderer)');
}

if (violations.length > 0) {
  console.error('Chapter shell CI check failed. Files bypassing ChapterShell:\n' + violations.join('\n'));
  process.exit(1);
}

console.log('Chapter shell CI check passed. All chapter entrypoints route through ChapterShell.');
