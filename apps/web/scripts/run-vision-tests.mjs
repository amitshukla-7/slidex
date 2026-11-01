import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';

const isWin = process.platform === 'win32';
const esbuildBin = isWin ? 'node_modules/.bin/esbuild.cmd' : 'node_modules/.bin/esbuild';
const esbuildPath = resolve(process.cwd(), esbuildBin);

try {
  execSync(`"${esbuildPath}" apps/web/src/vision/__tests__/runTests.ts --bundle --platform=node --outfile=.test_runner.cjs`, { stdio: 'inherit', shell: true });
  execSync('node .test_runner.cjs', { stdio: 'inherit', shell: true });
} finally {
  try {
    if (existsSync('.test_runner.cjs')) unlinkSync('.test_runner.cjs');
  } catch {}
}
