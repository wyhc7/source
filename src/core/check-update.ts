export interface LatestRelease {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  body?: string;
}

export interface UpdateResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  error?: string;
}

const GITHUB_REPO = 'wyhc7/source';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  const maxLen = Math.max(pa.length, pb.length);
  for (let i = 0; i < maxLen; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateResult> {
  try {
    const resp = await fetch(RELEASES_API, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    if (!resp.ok) {
      if (resp.status === 404) {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseUrl: '',
          error: 'NOT_FOUND'
        };
      }
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseUrl: '',
        error: `GitHub API 请求失败 (${resp.status})`
      };
    }
    const data = await resp.json() as LatestRelease;
    const latestTag = data.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(latestTag, currentVersion) > 0;
    return {
      hasUpdate,
      currentVersion,
      latestVersion: latestTag,
      releaseUrl: data.html_url
    };
  } catch (e) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: '',
      error: (e as Error).message || '检查更新失败'
    };
  }
}
