declare const chrome: any;
declare const browser: any;

export const isFirefox = typeof browser !== 'undefined' && !!browser.runtime?.getBrowserInfo;
export const isMV3 = typeof chrome !== 'undefined' && !!chrome.sidePanel;

function getGlobalBrowser(): any {
  if (typeof chrome !== 'undefined') return chrome;
  if (typeof browser !== 'undefined') return browser;
  return {};
}

export const browserAPI = getGlobalBrowser();

export function getBrowserAPI(): typeof chrome {
  return browserAPI as typeof chrome;
}

export async function getExtensionId(): Promise<string> {
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    return chrome.runtime.id;
  }
  if (typeof browser !== 'undefined' && browser.runtime?.id) {
    return browser.runtime.id;
  }
  return 'unknown';
}

export function isManifestV3(): boolean {
  return isMV3;
}

export function getStorageAPI(): any {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return chrome.storage.local;
  }
  if (typeof browser !== 'undefined' && browser.storage?.local) {
    return browser.storage.local;
  }
  throw new Error('Storage API not available');
}

export function getRuntimeAPI(): any {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime;
  }
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser.runtime;
  }
  throw new Error('Runtime API not available');
}

export function getTabsAPI(): any {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    return chrome.tabs;
  }
  if (typeof browser !== 'undefined' && browser.tabs) {
    return browser.tabs;
  }
  throw new Error('Tabs API not available');
}

export function getScriptingAPI(): any {
  if (typeof chrome !== 'undefined' && chrome.scripting) {
    return chrome.scripting;
  }
  return null;
}

export function getSidePanelAPI(): any {
  if (typeof chrome !== 'undefined' && chrome.sidePanel) {
    return chrome.sidePanel;
  }
  return null;
}

export function getI18nAPI(): any {
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    return chrome.i18n;
  }
  if (typeof browser !== 'undefined' && browser.i18n) {
    return browser.i18n;
  }
  return {
    getMessage: (key: string) => key,
    getUILanguage: () => 'en-US'
  };
}