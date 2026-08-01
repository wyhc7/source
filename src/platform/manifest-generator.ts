import type { PackageJson } from 'pkg-types';

export interface ManifestV2 {
  manifest_version: 2;
  name: string;
  version: string;
  description: string;
  default_locale: string;
  icons: Record<string, string>;
  permissions: string[];
  optional_permissions: string[];
  background: { scripts: string[]; persistent: boolean };
  sidebar_action: {
    default_panel: string;
    default_title: string;
    default_icon: Record<string, string>;
  };
  browser_action: {
    default_popup: string;
    default_title: string;
    default_icon: Record<string, string>;
  };
  content_scripts: Array<{
    matches: string[];
    js: string[];
    run_at: string;
    all_frames: boolean;
  }>;
  web_accessible_resources: string[];
}

export interface ManifestV3 {
  manifest_version: 3;
  name: string;
  short_name: string;
  version: string;
  description: string;
  default_locale: string;
  icons: Record<string, string>;
  permissions: string[];
  host_permissions: string[];
  background: { service_worker: string; type: 'module' };
  side_panel: { default_path: string };
  action: { default_popup: string; default_title: string };
  content_scripts: Array<{
    matches: string[];
    js: string[];
    run_at: string;
    all_frames: boolean;
  }>;
  web_accessible_resources: Array<{ resources: string[]; matches: string[] }>;
}

export type ManifestTarget = 'chrome' | 'firefox';

export function generateManifest(target: ManifestTarget, pkg: PackageJson): ManifestV2 | ManifestV3 {
  const version = pkg.version || '1.0.0';

  const common = {
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
    }
  };

  if (target === 'firefox') {
    const manifest: ManifestV2 = {
      manifest_version: 2,
      ...common,
      permissions: ['storage', 'activeTab', 'tabs', 'sidebarAction'],
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
    return manifest;
  }

  const manifest: ManifestV3 = {
    manifest_version: 3,
    ...common,
    permissions: ['storage', 'scripting', 'activeTab', 'sidePanel'],
    host_permissions: ['http://*/*', 'https://*/*'],
    background: {
      service_worker: 'background.js',
      type: 'module'
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
  return manifest;
}

export function writeManifest(target: ManifestTarget, pkg: PackageJson, outDir: string): void {
  const manifest = generateManifest(target, pkg);
  const fs = require('fs');
  const path = require('path');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}