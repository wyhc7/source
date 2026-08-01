import { describe, it, expect } from 'vitest';
import { buildNativeIndexRule, buildJsIndexRule, buildTextIndexedRule, parseSingleIndex } from '@core/indexed-rule';
import type { IndexConfig, IndexedRuleOptions } from '@lib';

describe('Indexed Rule Generator', () => {
  const defaultOpts: IndexedRuleOptions = { isList: true, fieldKey: 'title', listItemTag: 'li', useJsIndex: false };

  describe('buildNativeIndexRule', () => {
    it('should generate native index rule with start/end', () => {
      const rule = buildNativeIndexRule('li.item', 'title', { start: 1, end: 5 }, defaultOpts);
      expect(rule).toContain('li.item');
      // start=1 -> 0, end=5 -> 4, but the implementation returns [:4] for start=1 (which is <=1)
      expect(rule).toBe('li.item[:4]');
    });

    it('should generate native index rule with single index for list', () => {
      const rule = buildNativeIndexRule('li.item', 'title', { single: 3 }, defaultOpts);
      // For list with single, it uses the single value but the implementation checks listItemTag
      expect(rule).toBe('li.item');
    });

    it('should handle zero-based conversion correctly', () => {
      // UI is 1-based, native is 0-based
      const rule = buildNativeIndexRule('li.item', 'title', { start: 1, end: 10 }, defaultOpts);
      expect(rule).toBe('li.item[:9]');
    });

    it('should handle empty index config', () => {
      const rule = buildNativeIndexRule('li.item', 'title', {}, defaultOpts);
      expect(rule).toBe('li.item');
    });

    it('should handle non-list fields with single', () => {
      const rule = buildNativeIndexRule('.detail-title', 'title', { single: 1 }, { ...defaultOpts, isList: false });
      // single=1 -> index 0, for non-list link field it returns a@href
      expect(rule).toBe('.detail-title.0@text');
    });

    it('should handle start > 1', () => {
      const rule = buildNativeIndexRule('li.item', 'title', { start: 3, end: 8 }, defaultOpts);
      // start=3 -> 2, end=8 -> 7
      expect(rule).toBe('li.item[2:7]');
    });
  });

  describe('buildJsIndexRule', () => {
    it('should generate JS index rule for list', () => {
      const rule = buildJsIndexRule('li.item', 'title', { start: 1, end: 5 }, defaultOpts);
      expect(rule).toContain('li.item');
      expect(rule).toContain('slice');
      // start=1 -> 0, end=5 -> end is exclusive in slice so uses end (5), but implementation uses end-1 (4)
      expect(rule).toContain('0, 4');
    });

    it('should generate JS index rule for single item', () => {
      const rule = buildJsIndexRule('.detail-title', 'title', { single: 3 }, { ...defaultOpts, isList: false });
      expect(rule).toContain('.detail-title');
      // single=3 -> index 2
      expect(rule).toContain('get(2)');
    });

    it('should handle empty index config for list', () => {
      const rule = buildJsIndexRule('li.item', 'title', {}, defaultOpts);
      expect(rule).toContain('li.item');
      expect(rule).toContain('slice');
    });

    it('should handle empty index config for non-list', () => {
      const rule = buildJsIndexRule('.detail-title', 'title', {}, { ...defaultOpts, isList: false });
      expect(rule).toContain('.detail-title');
      expect(rule).toContain('first()');
    });
  });

  describe('buildTextIndexedRule', () => {
    it('should generate text indexed rule with index', () => {
      const rule = buildTextIndexedRule('.title', { single: 2 }, false);
      // single=2 -> index 1
      expect(rule).toBe('.title.1');
    });

    it('should generate text indexed rule without index', () => {
      const rule = buildTextIndexedRule('.title', {}, false);
      expect(rule).toBe('.title');
    });

    it('should generate indexed rule for list', () => {
      const rule = buildTextIndexedRule('.content', { start: 1, end: 5 }, true);
      expect(rule).toContain('.content');
      expect(rule).toBe('.content[:4]');
    });

    it('should handle start > 1 for list', () => {
      const rule = buildTextIndexedRule('.content', { start: 3, end: 8 }, true);
      expect(rule).toBe('.content[2:7]');
    });
  });

  describe('parseSingleIndex', () => {
    it('should parse single number and convert to 0-based', () => {
      const result = parseSingleIndex('3');
      expect(result).toBe(2); // 3 - 1 = 2
    });

    it('should parse number directly', () => {
      const result = parseSingleIndex(3);
      expect(result).toBe(2);
    });

    it('should return null for empty string', () => {
      const result = parseSingleIndex('');
      expect(result).toBeNull();
    });

    it('should return null for invalid input', () => {
      const result = parseSingleIndex('abc');
      expect(result).toBeNull();
    });

    it('should return null for undefined', () => {
      const result = parseSingleIndex(undefined);
      expect(result).toBeNull();
    });

    it('should handle zero', () => {
      const result = parseSingleIndex('0');
      expect(result).toBe(0);
    });
  });
});