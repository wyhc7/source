import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startCapture, stopCapture, parseSearchUrl, extractKeywordFromUrl, normalizeCharset, containsKeywordInPercentEncoded, decodePercentBytes } from '@core/search-capture';

describe('Search Capture', () => {
  let originalXHR: any;
  let originalFetch: any;
  let mockXHR: any;

  beforeEach(() => {
    originalXHR = window.XMLHttpRequest;
    originalFetch = window.fetch;

    mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      readyState: 4,
      status: 200,
      responseText: '{}',
      responseURL: 'https://example.com/search?q=test',
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') setTimeout(handler, 0);
      }),
      removeEventListener: vi.fn()
    };

    window.XMLHttpRequest = vi.fn(() => mockXHR) as any;
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      url: 'https://example.com/search?q=test',
      clone: function() { return this; },
      text: () => Promise.resolve('{}'),
      json: () => Promise.resolve({})
    });
  });

  afterEach(() => {
    window.XMLHttpRequest = originalXHR;
    window.fetch = originalFetch;
    if (typeof window !== 'undefined' && (window as any).__LEGADO_STOP_CAPTURE__) {
      (window as any).__LEGADO_STOP_CAPTURE__();
    }
  });

  describe('normalizeCharset', () => {
    it('should normalize utf-8 variants', () => {
      expect(normalizeCharset('UTF-8')).toBe('utf-8');
      expect(normalizeCharset('utf8')).toBe('utf-8');
    });

    it('should normalize gbk variants', () => {
      expect(normalizeCharset('GBK')).toBe('gbk');
      expect(normalizeCharset('gb2312')).toBe('gbk');
      expect(normalizeCharset('gb18030')).toBe('gbk');
    });

    it('should normalize big5', () => {
      expect(normalizeCharset('Big5')).toBe('big5');
    });

    it('should default to utf-8', () => {
      expect(normalizeCharset('unknown')).toBe('utf-8');
    });
  });

  describe('decodePercentBytes', () => {
    it('should decode single percent-encoded byte', () => {
      const result = decodePercentBytes('%E6', 'utf-8');
      expect(typeof result).toBe('string');
    });

    it('should handle non-percent-encoded strings', () => {
      const result = decodePercentBytes('hello', 'utf-8');
      expect(result).toBe('hello');
    });
  });

  describe('containsKeywordInPercentEncoded', () => {
    const KEYWORD = 'test';

    it('should detect keyword in plain text', () => {
      expect(containsKeywordInPercentEncoded('https://example.com/search?q=test', KEYWORD)).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(containsKeywordInPercentEncoded('https://example.com/search?q=TEST', KEYWORD)).toBe(true);
    });

    it('should return false for non-matching', () => {
      expect(containsKeywordInPercentEncoded('https://example.com/search?q=other', KEYWORD)).toBe(false);
    });
  });

  describe('extractKeywordFromUrl', () => {
    const KEYWORD = 'test';

    it('should extract keyword from query param', () => {
      const result = extractKeywordFromUrl('https://example.com/search?q=test&page=1', KEYWORD);
      expect(result).toBe('test');
    });

    it('should return null for no match', () => {
      const result = extractKeywordFromUrl('https://example.com/search?q=other', KEYWORD);
      expect(result).toBeNull();
    });

    it('should handle invalid URL', () => {
      const result = extractKeywordFromUrl('invalid-url', KEYWORD);
      expect(result).toBeNull();
    });
  });

  describe('parseSearchUrl', () => {
    const KEYWORD = 'test';

    it('should parse GET search URL with keyword', () => {
      const rule = parseSearchUrl('https://example.com/search?q=test&page=1', KEYWORD);
      expect(rule).not.toBeNull();
      expect(rule!.searchUrl).toContain('{{key}}');
      expect(rule!.method).toBe('GET');
    });

    it('should return null for URL without keyword', () => {
      const rule = parseSearchUrl('https://example.com/search?q=other', KEYWORD);
      expect(rule).toBeNull();
    });

    it('should handle invalid URL', () => {
      const rule = parseSearchUrl('invalid-url', KEYWORD);
      expect(rule).toBeNull();
    });
  });

  describe('startCapture/stopCapture', () => {
    it('should start capture mode and return promise', () => {
      const callbacks = {
        onCaptured: vi.fn()
      };
      const promise = startCapture(1, callbacks);
      expect(promise).toBeInstanceOf(Promise);
      // Clean up immediately to avoid timeout
      if ((window as any).__LEGADO_STOP_CAPTURE__) {
        (window as any).__LEGADO_STOP_CAPTURE__();
      }
    });

    it('should stop capture mode', () => {
      // Just test that stopCapture doesn't throw
      (window as any).__LEGADO_STOP_CAPTURE__ = vi.fn(() => {});
      expect(() => stopCapture(1)).not.toThrow();
      expect((window as any).__LEGADO_STOP_CAPTURE__).toBeUndefined();
    });
  });
});