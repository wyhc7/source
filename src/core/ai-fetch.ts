const SYSTEM_PROMPT = `你是一名专业的小说书源生成助手。用户会提供一个小说网站 URL 和页面 HTML，你需要分析页面结构并生成 Legado 阅读 APP 可用的书源规则 JSON。

书源字段说明：
- name: 书源名称（网站名或书名）
- url: 网站基础URL
- searchUrl: 搜索URL模板，用 {{key}} 表示搜索词，用 {{page}} 表示页码
- ruleSearch: 搜索列表规则JSON，格式: {"listField":"选择器","name":"标题选择器","url":"链接选择器"}
- ruleBookInfo: 书籍信息规则JSON，包含 bookUrl/coverUrl/author/intro/kind/updateTime/wordCount 字段的选择器
- ruleToc: 目录规则JSON，格式: {"listField":"章节列表选择器","name":"章节标题","url":"章节链接"}
- ruleContent: 正文规则JSON，包含 contentUrl/content/replaceRegex/charset 字段

输出格式必须是合法 JSON，不包含 markdown 代码块标记，不包含任何解释文字。如果某个字段无法确定则使用空字符串。`;

export interface AiRequestConfig {
  url: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AiResponse {
  bookSource: Record<string, string>;
  rawText: string;
}

export type AiErrorType = 'noApiKey' | 'fetchFailed' | 'apiError' | 'parseError' | 'timeout';

export interface AiError {
  type: AiErrorType;
  message: string;
}

export async function fetchAiBookSource(config: AiRequestConfig): Promise<AiResponse> {
  const pageHtml = await fetchPageContent(config.url);

  const userMessage = `网站URL: ${config.url}

页面HTML（前15000字符）:
${pageHtml}`;

  const requestBody = {
    model: config.model,
    messages: [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userMessage }
    ],
    temperature: 0.3,
    max_tokens: 4096
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        throw { type: 'apiError' as AiErrorType, message: 'API Key 无效或已过期' };
      }
      if (response.status === 429) {
        throw { type: 'apiError' as AiErrorType, message: '模型配额不足，请稍后重试' };
      }
      throw { type: 'apiError' as AiErrorType, message: `API 请求失败 (${response.status}): ${errorBody.slice(0, 200)}` };
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const rawText = data.choices?.[0]?.message?.content?.trim() || '';

    if (!rawText) {
      throw { type: 'parseError' as AiErrorType, message: 'AI 返回空响应' };
    }

    const bookSource = parseAiResponse(rawText);
    return { bookSource, rawText };
  } catch (e) {
    clearTimeout(timeoutId);
    if (e && typeof e === 'object' && 'type' in e) throw e;
    if (config.apiKey.trim() === '') {
      throw { type: 'noApiKey' as AiErrorType, message: '请先在设置中配置 AI API Key' };
    }
    throw { type: 'apiError' as AiErrorType, message: `AI 调用失败: ${String(e).slice(0, 200)}` };
  }
}

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw { type: 'fetchFailed' as AiErrorType, message: `无法获取页面 (${response.status})` };
    }

    const html = await response.text();
    return html.slice(0, 15000);
  } catch (e) {
    if (e && typeof e === 'object' && 'type' in e) throw e;
    throw { type: 'fetchFailed' as AiErrorType, message: `页面爬取失败: ${String(e).slice(0, 200)}` };
  }
}

export function parseAiResponse(rawText: string): Record<string, string> {
  let jsonStr = rawText.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(jsonStr) as Record<string, string>;
  } catch {
    return { _raw: jsonStr };
  }
}

export function getAiErrorMessage(type: AiErrorType): string {
  switch (type) {
    case 'noApiKey': return '请先在设置中配置 AI API Key';
    case 'fetchFailed': return '无法获取页面内容，请检查 URL 是否正确';
    case 'apiError': return 'AI 调用失败，请检查 API Key 和模型配置';
    case 'parseError': return 'AI 返回格式异常，请重试';
    case 'timeout': return '请求超时，请检查网络后重试';
    default: return '未知错误';
  }
}
