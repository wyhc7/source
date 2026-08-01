import type { Snippet } from '@lib';

const PRESET_SNIPPETS: Snippet[] = [
  { id: 'href', label: '@href', value: '@href' },
  { id: 'src', label: '@src', value: '@src' },
  { id: 'text', label: '@text', value: '@text' },
  { id: 'html', label: '@html', value: '@html' },
  { id: 'index-native', label: '[0:9] (原生)', value: '[0:9]' },
  { id: 'index-js', label: 'JS 切片', value: '<js>(function(result){ try{ var list = result.select(\"selector\"); return list.slice(0, 10).map(function(el){ return el@text; }); }catch(e){ return [\"\"+e]; } })(result)</js>' },
  { id: 'regex', label: '正则提取', value: '{\"regex\": \"pattern\", \"group\": 1}' },
  { id: 'replace', label: '字符串替换', value: '{\"replace\": [\"old\", \"new\"]}' },
  { id: 'trim', label: '去首尾空白', value: '{\"trim\": true}' },
  { id: 'webview-true', label: 'webView: true', value: 'webView: true' },
  { id: 'webview-false', label: 'webView: false', value: 'webView: false' }
];

const STORAGE_KEY = 'legado_custom_snippets';

export function getPresetSnippets(): Snippet[] {
  return [...PRESET_SNIPPETS];
}

export function loadCustomSnippets(): Snippet[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export function saveCustomSnippets(snippets: Snippet[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  } catch {}
}

export function addCustomSnippet(snippet: Snippet): void {
  const current = loadCustomSnippets();
  if (!current.some(s => s.id === snippet.id)) {
    saveCustomSnippets([...current, snippet]);
  }
}

export function removeCustomSnippet(id: string): void {
  const current = loadCustomSnippets();
  saveCustomSnippets(current.filter(s => s.id !== id));
}

export function updateCustomSnippet(snippet: Snippet): void {
  const current = loadCustomSnippets();
  const idx = current.findIndex(s => s.id === snippet.id);
  if (idx >= 0) {
    current[idx] = snippet;
    saveCustomSnippets(current);
  }
}