import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:3000';

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function waitForServer(url, { timeoutMs = 30_000, intervalMs = 500 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for server at ${url}`);
    }

    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) return;
    } catch {
      // ignore
    }

    await delay(intervalMs);
  }
}

async function withLocalServer(task) {
  const server = spawn('npm', ['run', 'serve'], { stdio: 'inherit' });

  try {
    await waitForServer(`${BASE_URL}/`);
    await task();
  } finally {
    server.kill('SIGTERM');
    await delay(800);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  }
}

async function main() {
  await runCommand('npm', ['run', 'perf:lighthouse']);

  await withLocalServer(async () => {
    await runCommand('npm', ['run', 'perf:runtime']);
    await runCommand('npm', ['run', 'perf:cleanup']);
    await runCommand('npm', ['run', 'perf:report']);
    await runCommand('npm', ['run', 'perf:trends']);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

