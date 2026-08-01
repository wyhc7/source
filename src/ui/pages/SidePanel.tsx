import React from 'react';
import { useStore } from '@store';
import { Popup } from '@ui/pages/Popup';
import { ExploreCardGrid } from '@ui/components/ExploreCardGrid';
import { DebugPanel } from '@ui/components/DebugPanel';
import { getI18nAPI } from '@platform/browser-api';
import './SidePanel.css';

export function SidePanel() {
  const { activeRuleType, setActiveRuleType } = useStore();
  const i18n = getI18nAPI();

  const RULE_TABS = [
    { key: 'search', label: '搜索规则' },
    { key: 'bookInfo', label: '书籍信息' },
    { key: 'toc', label: '目录规则' },
    { key: 'content', label: '内容规则' },
    { key: 'explore', label: '探索 URL' },
    { key: 'debug', label: '调试' }
  ];

  const handleTabChange = (type: string) => {
    setActiveRuleType(type as any);
  };

  return (
    <div className="sidepanel">
      <div className="sidepanel__header">
        <h1 className="sidepanel__title">{i18n.getMessage('extName') || 'Legado Source Generator'}</h1>
        <div className="sidepanel__tabs">
          {RULE_TABS.map(tab => (
            <button
              key={tab.key}
              className={`sidepanel__tab ${activeRuleType === tab.key ? 'sidepanel__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidepanel__content">
        {activeRuleType === 'explore' && <ExploreCardGrid />}
        {activeRuleType === 'debug' && <DebugPanel />}
        {activeRuleType !== 'explore' && activeRuleType !== 'debug' && <Popup />}
      </div>
    </div>
  );
}