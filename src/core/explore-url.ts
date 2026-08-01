import type { ExploreCard } from '@lib';

const FIELD_SEP = '##';
const CARD_SEP = '\n';

export function serializeExploreCards(cards: ExploreCard[]): string {
  return cards
    .filter((c): c is ExploreCard => c.enabled)
    .map((card) => {
      const categoryStr = Object.entries(card.category)
        .map(([k, v]) => `${k}=${v}`)
        .join(';');
      return [
        card.url,
        card.name,
        categoryStr,
        card.pageTemplate
      ].join(FIELD_SEP);
    })
    .join(CARD_SEP);
}

export function deserializeExploreCards(text: string): ExploreCard[] {
  if (!text || !text.trim()) return [];
  return text.split(CARD_SEP)
    .filter(line => line.trim())
    .map((line) => {
      const parts = line.split(FIELD_SEP);
      if (parts.length < 2) return null;
      const url = parts[0] ?? '';
      const name = parts[1] ?? '';
      const categoryStr = parts[2] ?? '';
      const pageTemplate = parts[3] ?? '';
      const category: Record<string, string> = {};
      categoryStr.split(';').forEach(pair => {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
          category[pair.slice(0, eqIndex)] = pair.slice(eqIndex + 1);
        }
      });
      return {
        url: url.trim(),
        name: name.trim(),
        category,
        pageTemplate: pageTemplate.trim(),
        enabled: true
      };
    })
    .filter((card): card is ExploreCard => card !== null);
}

export function applyBatchReplace(cards: ExploreCard[], pattern: string, replacement: string): ExploreCard[] {
  try {
    const regex = new RegExp(pattern, 'g');
    return cards.map((card) => ({
      ...card,
      url: card.url.replace(regex, replacement)
    }));
  } catch {
    return cards;
  }
}

export function applyCategoryPaging(cards: ExploreCard[], template: string): ExploreCard[] {
  if (!template.trim()) return cards;
  return cards.map((card) => {
    let url = card.url;
    for (const [key, value] of Object.entries(card.category)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(\\?|&)${escapedKey}=[^&]*`, 'g');
      const replacement = `$1${key}=${template.replace('页码', value)}`;
      url = url.replace(regex, replacement);
    }
    return { ...card, url };
  });
}

export function buildBatchReplaceRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, 'g');
  } catch {
    return null;
  }
}