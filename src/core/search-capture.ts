import type { CapturedSearchRule } from '@lib';

const KEYWORD = '我的';

function normalizeCharset(charset: string): string {
  const lower = charset.toLowerCase().replace(/["'\s]/g, '');
  if (lower.includes('utf')) return 'utf-8';
  if (lower.includes('gbk') || lower.includes('gb2312') || lower.includes('gb18030')) return 'gbk';
  if (lower.includes('big5')) return 'big5';
  return 'utf-8';
}

function decodePercentBytes(percentStr: string, charset: string): string {
  try {
    const bytes: number[] = [];
    for (let i = 0; i < percentStr.length; i++) {
      if (percentStr[i] === '%' && i + 2 < percentStr.length) {
        const hex = percentStr.slice(i + 1, i + 3);
        const val = parseInt(hex, 16);
        if (!isNaN(val)) {
          bytes.push(val);
          i += 2;
          continue;
        }
      }
      bytes.push(percentStr.charCodeAt(i));
    }
    return new TextDecoder(normalizeCharset(charset)).decode(new Uint8Array(bytes));
  } catch {
    return '';
  }
}

function containsKeywordInPercentEncoded(url: string, keyword: string): boolean {
  const lowerUrl = url.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  if (lowerUrl.includes(lowerKeyword)) return true;
  const percentPattern = /%[0-9A-Fa-f]{2}/g;
  let match;
  while ((match = percentPattern.exec(lowerUrl)) !== null) {
    const decoded = decodePercentBytes(match[0], 'utf-8').toLowerCase();
    if (decoded.includes(lowerKeyword)) return true;
  }
  return false;
}

function extractKeywordFromUrl(url: string, keyword: string): string | null {
  try {
    const parsed = new URL(url);
    for (const [, value] of parsed.searchParams) {
      if (containsKeywordInPercentEncoded(value, keyword)) {
        return value;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function parseSearchUrl(url: string, keyword: string = KEYWORD): CapturedSearchRule | null {
  try {
    const method = 'GET';
    const foundKeyword = extractKeywordFromUrl(url, keyword);
    if (!foundKeyword) return null;

    let searchUrl = url.replace(foundKeyword, '{{key}}');
    const postBody = '';
    const charset = 'utf-8';
    const headers: Record<string, string> = {};

    return { searchUrl, method, postBody, charset, headers };
  } catch {
    return null;
  }
}

function parsePostBody(body: string | null, keyword: string, method: string = 'POST', url: string = '', headers: Record<string, string> = {}): CapturedSearchRule | null {
  if (!body) return null;
  if (containsKeywordInPercentEncoded(body, keyword)) {
    const replaced = body.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '{{key}}');
    return { searchUrl: url, method: method as 'GET' | 'POST', postBody: replaced, charset: 'utf-8', headers };
  }
  return null;
}

export interface SearchCaptureCallbacks {
  onCaptured: (rule: CapturedSearchRule) => void;
  onError?: (error: Error) => void;
}

interface CaptureContext {
  method: string;
  url: string;
  body: string | null;
  headers: Record<string, string>;
}

function createXHRHook(callbacks: SearchCaptureCallbacks): () => void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const contexts = new Map<XMLHttpRequest, CaptureContext>();

  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string, async: boolean = true, username?: string | null, password?: string | null) {
    contexts.set(this, { method, url, body: null, headers: {} });
    return originalOpen.call(this, method, url, async, username, password);
  };

  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const ctx = contexts.get(this);
    if (ctx) {
      if (typeof body === 'string') {
        ctx.body = body;
      } else if (body instanceof FormData) {
        ctx.body = new URLSearchParams(body as any).toString();
      } else if (body) {
        ctx.body = JSON.stringify(body);
      } else {
        ctx.body = null;
      }
      this.addEventListener('load', () => {
        if (ctx.method && ctx.url && containsKeywordInPercentEncoded(ctx.url, KEYWORD)) {
          const rule = parseSearchUrl(ctx.url, KEYWORD) || parsePostBody(ctx.body, KEYWORD, ctx.method, ctx.url, ctx.headers);
          if (rule) {
            callbacks.onCaptured(rule);
            cleanup();
            return;
          }
        }
        if (ctx.body && containsKeywordInPercentEncoded(ctx.body, KEYWORD)) {
          const rule = parsePostBody(ctx.body, KEYWORD, ctx.method, ctx.url, ctx.headers);
          if (rule) {
            callbacks.onCaptured(rule);
            cleanup();
            return;
          }
        }
      });
    }
    return originalSend.call(this, body);
  };

  function cleanup() {
    XMLHttpRequest.prototype.open = originalOpen;
    XMLHttpRequest.prototype.send = originalSend;
    contexts.clear();
  }

  return cleanup;
}

function createFetchHook(callbacks: SearchCaptureCallbacks): () => void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = input instanceof Request ? input.url : String(input);
    const method = (init?.method || 'GET').toUpperCase();
    let body: string | null = null;
    if (init?.body) {
      if (typeof init.body === 'string') {
        body = init.body;
      } else if (init.body instanceof FormData) {
        body = new URLSearchParams(init.body as any).toString();
      } else {
        body = JSON.stringify(init.body);
      }
    }
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers);
      h.forEach((v, k) => { headers[k] = v; });
    }

    try {
      const response = await originalFetch(input, init);
      if (containsKeywordInPercentEncoded(url, KEYWORD)) {
        const rule = parseSearchUrl(url, KEYWORD) || parsePostBody(body, KEYWORD, method, url, headers);
        if (rule) {
          callbacks.onCaptured(rule);
          cleanup();
          return response;
        }
      }
      if (body && containsKeywordInPercentEncoded(body, KEYWORD)) {
        const rule = parsePostBody(body, KEYWORD, method, url, headers);
        if (rule) {
          callbacks.onCaptured(rule);
          cleanup();
          return response;
        }
      }
      return response;
    } catch (e) {
      throw e;
    }
  };

  function cleanup() {
    window.fetch = originalFetch;
  }

  return cleanup;
}

export function startCapture(tabId: number, callbacks: SearchCaptureCallbacks): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const cleanupXHR = createXHRHook(callbacks);
    const cleanupFetch = createFetchHook(callbacks);

    let cleanupClick: (() => void) | null = null;
    let cleanupSubmit: (() => void) | null = null;
    let cleanupPolling: number | null = null;
    let lastUrl = window.location.href;

    const stopCapture = () => {
      cleanupXHR();
      cleanupFetch();
      if (cleanupClick) cleanupClick();
      if (cleanupSubmit) cleanupSubmit();
      if (cleanupPolling) clearInterval(cleanupPolling);
      resolve();
    };

    cleanupClick = (() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const tag = target.tagName.toLowerCase();
        const isSearchBtn = tag === 'button' || tag === 'input' || target.closest('[role="button"]') || target.closest('a');
        if (isSearchBtn) {
          setTimeout(() => {
            const newUrl = window.location.href;
            if (newUrl !== lastUrl && containsKeywordInPercentEncoded(newUrl, KEYWORD)) {
              const rule = parseSearchUrl(newUrl, KEYWORD);
              if (rule) {
                callbacks.onCaptured(rule);
                stopCapture();
              }
            }
            lastUrl = newUrl;
          }, 100);
        }
      };
      document.addEventListener('click', handler, true);
      return () => document.removeEventListener('click', handler, true);
    })();

    cleanupSubmit = (() => {
      const handler = (e: SubmitEvent) => {
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const params = new URLSearchParams();
        formData.forEach((value, key) => {
          params.append(key, String(value));
        });
        const body = params.toString();
        if (containsKeywordInPercentEncoded(body, KEYWORD)) {
          const action = form.action || window.location.href;
          const rule = parsePostBody(body, KEYWORD, (form.method || 'GET').toUpperCase(), action, {});
          if (rule) {
            callbacks.onCaptured(rule);
            stopCapture();
          }
        }
      };
      document.addEventListener('submit', handler, true);
      return () => document.removeEventListener('submit', handler, true);
    })();

    cleanupPolling = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl && containsKeywordInPercentEncoded(currentUrl, KEYWORD)) {
        const rule = parseSearchUrl(currentUrl, KEYWORD);
        if (rule) {
          callbacks.onCaptured(rule);
          stopCapture();
        }
      }
      lastUrl = currentUrl;
    }, 500);

    (window as any).__LEGADO_STOP_CAPTURE__ = stopCapture;
  });
}

export function stopCapture(_tabId: number): void {
  if (typeof window !== 'undefined' && (window as any).__LEGADO_STOP_CAPTURE__) {
    (window as any).__LEGADO_STOP_CAPTURE__();
    delete (window as any).__LEGADO_STOP_CAPTURE__;
  }
}

export { parseSearchUrl, extractKeywordFromUrl, normalizeCharset, decodePercentBytes, containsKeywordInPercentEncoded, type CapturedSearchRule };