import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPresetSnippets, loadCustomSnippets, saveCustomSnippets, addCustomSnippet, removeCustomSnippet } from '@core/quick-snippet';

describe('Quick Snippet', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  describe('getPresetSnippets', () => {
    it('should return array of preset snippets', () => {
      const snippets = getPresetSnippets();
      expect(Array.isArray(snippets)).toBe(true);
      expect(snippets.length).toBeGreaterThan(0);
    });

    it('should have required properties', () => {
      const snippets = getPresetSnippets();
      snippets.forEach(snippet => {
        expect(snippet).toHaveProperty('id');
        expect(snippet).toHaveProperty('label');
        expect(snippet).toHaveProperty('value');
        expect(typeof snippet.id).toBe('string');
        expect(typeof snippet.label).toBe('string');
        expect(typeof snippet.value).toBe('string');
      });
    });

    it('should include common selector patterns', () => {
      const snippets = getPresetSnippets();
      const values = snippets.map(s => s.value);
      // Check for actual preset snippet values
      expect(values).toContain('@href');
      expect(values).toContain('@src');
      expect(values).toContain('@text');
      expect(values).toContain('@html');
    });
  });

  describe('loadCustomSnippets', () => {
    it('should return empty array when no custom snippets', () => {
      const snippets = loadCustomSnippets();
      expect(snippets).toEqual([]);
    });

    it('should load snippets from localStorage', () => {
      const custom = [{ id: 'custom-1', label: 'Custom', value: '.custom-class' }];
      localStorage.setItem('legado_custom_snippets', JSON.stringify(custom));
      const snippets = loadCustomSnippets();
      expect(snippets).toEqual(custom);
    });

    it('should handle corrupted localStorage', () => {
      localStorage.setItem('legado_custom_snippets', 'invalid json');
      const snippets = loadCustomSnippets();
      expect(snippets).toEqual([]);
    });
  });

  describe('saveCustomSnippets', () => {
    it('should save snippets to localStorage', () => {
      const custom = [{ id: 'custom-1', label: 'Custom', value: '.custom-class' }];
      saveCustomSnippets(custom);
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toEqual(custom);
    });

    it('should overwrite existing snippets', () => {
      const first = [{ id: '1', label: 'First', value: '.first' }];
      const second = [{ id: '2', label: 'Second', value: '.second' }];
      saveCustomSnippets(first);
      saveCustomSnippets(second);
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toEqual(second);
    });
  });

  describe('addCustomSnippet', () => {
    it('should add snippet to existing', () => {
      const existing = [{ id: '1', label: 'First', value: '.first' }];
      localStorage.setItem('legado_custom_snippets', JSON.stringify(existing));
      const newSnippet = { id: '2', label: 'Second', value: '.second' };
      addCustomSnippet(newSnippet);
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toHaveLength(2);
    });

    it('should create new array if none exists', () => {
      const newSnippet = { id: '1', label: 'First', value: '.first' };
      addCustomSnippet(newSnippet);
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });

    it('should not add duplicate id', () => {
      const existing = [{ id: '1', label: 'First', value: '.first' }];
      localStorage.setItem('legado_custom_snippets', JSON.stringify(existing));
      const duplicate = { id: '1', label: 'Duplicate', value: '.duplicate' };
      addCustomSnippet(duplicate);
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  describe('removeCustomSnippet', () => {
    it('should remove snippet by id', () => {
      const snippets = [
        { id: '1', label: 'First', value: '.first' },
        { id: '2', label: 'Second', value: '.second' }
      ];
      localStorage.setItem('legado_custom_snippets', JSON.stringify(snippets));
      removeCustomSnippet('1');
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toHaveLength(1);
      expect(JSON.parse(stored!)[0].id).toBe('2');
    });

    it('should handle removing non-existent id', () => {
      const snippets = [{ id: '1', label: 'First', value: '.first' }];
      localStorage.setItem('legado_custom_snippets', JSON.stringify(snippets));
      removeCustomSnippet('999');
      const stored = localStorage.getItem('legado_custom_snippets');
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });
});