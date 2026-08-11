import React, { useEffect, useState } from 'react';
import { useStore } from '@store';
import { Button, Modal, useToast } from '@ui/components/common';
import { FieldEditor } from '@ui/components/FieldEditor';
import { ExploreCardGrid } from '@ui/components/ExploreCardGrid';
import { CategoryTree } from '@ui/components/CategoryTree';
import { importBookSource } from '@core/import-export';
import { checkForUpdate } from '@core/check-update';
import { AiPanel } from '@ui/components/AiPanel';
import { getI18nAPI } from '@platform/browser-api';
import type { RuleType } from '@lib';
import './Popup.css';

const RULE_TABS: { key: RuleType; label: string }[] = [
  { key: 'search', label: '搜索规则' },
  { key: 'bookInfo', label: '书籍信息' },
  { key: 'toc', label: '目录规则' },
  { key: 'content', label: '内容规则' },
  { key: 'explore', label: '探索 URL' }
];

const BOOK_INFO_FIELDS = ['bookUrl', 'coverUrl', 'author', 'intro', 'kind', 'lastChapter', 'updateTime', 'wordCount'];
const TOC_FIELDS = ['tocUrl', 'nextTocUrl'];
const CONTENT_FIELDS = ['contentUrl', 'nextContentUrl'];
const SEARCH_FIELDS = ['searchUrl', 'method', 'postBody', 'charset', 'header'];

export function Popup() {
  const {
    activeRuleType,
    rules,
    setActiveRuleType,
    setFieldState,
    setBookListSelector,
    setCurrentStep,
    updateField,
    reset,
    exportState
  } = useStore();

  const { show: showToast, ToastContainer } = useToast();
  const i18n = getI18nAPI();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportJson, setExportJson] = useState('');
  const [showCategoryTree, setShowCategoryTree] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [checkUpdateState, setCheckUpdateState] = useState<'idle' | 'checking' | 'ok' | 'update' | 'error'>('idle');
  const [updateVersion, setUpdateVersion] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  const ruleState = rules[activeRuleType];
  const fieldKeys = activeRuleType === 'bookInfo' ? BOOK_INFO_FIELDS :
                    activeRuleType === 'toc' ? TOC_FIELDS :
                    activeRuleType === 'content' ? CONTENT_FIELDS :
                    activeRuleType === 'search' ? SEARCH_FIELDS : [];

  const currentStep = ruleState.currentStep;
  const currentFieldKey = fieldKeys[currentStep];
  const isListScope = activeRuleType !== 'search' && activeRuleType !== 'explore';

  useEffect(() => {
    if (activeRuleType === 'explore') {
      setCurrentStep('explore', 0);
    }
  }, [activeRuleType, setCurrentStep]);

  const handleTabChange = (type: RuleType) => {
    setActiveRuleType(type);
  };

  const handlePickList = () => {
    if (activeRuleType === 'search' || activeRuleType === 'explore') return;
    setFieldState(activeRuleType, 'bookListSelector', 'picking');
    if (typeof window !== 'undefined' && (window as any).__LEGADO_PICKER__) {
      (window as any).__LEGADO_PICKER__.startPick((sel: string) => {
        setBookListSelector(activeRuleType, sel);
        setFieldState(activeRuleType, 'bookListSelector', 'selected');
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep < fieldKeys.length - 1) {
      setCurrentStep(activeRuleType, currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(activeRuleType, currentStep - 1);
    }
  };

  const handleImport = () => {
    try {
      importBookSource(importJson);
      showToast('导入成功', 'success');
      setShowImportModal(false);
      setImportJson('');
    } catch (e) {
      showToast('导入失败：JSON 格式错误', 'error');
    }
  };

  const handleExport = () => {
    const state = exportState();
    setExportJson(state);
    setShowExportModal(true);
  };

  const handleCategoryTree = () => {
    const currentCategory = ruleState.fields?.['category']?.selector || '';
    setCategoryInput(currentCategory);
    setShowCategoryTree(true);
  };

  const handleCategorySave = (category: string) => {
    if (currentFieldKey === 'category' || fieldKeys.includes('category')) {
      updateField(activeRuleType, 'category', { selector: category });
    }
    setShowCategoryTree(false);
  };

  const handleCheckUpdate = async () => {
    setCheckUpdateState('checking');
    const currentVer = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest()?.version) || '1.0.0';
    const result = await checkForUpdate(currentVer);
    if (result.hasUpdate) {
      setCheckUpdateState('update');
      setUpdateVersion(result.latestVersion);
    } else if (result.error) {
      setCheckUpdateState('error');
    } else {
      setCheckUpdateState('ok');
    }
  };

  if (activeRuleType === 'explore') {
    return <ExploreCardGrid />;
  }

  return (
    <div className="popup">
      <ToastContainer />

      <div className="popup__header">
        <h1 className="popup__title">{i18n.getMessage('extName') || 'Legado Source Generator'}</h1>
        <div className="popup__tabs">
          {RULE_TABS.map(tab => (
            <button
              key={tab.key}
              className={`popup__tab ${activeRuleType === tab.key ? 'popup__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="popup__toolbar">
        <div className="popup__toolbar-left">
          {isListScope && (
            <div className="popup__list-selector">
              <span className="popup__list-label">列表选择器:</span>
              {ruleState.bookListSelector ? (
                <span className="popup__list-value">{ruleState.bookListSelector}</span>
              ) : (
                <span className="popup__list-empty">未选择</span>
              )}
              <Button variant="primary" size="sm" onClick={handlePickList}>
                选择列表
              </Button>
            </div>
          )}
        </div>
        <div className="popup__toolbar-right">
          <Button variant="secondary" size="sm" onClick={() => setShowAiPanel(true)}>AI 生成</Button>
          <Button variant="secondary" size="sm" onClick={handleCheckUpdate} disabled={checkUpdateState === 'checking'}>
            {checkUpdateState === 'checking' ? '检查中...' : i18n.getMessage('checkUpdate')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>导入</Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>导出</Button>
          <Button variant="secondary" size="sm" onClick={handleCategoryTree}>分类</Button>
          <Button variant="danger" size="sm" onClick={() => { reset(); showToast('已重置', 'info'); }}>重置</Button>
        </div>
      </div>

      <div className="popup__step-indicator">
        {fieldKeys.map((key, index) => (
          <div key={key} className={`popup__step ${index === currentStep ? 'popup__step--active' : ''} ${ruleState.fieldStates[key] === 'selected' ? 'popup__step--done' : ''}`}>
            <span className="popup__step-number">{index + 1}</span>
            <span className="popup__step-label">{key}</span>
            {ruleState.fieldStates[key] === 'selected' && <span className="popup__step-check">✓</span>}
          </div>
        ))}
      </div>

      <div className="popup__content">
        {currentFieldKey ? (
          <FieldEditor ruleType={activeRuleType} fieldKey={currentFieldKey} />
        ) : (
          <div className="popup__empty">请选择规则类型</div>
        )}
      </div>

      <div className="popup__navigation">
        <Button variant="secondary" size="sm" onClick={handlePrevStep} disabled={currentStep === 0}>上一步</Button>
        <Button variant="primary" size="sm" onClick={handleNextStep} disabled={currentStep === fieldKeys.length - 1}>
          {currentStep === fieldKeys.length - 1 ? '完成' : '下一步'}
        </Button>
      </div>

      <div className="popup__summary">
        <h4>规则汇总</h4>
        <pre>{JSON.stringify({
          bookListSelector: ruleState.bookListSelector,
          fields: Object.fromEntries(Object.entries(ruleState.fields).map(([k, v]) => [k, v.selector]))
        }, null, 2)}</pre>
      </div>

      {showImportModal && (
        <Modal isOpen={true} onClose={() => setShowImportModal(false)} title="导入书源 JSON" size="lg">
          <textarea
            className="popup__json-textarea"
            value={importJson}
            onChange={e => setImportJson(e.target.value)}
            placeholder="粘贴 Legado 书源 JSON..."
            rows={20}
          />
          <div className="modal__footer">
            <Button variant="secondary" size="sm" onClick={() => setShowImportModal(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={handleImport}>导入</Button>
          </div>
        </Modal>
      )}

      {showExportModal && (
        <Modal isOpen={true} onClose={() => setShowExportModal(false)} title="导出书源 JSON" size="lg">
          <textarea
            className="popup__json-textarea"
            value={exportJson}
            onChange={e => setExportJson(e.target.value)}
            readOnly
            rows={20}
          />
          <div className="modal__footer">
            <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(exportJson); showToast('已复制', 'success'); }}>复制</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowExportModal(false)}>关闭</Button>
          </div>
        </Modal>
      )}

      {showCategoryTree && (
        <Modal isOpen={true} onClose={() => setShowCategoryTree(false)} title="分类树编辑" size="md">
          <CategoryTree category={categoryInput} onSave={handleCategorySave} onCancel={() => setShowCategoryTree(false)} />
        </Modal>
      )}

      {showAiPanel && (
        <Modal isOpen={true} onClose={() => setShowAiPanel(false)} title="AI 书源生成" size="lg">
          <AiPanel />
        </Modal>
      )}

      {checkUpdateState !== 'idle' && checkUpdateState !== 'checking' && checkUpdateState !== 'error' && (
        <div className="popup__update-banner popup__update-banner--ok">
          {checkUpdateState === 'update'
            ? `${i18n.getMessage('newVersionAvailable', [updateVersion])}`
            : i18n.getMessage('noUpdate')}
        </div>
      )}
      {checkUpdateState === 'error' && (
        <div className="popup__update-banner popup__update-banner--error">
          {i18n.getMessage('checkFailed')}
        </div>
      )}
    </div>
  );
}
