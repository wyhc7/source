import type { BookSource, CategoryNode, SearchRule, FieldRule } from '@lib';

const FIELD_SEP = '##';

function parseSearchRule(obj: any): SearchRule {
  return {
    searchUrl: obj.searchUrl || '',
    method: obj.method || 'GET',
    postBody: obj.postBody,
    charset: obj.charset,
    header: obj.header
  };
}

function parseFieldRules(arr: any[]): FieldRule[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => ({
    name: item.name || '',
    rule: item.rule || '',
    webView: !!item.webView
  }));
}

function parseCategoryTree(categoryStr: string): CategoryNode {
  const root: CategoryNode = { name: '', children: new Map() };
  if (!categoryStr) return root;
  const parts = categoryStr.split('/').filter(p => p.trim());
  let current = root;
  for (const part of parts) {
    const trimmed = part.trim();
    if (!current.children.has(trimmed)) {
      current.children.set(trimmed, { name: trimmed, children: new Map() });
    }
    current = current.children.get(trimmed)!;
  }
  return root;
}

function flattenCategoryTree(node: CategoryNode, prefix = ''): string[] {
  const results: string[] = [];
  for (const [name, child] of node.children) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (child.children.size === 0) {
      results.push(path);
    } else {
      results.push(...flattenCategoryTree(child, path));
    }
  }
  return results;
}

export function importBookSource(json: string): BookSource {
  const obj = JSON.parse(json);
  return {
    bookSourceName: obj.bookSourceName || '',
    bookSourceUrl: obj.bookSourceUrl || '',
    bookSourceType: obj.bookSourceType || 0,
    bookSourceGroup: obj.bookSourceGroup || '',
    category: obj.category || '',
    ruleSearch: parseSearchRule(obj.ruleSearch || {}),
    ruleBookInfo: parseFieldRules(obj.ruleBookInfo),
    ruleToc: parseFieldRules(obj.ruleToc),
    ruleContent: parseFieldRules(obj.ruleContent),
    ruleExplore: obj.ruleExplore || '',
    login: {
      url: obj.login?.url || '',
      username: obj.login?.username || '',
      password: obj.login?.password || '',
      cookies: obj.login?.cookies
    },
    header: obj.header || '',
    weight: obj.weight || 0,
    lastUpdateTime: obj.lastUpdateTime || Date.now(),
    sourceRemark: obj.sourceRemark || ''
  };
}

function serializeSearchRule(rule: SearchRule): string {
  const parts = [
    `searchUrl${FIELD_SEP}${rule.searchUrl}`,
    `method${FIELD_SEP}${rule.method}`
  ];
  if (rule.postBody) parts.push(`postBody${FIELD_SEP}${rule.postBody}`);
  if (rule.charset) parts.push(`charset${FIELD_SEP}${rule.charset}`);
  if (rule.header) parts.push(`header${FIELD_SEP}${rule.header}`);
  return parts.join('\n');
}

function serializeFieldRules(rules: FieldRule[]): string {
  return rules.map(r => {
    const parts = [`name${FIELD_SEP}${r.name}`, `rule${FIELD_SEP}${r.rule}`];
    if (r.webView) parts.push(`webView${FIELD_SEP}true`);
    return parts.join('\n');
  }).join('\n---\n');
}

export function exportBookSource(source: BookSource): string {
  const obj = {
    bookSourceName: source.bookSourceName,
    bookSourceUrl: source.bookSourceUrl,
    bookSourceType: source.bookSourceType,
    bookSourceGroup: source.bookSourceGroup,
    category: source.category,
    ruleSearch: serializeSearchRule(source.ruleSearch),
    ruleBookInfo: serializeFieldRules(source.ruleBookInfo),
    ruleToc: serializeFieldRules(source.ruleToc),
    ruleContent: serializeFieldRules(source.ruleContent),
    ruleExplore: source.ruleExplore,
    login: source.login,
    header: source.header,
    weight: source.weight,
    lastUpdateTime: source.lastUpdateTime,
    sourceRemark: source.sourceRemark
  };
  return JSON.stringify(obj, null, 2);
}

export { parseCategoryTree, flattenCategoryTree };