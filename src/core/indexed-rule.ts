import type { IndexConfig, IndexedRuleOptions } from '@lib';

const LINK_FIELDS = ['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'];

export function parseSingleIndex(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed)) return null;
  return parsed > 0 ? parsed - 1 : parsed;
}

export function buildJsArrayIndexExpr(index: number, sizeExpr: string): string {
  return index < 0 ? `${sizeExpr} + (${index})` : String(index);
}

export function buildAtSelector(sel: string, key: string, tag: string, listItemTag?: string): string {
  if (LINK_FIELDS.includes(key)) {
    if (listItemTag === 'a') return 'a@href';
    return tag === 'a' ? `${sel}@href` : `${sel} a@href`;
  } else if (key === 'coverUrl') {
    return tag === 'img' ? `${sel}@src` : `${sel} img@src`;
  } else {
    return `${sel}@text`;
  }
}

export function buildNativeIndexRule(baseSelector: string, fieldKey: string, config: IndexConfig, opts: IndexedRuleOptions): string {
  const { isList, listItemTag } = opts;

  if (isList) {
    const start = config.start ? parseInt(String(config.start), 10) : 0;
    const end = config.end ? parseInt(String(config.end), 10) : 0;

    if (isNaN(start) || isNaN(end)) return baseSelector;

    if ((!start || start <= 1) && (!end || end === 0 || end === -1)) {
      return baseSelector;
    }

    const nativeStart = start > 1 ? start - 1 : '';
    const nativeEnd = end > 0 ? end - 1 : end < 0 ? end : '';

    if (nativeStart === '' && nativeEnd === '') return baseSelector;
    if (nativeStart === '' && nativeEnd !== '') return `${baseSelector}[:${nativeEnd}]`;
    if (nativeStart !== '' && nativeEnd === '') return `${baseSelector}[${nativeStart}:]`;
    return `${baseSelector}[${nativeStart}:${nativeEnd}]`;
  }

  const singleVal = config.single ? parseInt(String(config.single), 10) : 0;
  if (!singleVal || isNaN(singleVal) || singleVal === 0) {
    if (listItemTag === 'a' && LINK_FIELDS.includes(fieldKey)) {
      return 'a@href';
    }
    return buildAtSelector(baseSelector, fieldKey, 'div', listItemTag);
  }

  const index = parseSingleIndex(config.single);
  if (index === null) return baseSelector;

  if (listItemTag === 'a' && LINK_FIELDS.includes(fieldKey)) {
    return `a.${index}@href`;
  }

  return `${baseSelector}.${index}${buildAtSelector('', fieldKey, '', listItemTag).replace(/^[^@]+/, '')}`;
}

function buildJsRule(body: string, returnsList: boolean): string {
  const catchReturnExpr = returnsList ? '[""+e]' : '""+e';
  return `<js>(function(result){
    try{
${body}
    }catch(e){
      return ${catchReturnExpr};
    }
  })(result)</js>`;
}

export function buildJsIndexRule(baseSelector: string, fieldKey: string, config: IndexConfig, opts: IndexedRuleOptions): string {
  const { isList, fieldKey: key, listItemTag } = opts;
  const atSelector = buildAtSelector('', key, 'div', listItemTag).replace(/^[^@]+/, '');

  if (isList) {
    const start = config.start ? parseInt(String(config.start), 10) : 0;
    const end = config.end ? parseInt(String(config.end), 10) : 0;
    const sizeExpr = 'list.size()';

    const startExpr = start > 1 ? String(start - 1) : '0';
    let endExpr: string;
    if (end > 0) endExpr = String(end - 1);
    else if (end < 0) endExpr = buildJsArrayIndexExpr(end, sizeExpr);
    else endExpr = sizeExpr;

    const body = `      var list = result.select("${baseSelector}");
      return list.slice(${startExpr}, ${endExpr}).map(function(el){ return el${atSelector}; });`;
    return buildJsRule(body, true);
  }

  const singleVal = config.single ? parseInt(String(config.single), 10) : 0;
  if (!singleVal || isNaN(singleVal) || singleVal === 0) {
    const body = `      var el = result.select("${baseSelector}").first();
      return el${atSelector};`;
    return buildJsRule(body, false);
  }

  const index = parseSingleIndex(config.single);
  if (index === null) {
    const body = `      var el = result.select("${baseSelector}").first();
      return el${atSelector};`;
    return buildJsRule(body, false);
  }

  if (listItemTag === 'a' && LINK_FIELDS.includes(key)) {
    const body = `      var list = result.select("a${atSelector}");
      return list.get(${index}) || "";`;
    return buildJsRule(body, false);
  }

  const body = `      var list = result.select("${baseSelector}${atSelector}");
      return list.get(${index}) || "";`;
  return buildJsRule(body, false);
}

export function buildTextIndexedRule(baseSelector: string, config: IndexConfig, isList: boolean): string {
  if (isList) {
    const start = config.start ? parseInt(String(config.start), 10) : 0;
    const end = config.end ? parseInt(String(config.end), 10) : 0;

    if (isNaN(start) || isNaN(end)) return baseSelector;

    if ((!start || start <= 1) && (!end || end === 0 || end === -1)) {
      return baseSelector;
    }

    const nativeStart = start > 1 ? start - 1 : '';
    const nativeEnd = end > 0 ? end - 1 : end < 0 ? end : '';

    if (nativeStart === '' && nativeEnd === '') return baseSelector;
    if (nativeStart === '' && nativeEnd !== '') return `${baseSelector}[:${nativeEnd}]`;
    if (nativeStart !== '' && nativeEnd === '') return `${baseSelector}[${nativeStart}:]`;
    return `${baseSelector}[${nativeStart}:${nativeEnd}]`;
  }

  const singleVal = config.single ? parseInt(String(config.single), 10) : 0;
  if (!singleVal || isNaN(singleVal) || singleVal === 0) return baseSelector;

  const index = parseSingleIndex(config.single);
  if (index === null) return baseSelector;

  return `${baseSelector}.${index}`;
}