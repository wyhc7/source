import { describe, it, expect } from 'vitest';
import { importBookSource, exportBookSource, flattenCategoryTree, parseCategoryTree } from '@core/import-export';
import type { CategoryNode, BookSource, FieldRule, SearchRule } from '@lib';

describe('Import/Export', () => {
  describe('importBookSource', () => {
    it('should import valid Legado book source JSON', () => {
      const sourceJson = JSON.stringify({
        bookSourceName: 'Test Source',
        bookSourceUrl: 'https://example.com',
        ruleSearch: { searchUrl: 'https://example.com/search?q={keyword}' },
        ruleBookInfo: [{ name: 'name', rule: 'h1.title' }],
        ruleToc: [{ name: 'chapterList', rule: 'ul.chapters li' }],
        ruleContent: [{ name: 'content', rule: 'div.content' }],
        ruleExplore: []
      });
      const result = importBookSource(sourceJson);
      expect(result.bookSourceName).toBe('Test Source');
      expect(result.ruleSearch.searchUrl).toContain('search?q=');
    });

    it('should handle minimal book source', () => {
      const sourceJson = JSON.stringify({
        bookSourceName: 'Minimal',
        bookSourceUrl: 'https://example.com'
      });
      const result = importBookSource(sourceJson);
      expect(result.bookSourceName).toBe('Minimal');
    });

    it('should throw on invalid JSON', () => {
      expect(() => importBookSource('invalid json')).toThrow();
    });

    it('should handle ruleExplore array', () => {
      const sourceJson = JSON.stringify({
        bookSourceName: 'With Explore',
        bookSourceUrl: 'https://example.com',
        ruleExplore: [
          { name: 'Category 1', url: 'https://example.com/cat1/{page}' },
          { name: 'Category 2', url: 'https://example.com/cat2/{page}' }
        ]
      });
      const result = importBookSource(sourceJson);
      expect(result.ruleExplore).toHaveLength(2);
    });
  });

  describe('exportBookSource', () => {
    it('should export rules to Legado format', () => {
      const source: BookSource = {
        bookSourceName: 'Test Source',
        bookSourceUrl: 'https://example.com',
        bookSourceType: 0,
        bookSourceGroup: '',
        category: '',
        ruleSearch: { searchUrl: 'https://example.com/search?q={keyword}', method: 'GET', postBody: '', charset: '', header: '' },
        ruleBookInfo: [{ name: 'name', rule: 'h1.title', webView: false }],
        ruleToc: [{ name: 'chapterList', rule: 'ul.chapters li', webView: false }],
        ruleContent: [{ name: 'content', rule: 'div.content', webView: false }],
        ruleExplore: '',
        login: { url: '', username: '', password: '', cookies: '' },
        header: '',
        weight: 0,
        lastUpdateTime: Date.now(),
        sourceRemark: ''
      };
      const result = exportBookSource(source);
      const parsed = JSON.parse(result);
      expect(parsed.bookSourceName).toBe('Test Source');
      // The export format uses custom serialization with ## separators
      expect(parsed.ruleSearch).toContain('searchUrl##https://example.com/search?q={keyword}');
    });

    it('should handle empty rules', () => {
      const source: BookSource = {
        bookSourceName: 'Empty',
        bookSourceUrl: 'https://example.com',
        bookSourceType: 0,
        bookSourceGroup: '',
        category: '',
        ruleSearch: { searchUrl: '', method: 'GET', postBody: '', charset: '', header: '' },
        ruleBookInfo: [],
        ruleToc: [],
        ruleContent: [],
        ruleExplore: '',
        login: { url: '', username: '', password: '', cookies: '' },
        header: '',
        weight: 0,
        lastUpdateTime: Date.now(),
        sourceRemark: ''
      };
      const result = exportBookSource(source);
      const parsed = JSON.parse(result);
      expect(parsed.bookSourceName).toBe('Empty');
    });
  });

  describe('flattenCategoryTree', () => {
    it('should flatten nested category object', () => {
      const tree: CategoryNode = {
        name: '',
        children: new Map([
          ['分类1', { name: '分类1', children: new Map([
            ['子分类1', { name: '子分类1', children: new Map() }],
            ['子分类2', { name: '子分类2', children: new Map() }]
          ]) }],
          ['分类2', { name: '分类2', children: new Map() }]
        ])
      };
      const result = flattenCategoryTree(tree);
      expect(result).toEqual([
        '分类1/子分类1',
        '分类1/子分类2',
        '分类2'
      ]);
    });

    it('should handle empty tree', () => {
      const tree: CategoryNode = { name: '', children: new Map() };
      const result = flattenCategoryTree(tree);
      expect(result).toEqual([]);
    });

    it('should handle deep nesting', () => {
      const tree: CategoryNode = {
        name: '',
        children: new Map([
          ['a', { name: 'a', children: new Map([
            ['b', { name: 'b', children: new Map([
              ['c', { name: 'c', children: new Map() }]
            ]) }]
          ]) }]
        ])
      };
      const result = flattenCategoryTree(tree);
      expect(result).toEqual(['a/b/c']);
    });
  });

  describe('parseCategoryTree', () => {
    it('should parse single path string to nested tree', () => {
      const result = parseCategoryTree('分类1/子分类1/子分类2');
      expect(result.name).toBe('');
      expect(result.children.has('分类1')).toBe(true);
      const cat1 = result.children.get('分类1')!;
      expect(cat1.children.has('子分类1')).toBe(true);
      const sub1 = cat1.children.get('子分类1')!;
      expect(sub1.children.has('子分类2')).toBe(true);
    });

    it('should handle empty string', () => {
      const result = parseCategoryTree('');
      expect(result.name).toBe('');
      expect(result.children.size).toBe(0);
    });

    it('should handle single level', () => {
      const result = parseCategoryTree('分类1');
      expect(result.children.has('分类1')).toBe(true);
      expect(result.children.get('分类1')!.children.size).toBe(0);
    });

    it('should handle multiple segments', () => {
      const result = parseCategoryTree('a/b/c/d');
      expect(result.children.has('a')).toBe(true);
      expect(result.children.get('a')!.children.has('b')).toBe(true);
      expect(result.children.get('a')!.children.get('b')!.children.has('c')).toBe(true);
      expect(result.children.get('a')!.children.get('b')!.children.get('c')!.children.has('d')).toBe(true);
    });
  });
});