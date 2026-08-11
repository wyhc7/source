import React from 'react';
import { useStore } from '@store';
import { Popup } from '@ui/pages/Popup';
import { ExploreCardGrid } from '@ui/components/ExploreCardGrid';
import { DebugPanel } from '@ui/components/DebugPanel';
import { AiPanel } from '@ui/components/AiPanel';
import { AiSettings } from '@ui/components/AiSettings';
import { getI18nAPI } from '@platform/browser-api';
import './SidePanel.css';

export type SidePanelMode = 'rules' | 'ai-generate' | 'ai-settings';

export function SidePanel() {
  const { activeRuleType, setActiveRuleType } = useStore();
  const [mode, setMode] = React.useState<SidePanelMode>('rules');
  const i18n = getI18nAPI();

  const handleAiMode = (m: SidePanelMode) => {
    setMode(m);
    if (m === 'rules') {
      setActiveRuleType('search');
    }
  };

  return (
    <div className="sidepanel">
      <div className="sidepanel__header">
        <h1 className="sidepanel__title">{i18n.getMessage('extName') || 'Legado Source Generator'}</h1>
        <div className="sidepanel__mode-bar">
          <button
            className={`sidepanel__mode-btn ${mode === 'ai-generate' ? 'sidepanel__mode-btn--active' : ''}`}
            onClick={() => handleAiMode('ai-generate')}
          >
            AI 生成
          </button>
          <button
            className={`sidepanel__mode-btn ${mode === 'ai-settings' ? 'sidepanel__mode-btn--active' : ''}`}
            onClick={() => handleAiMode('ai-settings')}
          >
            AI 设置
          </button>
          <button
            className={`sidepanel__mode-btn ${mode === 'rules' ? 'sidepanel__mode-btn--active' : ''}`}
            onClick={() => handleAiMode('rules')}
          >
            规则
          </button>
        </div>
      </div>

      <div className="sidepanel__content">
        {mode === 'ai-generate' && <AiPanel />}
        {mode === 'ai-settings' && <AiSettings />}
        {mode === 'rules' && activeRuleType === 'explore' && <ExploreCardGrid />}
        {mode === 'rules' && activeRuleType === 'debug' && <DebugPanel />}
        {mode === 'rules' && activeRuleType !== 'explore' && activeRuleType !== 'debug' && <Popup />}
      </div>
    </div>
  );
}
