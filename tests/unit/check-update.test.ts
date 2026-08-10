import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkForUpdate } from '@core/check-update';

describe('checkForUpdate', () => {
  let originalFetch: any;
  let mockFetch: any;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should detect newer version', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.1.0', html_url: 'https://github.com/z1131392774/legado-source-generator/releases/tag/v1.1.0' })
    });
    const result = await checkForUpdate('1.0.0');
    expect(result.hasUpdate).toBe(true);
    expect(result.latestVersion).toBe('1.1.0');
    expect(result.error).toBeUndefined();
  });

  it('should detect no update when versions equal', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.0.0', html_url: 'https://github.com/z1131392774/legado-source-generator/releases/tag/v1.0.0' })
    });
    const result = await checkForUpdate('1.0.0');
    expect(result.hasUpdate).toBe(false);
  });

  it('should return error on HTTP failure', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await checkForUpdate('1.0.0');
    expect(result.hasUpdate).toBe(false);
    expect(result.error).toContain('404');
  });

  it('should return error on fetch exception', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await checkForUpdate('1.0.0');
    expect(result.hasUpdate).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should strip leading v from tag', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v2.0.0', html_url: 'https://github.com/test' })
    });
    const result = await checkForUpdate('1.9.0');
    expect(result.hasUpdate).toBe(true);
    expect(result.latestVersion).toBe('2.0.0');
  });
});
