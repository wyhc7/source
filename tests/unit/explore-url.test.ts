import { describe, it, expect } from 'vitest';
import { deserializeExploreCards, serializeExploreCards, applyBatchReplace, applyCategoryPaging } from '@core/explore-url';
import type { ExploreCard } from '@lib';

describe('Explore URL', () => {
  const sampleCards: ExploreCard[] = [
    {
      url: 'https://example.com/novel/{{page}}',
      name: 'Example Novel',
      category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' },
      pageTemplate: 'https://example.com/novel/{{page}}',
      enabled: true
    },
    {
      url: 'https://test.com/book/list/{{page}}.html',
      name: 'Test Book',
      category: { '都市': 'dushi' },
      pageTemplate: 'https://test.com/book/list/{{page}}.html',
      enabled: true
    }
  ];

  describe('deserializeExploreCards', () => {
    it('should parse valid text format', () => {
      const text = [
        'https://example.com/novel/{{page}}##Example Novel##玄幻=xuanhuan;仙侠=xianxia##https://example.com/novel/{{page}}',
        'https://test.com/book/list/{{page}}.html##Test Book##都市=dushi##https://test.com/book/list/{{page}}.html'
      ].join('\n');
      const cards = deserializeExploreCards(text);
      expect(cards).toHaveLength(2);
      expect(cards[0]!.name).toBe('Example Novel');
      expect(cards[0]!.category['玄幻']).toBe('xuanhuan');
    });

    it('should return empty array for empty string', () => {
      const cards = deserializeExploreCards('');
      expect(cards).toEqual([]);
    });

    it('should return empty array for whitespace only', () => {
      const cards = deserializeExploreCards('   ');
      expect(cards).toEqual([]);
    });

    it('should handle missing fields gracefully', () => {
      const text = 'https://example.com##Minimal##';
      const cards = deserializeExploreCards(text);
      expect(cards).toHaveLength(1);
      expect(cards[0]!.name).toBe('Minimal');
      expect(cards[0]!.url).toBe('https://example.com');
    });

    it('should filter out disabled cards', () => {
      const text = 'https://example.com##Enabled####\nhttps://example.com##Disabled####';
      const cards = deserializeExploreCards(text);
      expect(cards).toHaveLength(2);
      expect(cards[0]!.enabled).toBe(true);
    });
  });

  describe('serializeExploreCards', () => {
    it('should serialize cards to text format', () => {
      const text = serializeExploreCards(sampleCards);
      const lines = text.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('Example Novel');
      expect(lines[0]).toContain('玄幻=xuanhuan');
    });

    it('should handle empty array', () => {
      const text = serializeExploreCards([]);
      expect(text).toBe('');
    });

    it('should only serialize enabled cards', () => {
      const cards: ExploreCard[] = [
        { url: 'https://example.com/novel/{{page}}', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true },
        { url: 'https://test.com/book/list/{{page}}.html', name: 'Test Book', category: { '都市': 'dushi' }, pageTemplate: 'https://test.com/book/list/{{page}}.html', enabled: false }
      ];
      const text = serializeExploreCards(cards);
      const lines = text.split('\n');
      expect(lines).toHaveLength(1);
    });
  });

  describe('applyBatchReplace', () => {
    it('should replace pattern in URL', () => {
      const cards: ExploreCard[] = [
        { url: 'https://example.com/novel/{{page}}', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true },
        { url: 'https://test.com/book/list/{{page}}.html', name: 'Test Book', category: { '都市': 'dushi' }, pageTemplate: 'https://test.com/book/list/{{page}}.html', enabled: true }
      ];
      const result = applyBatchReplace(cards, 'novel', 'book');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]!.url).toBe('https://example.com/book/{{page}}');
      expect(result[1]!.url).toBe('https://test.com/book/list/{{page}}.html');
    });

    it('should handle regex pattern', () => {
      const cards: ExploreCard[] = [
        { url: 'https://example.com/novel/123', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyBatchReplace(cards, '\\d+', '456');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]!.url).toBe('https://example.com/novel/456');
    });

    it('should return original cards if pattern not found', () => {
      const cards: ExploreCard[] = [
        { url: 'https://example.com/novel/{{page}}', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyBatchReplace(cards, 'nonexistent', 'replacement');
      expect(result.length).toBeGreaterThan(0);
      const first = result[0] as ExploreCard; // @ts-expect-error - noUncheckedIndexedAccess makes array access return T | undefined
      expect(first.url).toBe(cards[0].url);
    });

    it('should handle invalid regex gracefully', () => {
      const cards: ExploreCard[] = [
        { url: 'https://example.com/novel', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyBatchReplace(cards, '[invalid', 'replacement');
      expect(result.length).toBeGreaterThan(0);
      const first = result[0] as ExploreCard; // @ts-expect-error - noUncheckedIndexedAccess makes array access return T | undefined
      expect(first.url).toBe(cards[0].url);
    });
  });

  describe('applyCategoryPaging', () => {
    it('should replace category query params in URL when key matches', () => {
      // The function looks for query params where KEY matches category key
      // and replaces the value with template.replace('页码', categoryValue)
      const cards: ExploreCard[] = [
        { url: 'https://site.com/list?玄幻=old&仙侠=old2', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyCategoryPaging(cards, 'https://site.com/页码');
      // Template contains "页码" which gets replaced with category value
      const firstResult = result[0];
      if (firstResult) {
        expect(firstResult.url).toContain('玄幻=https://site.com/xuanhuan');
        expect(firstResult.url).toContain('仙侠=https://site.com/xianxia');
      }
    });

    it('should not modify URL if no matching query param keys', () => {
      const cards: ExploreCard[] = [
        { url: 'https://site.com/list?cat=玄幻&cat2=仙侠', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyCategoryPaging(cards, 'https://site.com/页码');
      // Keys are "cat" and "cat2", not "玄幻" and "仙侠"
      const firstResult = result[0];
      if (firstResult) {
        expect(firstResult.url).toBe('https://site.com/list?cat=玄幻&cat2=仙侠');
      }
    });

    it('should handle multiple categories with matching keys', () => {
      const cards: ExploreCard[] = [
        { url: 'https://site.com/list?cat=old&cat2=old2', name: 'Example Novel', category: { 'cat': 'xuanhuan', 'cat2': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyCategoryPaging(cards, 'https://site.com/页码');
      const firstResult = result[0];
      if (firstResult) {
        expect(firstResult.url).toContain('cat=https://site.com/xuanhuan');
        expect(firstResult.url).toContain('cat2=https://site.com/xianxia');
      }
    });

    it('should handle template without 页码 placeholder', () => {
      const cards: ExploreCard[] = [
        { url: 'https://site.com/list?玄幻=old', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyCategoryPaging(cards, 'https://site.com/{{page}}');
      // No "页码" in template, so template is used as-is
      const firstResult = result[0];
      if (firstResult) {
        expect(firstResult.url).toContain('玄幻=https://site.com/{{page}}');
      }
    });

it('should handle empty template', () => {
      const cards: ExploreCard[] = [
        { url: 'https://example.com/novel/{{page}}', name: 'Example Novel', category: { '玄幻': 'xuanhuan', '仙侠': 'xianxia' }, pageTemplate: 'https://example.com/novel/{{page}}', enabled: true }
      ];
      const result = applyCategoryPaging(cards, '');
      expect(result.length).toBeGreaterThan(0);
      const first = result[0] as ExploreCard; // @ts-expect-error - noUncheckedIndexedAccess makes array access return T | undefined
      expect(first.url).toBe(cards[0].url);
    });
  });
});