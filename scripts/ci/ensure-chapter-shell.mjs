import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const violations = [];

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    violations.push(`${relativePath} (missing)`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function requireIncludes(relativePath, requiredSnippets) {
  const content = read(relativePath);
  for (const snippet of requiredSnippets) {
    if (!content.includes(snippet)) {
      violations.push(`${relativePath} (missing ${snippet})`);
    }
  }
}

for (let chapterNumber = 1; chapterNumber <= 14; chapterNumber += 1) {
  const chapterPath = `chapters/chapter-${chapterNumber}.html`;
  requireIncludes(chapterPath, [
    'data-compat-redirect="chapter-shell"',
    `var chapterId = 'ch${chapterNumber}'`,
    "sessionStorage.setItem('aion-spa-redirect', target)",
    "var target = '/journey/chapter/' + chapterId",
    "window.location.replace('../')",
  ]);
}

const appShellRedirects = new Map([
  ['chapters/index.html', '/chapters'],
  ['src/atlas/index.html', '/atlas'],
  ['src/timeline.html', '/timeline'],
  ['src/symbols.html', '/symbols'],
  ['about.html', '/about'],
  ['journey/chapter/index.html', '/journey/chapter/'],
]);

for (const [relativePath, target] of appShellRedirects) {
  requireIncludes(relativePath, [
    'data-compat-redirect="app-shell"',
    "sessionStorage.setItem('aion-spa-redirect'",
    target,
  ]);
}

requireIncludes('src/app/App.tsx', [
  '<Shell>',
  "path={routePath('chapter')}",
  'LegacyChapterRedirect',
]);

requireIncludes('src/app/routes.ts', [
  "name: 'chapter', path: '/journey/chapter/:chapterId'",
  'const legacyRedirect',
]);

const sceneRegistry = read('src/app/visualization/chapterScenes.ts');
for (let chapterNumber = 1; chapterNumber <= 14; chapterNumber += 1) {
  if (!sceneRegistry.includes(`ch${chapterNumber}:`)) {
    violations.push(`src/app/visualization/chapterScenes.ts (missing ch${chapterNumber} scene registration)`);
  }
}

if (violations.length > 0) {
  console.error('Chapter shell CI check failed. Legacy or canonical routes are inconsistent:\n' + violations.join('\n'));
  process.exit(1);
}

console.log('Chapter shell CI check passed. Legacy entrypoints route into the canonical React chapter shell.');
