import type { SelectorOptions, SelectorResult } from '@lib';

function getTagPath(element: Element, root: Element, maxDepth?: number): string[] {
  const path: string[] = [];
  let current: Element | null = element;
  while (current && current !== root && current !== document.body) {
    if (maxDepth && path.length >= maxDepth) break;
    path.unshift(current.tagName.toLowerCase());
    current = current.parentElement;
  }
  return path;
}

function getClassList(element: Element): string[] {
  return Array.from(element.classList).filter(c => c.trim() !== '');
}

function hasDynamicClass(className: string): boolean {
  return /^-?[_a-zA-Z]+[_a-zA-Z0-9]*[0-9]+[a-zA-Z0-9]*$/.test(className) || /^[0-9]+[a-zA-Z]/.test(className);
}

function filterStableClasses(classes: string[]): string[] {
  return classes.filter(c => !hasDynamicClass(c));
}

function getCommonClasses(elements: Element[]): string[] {
  if (elements.length === 0) return [];
  const firstEl = elements[0];
  if (!firstEl) return [];
  const firstClasses = new Set(filterStableClasses(getClassList(firstEl)));
  for (let i = 1; i < elements.length; i++) {
    const el = elements[i];
    if (!el) continue;
    const classes = new Set(filterStableClasses(getClassList(el)));
    for (const cls of firstClasses) {
      if (!classes.has(cls)) firstClasses.delete(cls);
    }
    if (firstClasses.size === 0) break;
  }
  return Array.from(firstClasses).sort();
}

function getLCAPath(elements: Element[], root: Element): { lca: Element; paths: string[][] } {
  const allPaths = elements.map(el => getTagPath(el, root));
  let lca: Element = root;
  const firstPath = allPaths[0];
  if (!firstPath || firstPath.length === 0) return { lca, paths: allPaths };
  for (let i = 0; i < firstPath.length; i++) {
    const tag = firstPath[i];
    if (allPaths.every(p => p[i] === tag)) {
      let candidate: Element | undefined = elements[0];
      for (let j = 0; j <= i; j++) {
        if (j === i && candidate) lca = candidate;
        if (candidate?.parentElement) candidate = candidate.parentElement;
      }
    } else break;
  }
  return { lca, paths: allPaths };
}

function buildSelectorFromPath(path: string[], commonClasses: string[]): string {
  if (path.length === 0) return '';
  const tag = path[path.length - 1];
  const classPart = commonClasses.length > 0 ? '.' + commonClasses.join('.') : '';
  const parentPath = path.slice(0, -1).join(' > ');
  if (parentPath) {
    return `${parentPath} > ${tag}${classPart}`;
  }
  return `${tag}${classPart}`;
}

function getSiblingLevelPair(elements: Element[], root: Element): string | null {
  if (elements.length < 2) return null;
  const first = elements[0];
  if (!first) return null;
  const parent = first.parentElement;
  if (!parent || parent === root) return null;
  const commonClasses = getCommonClasses(elements);
  if (commonClasses.length === 0) return null;
  const tag = first.tagName.toLowerCase();
  const parentPath = getTagPath(parent, root).join(' > ');
  return `${parentPath} > ${tag}.${commonClasses.join('.')}`;
}

function getSiblingPairViaLCA(elements: Element[], root: Element): string | null {
  if (elements.length === 0) return null;
  const { lca } = getLCAPath(elements, root);
  if (lca === root) return null;
  const commonClasses = getCommonClasses(elements);
  if (commonClasses.length === 0) return null;
  const firstEl = elements[0];
  if (!firstEl) return null;
  const tag = firstEl.tagName.toLowerCase();
  const lcaPath = getTagPath(lca, root).join(' > ');
  return `${lcaPath} > ${tag}.${commonClasses.join('.')}`;
}

export function getIntersectionSelector(elements: Element[], root: Element): string {
  const levelPair = getSiblingLevelPair(elements, root);
  if (levelPair) return levelPair;
  const lcaPair = getSiblingPairViaLCA(elements, root);
  if (lcaPair) return lcaPair;
  const commonClasses = getCommonClasses(elements);
  if (commonClasses.length > 0 && elements[0]) {
    const tag = elements[0].tagName.toLowerCase();
    return `${tag}.${commonClasses.join('.')}`;
  }
  return elements[0]?.tagName.toLowerCase() ?? '*';
}

export function generateSelector(root: Element | undefined, target: Element, options: SelectorOptions): SelectorResult {
  const { useClassIntersection = true, maxDepth = 10 } = options;
  const effectiveRoot = root && root === target ? document.body : root ?? document.body;

  if (target.id && !useClassIntersection) {
    return { selector: `#${target.id}`, matchedCount: 1, isList: false };
  }

  const path = getTagPath(target, effectiveRoot, maxDepth);
  if (path.length === 0) {
    return { selector: target.tagName.toLowerCase(), matchedCount: 0, isList: false };
  }

  const selectorForQuery = path.join(' > ');
  const siblings = Array.from(effectiveRoot.querySelectorAll(selectorForQuery));
  if (siblings.length > 1) {
    const selector = getIntersectionSelector(siblings, effectiveRoot);
    return {
      selector,
      matchedCount: siblings.length,
      isList: siblings.length > 1,
      listItemTag: target.tagName.toLowerCase()
    };
  }

  const classes = useClassIntersection ? getCommonClasses([target]) : [];
  const selector = buildSelectorFromPath(path, classes);
  return {
    selector,
    matchedCount: 1,
    isList: false
  };
}

export function countMatches(selector: string, root: Element = document.body): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}