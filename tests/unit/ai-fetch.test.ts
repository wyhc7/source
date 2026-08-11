import { describe, it, expect } from 'vitest';
import { parseAiResponse } from '../../src/core/ai-fetch';

describe('parseAiResponse', () => {
  it('parses clean JSON', () => {
    const json = JSON.stringify({ name: 'test', url: 'https://example.com' });
    expect(parseAiResponse(json)).toEqual({ name: 'test', url: 'https://example.com' });
  });

  it('strips markdown code blocks', () => {
    const input = '```json\n{"name":"x"}\n```';
    expect(parseAiResponse(input)).toEqual({ name: 'x' });
  });

  it('strips plain code blocks', () => {
    const input = '```\n{"name":"x"}\n```';
    expect(parseAiResponse(input)).toEqual({ name: 'x' });
  });

  it('extracts JSON from surrounding text', () => {
    const input = 'Here is the result:\n{"name":"x","url":"y"}\nDone.';
    expect(parseAiResponse(input)).toEqual({ name: 'x', url: 'y' });
  });

  it('returns { _raw } on invalid JSON', () => {
    expect(parseAiResponse('not json at all')).toEqual({ _raw: 'not json at all' });
  });

  it('handles empty string', () => {
    expect(parseAiResponse('')).toEqual({ _raw: '' });
  });
});
