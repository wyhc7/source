import React, { useState, useEffect } from 'react';
import { useStore } from '@store';
import { Button, Input } from '@ui/components/common';
import { fetchAiBookSource } from '@core/ai-fetch';
import type { AiError } from '@core/ai-fetch';
import type { AiGenerateResult, AiGenerateStatus } from '@core/ai-parser';
import './AiPanel.css';

const FIELD_LABELS: Record<string, string> = {
  name: '书源名称',
  url: '基础URL',
  searchUrl: '搜索URL',
  ruleSearch: '搜索规则',
  ruleBookInfo: '书籍信息规则',
  ruleToc: '目录规则',
  ruleContent: '正文规则',
  _raw: '原始响应'
};

export function AiPanel() {
  const { settings, activeRuleType, updateField, setCurrentStep } = useStore();
  const [result, setResult] = useState<AiGenerateResult>({
    status: 'idle',
    bookSource: null,
    rawResponse: null,
    error: null
  });
  const [url, setUrl] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setUrl(tabs[0].url);
        }
      });
    }
  }, []);

  const handleGenerate = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setResult({ status: 'fetching', bookSource: null, rawResponse: null, error: null });

    try {
      setResult(prev => ({ ...prev, status: 'generating' }));
      const response = await fetchAiBookSource({
        url: trimmedUrl,
        apiKey: settings.aiApiKey,
        baseUrl: settings.aiBaseUrl,
        model: settings.aiModel
      });
      setResult({
        status: 'success',
        bookSource: response.bookSource,
        rawResponse: response.rawText,
        error: null
      });
    } catch (e) {
      const error = e as AiError;
      setResult({
        status: 'error',
        bookSource: null,
        rawResponse: null,
        error
      });
    }
  };

  const handleApply = () => {
    if (!result.bookSource) return;
    const source = result.bookSource;
    const fieldsToApply: Record<string, { selector: string; useJsIndex: boolean; webView: boolean }> = {};

    if (source['searchUrl']) fieldsToApply['searchUrl'] = { selector: source['searchUrl'], useJsIndex: false, webView: false };
    if (source['ruleSearch']) fieldsToApply['ruleSearch'] = { selector: source['ruleSearch'], useJsIndex: false, webView: false };
    if (source['ruleBookInfo']) fieldsToApply['ruleBookInfo'] = { selector: source['ruleBookInfo'], useJsIndex: false, webView: false };
    if (source['ruleToc']) fieldsToApply['ruleToc'] = { selector: source['ruleToc'], useJsIndex: false, webView: false };
    if (source['ruleContent']) fieldsToApply['ruleContent'] = { selector: source['ruleContent'], useJsIndex: false, webView: false };

    Object.entries(fieldsToApply).forEach(([key, value]) => {
      updateField(activeRuleType, key, value);
    });

    setCurrentStep(activeRuleType, 0);
    setResult(prev => ({ ...prev, status: 'success' }));
  };

  const handleCopyJson = () => {
    if (!result.bookSource) return;
    navigator.clipboard.writeText(JSON.stringify(result.bookSource, null, 2));
  };

  const handleEditField = (key: string) => {
    setEditingField(key);
    setEditValue(result.bookSource?.[key] || '');
  };

  const handleSaveEdit = () => {
    if (!editingField || !result.bookSource) return;
    const updated = { ...result.bookSource, [editingField]: editValue };
    setResult(prev => ({ ...prev, bookSource: updated }));
    setEditingField(null);
  };

  const getStatusText = (status: AiGenerateStatus) => {
    switch (status) {
      case 'fetching': return '正在爬取页面内容...';
      case 'generating': return '正在分析页面结构，生成书源规则...';
      default: return '';
    }
  };

  const hasApiKey = settings.aiApiKey.trim() !== '';

  return (
    <div className="ai-panel">
      <div className="ai-panel__input-section">
        <Input
          type="text"
          value={url}
          placeholder="输入小说网站 URL，如 https://www.example.com"
          onChange={e => setUrl(e.target.value)}
          className="ai-panel__url-input"
          disabled={result.status === 'fetching' || result.status === 'generating'}
        />
        <div className="ai-panel__actions">
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!hasApiKey || !url.trim() || result.status === 'fetching' || result.status === 'generating'}
            className="ai-panel__generate-btn"
          >
            {result.status === 'fetching' || result.status === 'generating' ? '处理中...' : 'AI 生成书源'}
          </Button>
          {!hasApiKey && (
            <span className="ai-panel__no-key-hint">请先在设置中配置 AI API Key</span>
          )}
        </div>
      </div>

      {(result.status === 'fetching' || result.status === 'generating') && (
        <div className="ai-panel__loading">
          <div className="ai-panel__spinner" />
          <span>{getStatusText(result.status)}</span>
        </div>
      )}

      {result.status === 'error' && result.error && (
        <div className="ai-panel__error">
          <span className="ai-panel__error-icon">⚠️</span>
          <span>{result.error.message}</span>
        </div>
      )}

      {result.status === 'success' && result.bookSource && (
        <div className="ai-panel__result">
          <div className="ai-panel__result-header">
            <span className="ai-panel__result-title">✅ 生成成功</span>
            <div className="ai-panel__result-actions">
              <Button variant="primary" size="sm" onClick={handleApply}>应用到规则页</Button>
              <Button variant="secondary" size="sm" onClick={handleCopyJson}>复制 JSON</Button>
            </div>
          </div>

          <div className="ai-panel__fields">
            {Object.entries(result.bookSource).map(([key, value]) => (
              <div key={key} className="ai-panel__field">
                <div className="ai-panel__field-header">
                  <span className="ai-panel__field-label">{FIELD_LABELS[key] || key}</span>
                  {editingField === key ? (
                    <div className="ai-panel__field-edit">
                      <Input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="ai-panel__field-edit-input"
                      />
                      <Button variant="primary" size="sm" onClick={handleSaveEdit}>OK</Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditingField(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleEditField(key)}>Edit</Button>
                  )}
                </div>
                <pre className="ai-panel__field-value">{value || <span className="ai-panel__field-empty">（未确定）</span>}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
