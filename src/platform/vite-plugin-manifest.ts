import type { Plugin } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { fileURLToPath } from 'url';
import { generateManifest } from './manifest-generator';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function manifestGeneratorPlugin(): Plugin {
  return {
    name: 'manifest-generator',
    apply: 'build',
    async closeBundle() {
      const target = (process.env as NodeJS.ProcessEnv)['BUILD_TARGET'] as 'chrome' | 'firefox' || 'chrome';
      if (target !== 'chrome' && target !== 'firefox') {
        return;
      }

      const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
      const manifest = generateManifest(target, pkg);
      const outDir = resolve(__dirname, `../../dist/${target}`);

      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

      const localesSrc = resolve(__dirname, '../../src/_locales');
      const localesDest = resolve(outDir, '_locales');
      if (existsSync(localesSrc)) {
        cpSync(localesSrc, localesDest, { recursive: true });
      }
    }
  };
}