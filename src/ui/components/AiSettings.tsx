import React, { useState, useEffect } from 'react';
import { useStore } from '@store';
import { Button, Input } from '@ui/components/common';
import './AiSettings.css';

const STORAGE_KEY = 'ai_settings';

interface StoredAiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function AiSettings() {
  const { settings, setSettings } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setApiKey(settings.aiApiKey || '');
    setBaseUrl(settings.aiBaseUrl || 'https://api.deepseek.com/v1');
    setModel(settings.aiModel || 'deepseek-chat');
  }, [settings.aiApiKey, settings.aiBaseUrl, settings.aiModel]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const stored = result[STORAGE_KEY] as StoredAiSettings | undefined;
        if (stored) {
          setApiKey(stored.apiKey || '');
          setBaseUrl(stored.baseUrl || 'https://api.deepseek.com/v1');
          setModel(stored.model || 'deepseek-chat');
        }
      });
    }
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      setSettings({ aiApiKey: apiKey, aiBaseUrl: baseUrl, aiModel: model });
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [STORAGE_KEY]: { apiKey, baseUrl, model } });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const maskedKey = apiKey ? '\u2022'.repeat(Math.min(apiKey.length, 16)) : '';

  return (
    <div className="ai-settings">
      <h3 className="ai-settings__title">AI 设置</h3>

      <div className="ai-settings__field">
        <label className="ai-settings__label">API Key</label>
        <div className="ai-settings__key-row">
          <Input
            type={showKey ? 'text' : 'password'}
            value={showKey ? apiKey : maskedKey}
            placeholder="输入 API Key"
            onChange={e => setApiKey(e.target.value)}
            className="ai-settings__input"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowKey(!showKey)}
            className="ai-settings__toggle"
          >
            {showKey ? '隐藏' : '显示'}
          </Button>
        </div>
      </div>

      <div className="ai-settings__field">
        <label className="ai-settings__label">Base URL</label>
        <Input
          type="text"
          value={baseUrl}
          placeholder="https://api.deepseek.com/v1"
          onChange={e => setBaseUrl(e.target.value)}
          className="ai-settings__input"
        />
      </div>

      <div className="ai-settings__field">
        <label className="ai-settings__label">模型名</label>
        <Input
          type="text"
          value={model}
          placeholder="deepseek-chat"
          onChange={e => setModel(e.target.value)}
          className="ai-settings__input"
        />
      </div>

      <Button
        variant="primary"
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className="ai-settings__save"
      >
        {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存设置'}
      </Button>

      <p className="ai-settings__hint">
        API Key 仅本地存储，不上传到任何中间服务器
      </p>
    </div>
  );
}
