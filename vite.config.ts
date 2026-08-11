import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, copyFileSync } from 'fs';
import { basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function manifestGeneratorPlugin() {
  return {
    name: 'manifest-generator',
    apply: 'build' as const,
    async closeBundle() {
      const target = (process.env as NodeJS.ProcessEnv)['BUILD_TARGET'] || 'chrome';
      const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
      const version = pkg.version;

      const manifestV3 = {
        manifest_version: 3,
        name: 'Legado Source Generator',
        short_name: 'Legado Source Gen',
        version,
        description: '为 Legado 阅读 APP 生成书源规则的浏览器扩展',
        default_locale: 'zh_CN',
        icons: {
          16: 'icons/icon-16.svg',
          32: 'icons/icon-32.svg',
          48: 'icons/icon-48.svg',
          128: 'icons/icon-128.svg'
        },
        permissions: ['storage', 'scripting', 'activeTab', 'sidePanel', 'downloads'],
        host_permissions: ['http://*/*', 'https://*/*'],
        background: {
          service_worker: 'background.js'
        },
        side_panel: {
          default_path: 'sidepanel.html'
        },
        action: {
          default_popup: 'popup.html',
          default_title: 'Legado Source Generator'
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content.js'],
            run_at: 'document_idle',
            all_frames: false
          }
        ],
        web_accessible_resources: [
          {
            resources: ['injected.js'],
            matches: ['<all_urls>']
          }
        ]
      };

      const manifestV2 = {
        manifest_version: 2,
        name: 'Legado Source Generator',
        short_name: 'Legado Source Gen',
        version,
        description: '为 Legado 阅读 APP 生成书源规则的浏览器扩展',
        default_locale: 'zh_CN',
        icons: {
          16: 'icons/icon-16.svg',
          32: 'icons/icon-32.svg',
          48: 'icons/icon-48.svg',
          128: 'icons/icon-128.svg'
        },
        permissions: ['storage', 'activeTab', 'tabs', 'sidebarAction', 'downloads'],
        optional_permissions: ['http://*/*', 'https://*/*'],
        background: {
          scripts: ['background.js'],
          persistent: false
        },
        sidebar_action: {
          default_panel: 'sidepanel.html',
          default_title: 'Legado Source Generator',
          default_icon: {
            16: 'icons/icon-16.svg',
            32: 'icons/icon-32.svg',
            48: 'icons/icon-48.svg'
          }
        },
        browser_action: {
          default_popup: 'popup.html',
          default_title: 'Legado Source Generator',
          default_icon: {
            16: 'icons/icon-16.svg',
            32: 'icons/icon-32.svg',
            48: 'icons/icon-48.svg'
          }
        },
        content_scripts: [
          {
            matches: ['<all_urls>'],
            js: ['content.js'],
            run_at: 'document_idle',
            all_frames: false
          }
        ],
        web_accessible_resources: ['injected.js']
      };

      const manifest = target === 'firefox' ? manifestV2 : manifestV3;
      const outDir = resolve(__dirname, `dist/${target}`);

      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

      const localesSrc = resolve(__dirname, 'src/_locales');
      const localesDest = resolve(outDir, '_locales');
      if (existsSync(localesSrc)) {
        cpSync(localesSrc, localesDest, { recursive: true });
      }

      // Copy HTML files
      copyFileSync(resolve(__dirname, 'src/popup.html'), resolve(outDir, 'popup.html'));
      copyFileSync(resolve(__dirname, 'src/sidepanel.html'), resolve(outDir, 'sidepanel.html'));
    }
  };
}

function copyHtmlPlugin() {
  return {
    name: 'copy-html',
    apply: 'build' as const,
    closeBundle() {
      const target = (process.env as NodeJS.ProcessEnv)['BUILD_TARGET'] || 'chrome';
      const outDir = resolve(__dirname, `dist/${target}`);

      const htmlEntries: Record<string, string> = {
        'src/popup.html': 'popup.js',
        'src/sidepanel.html': 'sidepanel.js'
      };

      for (const [src, entry] of Object.entries(htmlEntries)) {
        const srcPath = resolve(__dirname, src);
        const destPath = resolve(outDir, basename(srcPath));
        if (!existsSync(srcPath)) continue;

        let html = readFileSync(srcPath, 'utf-8');
        html = html.replace(
          /<script[^>]*src="[^"]*"[^>]*><\/script>/,
          `<script type="module" src="./${entry}"></script>`
        );
        html = html.replace(
          /<\/head>/,
          '<link rel="stylesheet" href="./styles.css">\n</head>'
        );
        writeFileSync(destPath, html);
      }

      // Copy icon SVGs
      const iconsSrc = resolve(__dirname, 'src/icons');
      const iconsDest = resolve(outDir, 'icons');
      if (existsSync(iconsSrc)) {
        mkdirSync(iconsDest, { recursive: true });
        cpSync(iconsSrc, iconsDest, { recursive: true });
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const target = (process.env as NodeJS.ProcessEnv)['BUILD_TARGET'] || 'chrome';
  const outDir = `dist/${target}`;

  return {
    plugins: [react(), manifestGeneratorPlugin(), copyHtmlPlugin()],
    resolve: {
      alias: {
        '@core': resolve(__dirname, 'src/core'),
        '@ui': resolve(__dirname, 'src/ui'),
        '@platform': resolve(__dirname, 'src/platform'),
        '@store': resolve(__dirname, 'src/store/index.ts'),
        '@lib': resolve(__dirname, 'src/types/index.ts')
      }
    },
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: true,
      minify: 'esbuild',
      cssCodeSplit: false,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/main.tsx'),
          sidepanel: resolve(__dirname, 'src/sidepanel/main.tsx'),
          background: resolve(__dirname, 'src/background/index.ts'),
          content: resolve(__dirname, 'src/content/index.ts'),
          injected: resolve(__dirname, 'src/injected/index.ts')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'styles.css';
            if (assetInfo.name?.match(/\.(png|jpg|svg|gif)$/)) return 'icons/[name][extname]';
            return '[name][extname]';
          },
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-zustand': ['zustand'],
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
          }
        }
      }
    },
    server: {
      port: 3000,
      hmr: { port: 3001 }
    }
  };
});