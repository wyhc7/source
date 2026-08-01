import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSelector, countMatches } from '@core/selector-generator';
import type { SelectorOptions } from '@lib';

describe('Selector Generator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const defaultOptions: SelectorOptions = {
    useClassIntersection: true,
    maxDepth: 10
  };

  describe('generateSelector', () => {
    it('should generate simple ID selector when useClassIntersection is false', () => {
      document.body.innerHTML = '<div id="test-id"></div>';
      const el = document.getElementById('test-id')!;
      const result = generateSelector(document.body, el, { ...defaultOptions, useClassIntersection: false });
      expect(result.selector).toBe('#test-id');
    });

    it('should generate class selector for unique class', () => {
      document.body.innerHTML = '<div class="unique-class"></div>';
      const el = document.querySelector('.unique-class')!;
      const result = generateSelector(document.body, el, defaultOptions);
      expect(result.selector).toContain('.unique-class');
    });

    it('should generate tag selector for unique tag', () => {
      document.body.innerHTML = '<main></main>';
      const el = document.querySelector('main')!;
      const result = generateSelector(document.body, el, defaultOptions);
      expect(result.selector).toBe('main');
    });

    it('should generate combined selector for non-unique class', () => {
      document.body.innerHTML = '<div class="common"></div><div class="common"></div>';
      const el = document.querySelectorAll('.common')[0]!;
      const result = generateSelector(document.body, el, defaultOptions);
      expect(result.selector).toContain('.common');
    });

    it('should handle nested elements', () => {
      document.body.innerHTML = '<div class="parent"><span class="child"></span></div>';
      const el = document.querySelector('.child')!;
      const result = generateSelector(document.body, el, defaultOptions);
      expect(result.selector).toContain('.child');
    });

    it('should handle elements with no unique identifiers', () => {
      document.body.innerHTML = '<div><span></span></div>';
      const el = document.querySelector('span')!;
      const result = generateSelector(document.body, el, defaultOptions);
      expect(result.selector).toBeTruthy();
    });

    it('should detect list items', () => {
      document.body.innerHTML = '<ul><li>1</li><li>2</li><li>3</li></ul>';
      const el = document.querySelectorAll('li')[0]!;
      const result = generateSelector(document.body, el, defaultOptions);
      expect(result.isList).toBe(true);
      expect(result.matchedCount).toBe(3);
    });

    it('should respect root element', () => {
      document.body.innerHTML = '<div class="container"><span class="item"></span></div><span class="item"></span>';
      const container = document.querySelector('.container')!;
      const el = container.querySelector('.item')!;
      const result = generateSelector(container, el, defaultOptions);
      expect(result.matchedCount).toBe(1);
    });
  });

  describe('countMatches', () => {
    it('should count matching elements', () => {
      document.body.innerHTML = '<div class="item"></div><div class="item"></div><div class="item"></div>';
      expect(countMatches('.item')).toBe(3);
    });

    it('should return 0 for no matches', () => {
      document.body.innerHTML = '<div class="item"></div>';
      expect(countMatches('.nonexistent')).toBe(0);
    });

    it('should respect root element', () => {
      document.body.innerHTML = '<div class="container"><span class="item"></span></div><span class="item"></span>';
      const container = document.querySelector('.container')!;
      expect(countMatches('.item', container)).toBe(1);
    });
  });
});