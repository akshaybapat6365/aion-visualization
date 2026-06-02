import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const pagesBase = normalizeBase(process.env.PAGES_BASE || '/aion-visualization');
const viteBase = pagesBase ? `${pagesBase}/` : '/';

const shellRoutes = [
  '/',
  '/chapters',
  '/atlas',
  '/timeline',
  '/symbols',
  '/about',
];

function normalizeBase(value) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (trimmed && !/^[A-Za-z0-9._~/-]+$/.test(trimmed)) {
    throw new Error(`Invalid Pages base path: ${value}`);
  }
  return trimmed ? `/${trimmed}` : '';
}

function routeSegments(route) {
  return route.split('/').filter(Boolean);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function readChapterIds() {
  const chapterDataPath = path.resolve('src/data/aion-core/chapters.json');
  const chapterData = JSON.parse(await readFile(chapterDataPath, 'utf8'));
  return chapterData.chapters.map((chapter) => chapter.id);
}

async function assertFile(filePath) {
  const result = await stat(filePath).catch(() => null);
  if (!result?.isFile()) {
    throw new Error(`Missing expected Pages artifact: ${filePath}`);
  }
}

async function copySpaRoute(route) {
  if (route === '/') return;

  const targetDir = path.join(distDir, ...routeSegments(route));
  await mkdir(targetDir, { recursive: true });
  await cp(path.join(distDir, 'index.html'), path.join(targetDir, 'index.html'));
}

function escapeScriptString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function legacyChapterRedirectHtml(targetPath) {
  const target = `${pagesBase}${targetPath}`;
  const scriptTarget = escapeScriptString(target);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>Aion Chapter Redirect</title>
  </head>
  <body>
    <script>
      (function () {
        var target = '${scriptTarget}' + window.location.search + window.location.hash;
        window.location.replace(target);
      }());
    </script>
    <p><a href="${target}">Continue to the Aion chapter experience.</a></p>
  </body>
</html>
`;
}

function legacyChapterIndexHtml() {
  const scriptBase = escapeScriptString(pagesBase);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Aion Chapter Redirect</title>
  </head>
  <body>
    <script>
      (function () {
        var params = new URLSearchParams(window.location.search);
        var rawId = params.get('id') || 'ch1';
        var match = String(rawId).match(/^(?:ch)?(\\d+)$/);
        var chapterId = match ? 'ch' + match[1] : 'ch1';
        var target = '${scriptBase}/journey/chapter/' + chapterId + window.location.hash;
        window.location.replace(target);
      }());
    </script>
    <p><a href="${pagesBase}/journey/chapter/ch1">Continue to the Aion chapter experience.</a></p>
  </body>
</html>
`;
}

async function writeLegacyRedirect({ filePath, targetPath }) {
  const targetFile = path.join(distDir, ...routeSegments(filePath));
  await mkdir(path.dirname(targetFile), { recursive: true });
  await writeFile(targetFile, legacyChapterRedirectHtml(targetPath), 'utf8');
}

async function materializePagesRoutes() {
  const chapterIds = await readChapterIds();
  const canonicalRoutes = [
    ...shellRoutes,
    ...chapterIds.map((chapterId) => `/journey/chapter/${chapterId}`),
  ];
  const legacyChapterRoutes = chapterIds.map((chapterId) => ({
    filePath: `/chapters/chapter-${chapterId.replace(/^ch/, '')}.html`,
    targetPath: `/journey/chapter/${chapterId}`,
  }));

  await assertFile(path.join(distDir, 'index.html'));

  await Promise.all(canonicalRoutes.map(copySpaRoute));
  await Promise.all(legacyChapterRoutes.map(writeLegacyRedirect));
  await mkdir(path.join(distDir, 'journey', 'chapter'), { recursive: true });
  await writeFile(path.join(distDir, 'journey', 'chapter', 'index.html'), legacyChapterIndexHtml(), 'utf8');

  for (const route of canonicalRoutes) {
    const filePath = route === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, ...routeSegments(route), 'index.html');
    await assertFile(filePath);
  }

  for (const route of legacyChapterRoutes) {
    await assertFile(path.join(distDir, ...routeSegments(route.filePath)));
  }
  await assertFile(path.join(distDir, 'journey', 'chapter', 'index.html'));

  console.log(`Materialized ${canonicalRoutes.length} canonical Pages routes, ${legacyChapterRoutes.length} legacy chapter redirects, and the legacy query redirect.`);
}

await run('npx', ['vite', 'build', '--base', viteBase], {
  env: {
    ...process.env,
    GITHUB_PAGES: 'true',
  },
});

await materializePagesRoutes();
