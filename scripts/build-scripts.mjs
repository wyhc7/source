import { build } from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = process.env.BUILD_TARGET || 'chrome';
const outDir = resolve(root, 'dist', target);

const alias = {
  '@core': resolve(root, 'src/core'),
  '@ui': resolve(root, 'src/ui'),
  '@platform': resolve(root, 'src/platform'),
  '@store': resolve(root, 'src/store/index.ts'),
  '@lib': resolve(root, 'src/types/index.ts')
};

async function bundle(entry, outfile) {
  await build({
    entryPoints: [resolve(root, entry)],
    outfile: resolve(outDir, outfile),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome110', 'firefox115'],
    minify: true,
    sourcemap: true,
    alias,
    logLevel: 'info'
  });
}

await bundle('src/background/index.ts', 'background.js');
await bundle('src/content/index.ts', 'content.js');
await bundle('src/injected/index.ts', 'injected.js');

console.log('[build-scripts] background.js / content.js / injected.js bundled as IIFE');
