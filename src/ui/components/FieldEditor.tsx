import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@store';
import { Input, Button } from '@ui/components/common';
import { countMatches } from '@core/selector-generator';
import { buildNativeIndexRule, buildJsIndexRule, buildTextIndexedRule } from '@core/indexed-rule';
import { getPresetSnippets, loadCustomSnippets } from '@core/quick-snippet';
import { getFieldLabel } from '@ui/field-labels';
import type { RuleType, IndexConfig } from '@lib';
import './FieldEditor.css';

const FIELD_KEYS = [
  { key: 'bookUrl', label: '书籍链接', isLink: true },
  { key: 'chapterUrl', label: '章节链接', isLink: true },
  { key: 'tocUrl', label: '目录链接', isLink: true },
  { key: 'nextTocUrl', label: '下一页目录链接', isLink: true },
  { key: 'nextContentUrl', label: '下一页内容链接', isLink: true },
  { key: 'coverUrl', label: '封面图片', isLink: false },
  { key: 'author', label: '作者', isLink: false },
  { key: 'intro', label: '简介', isLink: false },
  { key: 'kind', label: '分类', isLink: false },
  { key: 'lastChapter', label: '最新章节', isLink: false },
  { key: 'updateTime', label: '更新时间', isLink: false },
  { key: 'wordCount', label: '字数', isLink: false },
  { key: 'searchUrl', label: '搜索链接', isLink: true },
  { key: 'method', label: '请求方式', isLink: false },
  { key: 'postBody', label: 'POST 请求体', isLink: false },
  { key: 'charset', label: '字符编码', isLink: false },
  { key: 'header', label: '请求头', isLink: false }
];

interface FieldEditorProps {
  ruleType: RuleType;
  fieldKey: string;
  onClose?: () => void;
}

export function FieldEditor({ ruleType, fieldKey, onClose }: FieldEditorProps) {
  const {
    updateField,
    setFieldState,
    getRuleState
  } = useStore();

  const ruleState = getRuleState(ruleType);
  const fieldData = ruleState.fields[fieldKey] || { selector: '', useJsIndex: false, webView: false, listIndex: {} };
  const fieldState = ruleState.fieldStates[fieldKey] || 'pending';
  const isLinkField = FIELD_KEYS.find(f => f.key === fieldKey)?.isLink ?? false;
  const isListField = !!ruleState.bookListSelector && fieldState !== 'picking';

  const [selector, setSelector] = useState(fieldData.selector);
  const [useJsIndex, setUseJsIndex] = useState(fieldData.useJsIndex);
  const [webView, setWebView] = useState(fieldData.webView);
  const [listIndex, setListIndex] = useState<IndexConfig>(fieldData.listIndex || {});
  const [matchedCount, setMatchedCount] = useState(0);
  const [showSnippetMenu, setShowSnippetMenu] = useState(false);
  const snippetMenuRef = useRef<HTMLDivElement>(null);
  const selectorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selector) {
      const count = countMatches(selector);
      setMatchedCount(count);
    } else {
      setMatchedCount(0);
    }
  }, [selector]);

  const handleSelectorChange = (value: string) => {
    setSelector(value);
    updateField(ruleType, fieldKey, { selector: value });
  };

  const handlePickElement = () => {
    setFieldState(ruleType, fieldKey, 'picking');
    if (typeof window !== 'undefined' && (window as any).__LEGADO_PICKER__) {
      (window as any).__LEGADO_PICKER__.startPick((sel: string) => {
        handleSelectorChange(sel);
        setFieldState(ruleType, fieldKey, 'selected');
        onClose?.();
      });
    }
    onClose?.();
  };

  const handleIndexChange = (key: keyof IndexConfig, value: string) => {
    const num = value ? parseInt(value, 10) : undefined;
    const next = { ...listIndex, [key]: num };
    setListIndex(next);
    updateField(ruleType, fieldKey, { listIndex: next });
  };

  const buildPreviewRule = () => {
    if (!selector) return '';
    const baseSelector = selector;
    if (isListField) {
      return useJsIndex
        ? buildJsIndexRule(baseSelector, fieldKey, listIndex, { isList: true, fieldKey, useJsIndex: true })
        : buildNativeIndexRule(baseSelector, fieldKey, listIndex, { isList: true, fieldKey, listItemTag: '', useJsIndex: false });
    }
    if (useJsIndex) {
      return buildJsIndexRule(baseSelector, fieldKey, listIndex, { isList: false, fieldKey, useJsIndex: true });
    }
    return buildTextIndexedRule(baseSelector, listIndex, false);
  };

  const presetSnippets = getPresetSnippets();
  const customSnippets = loadCustomSnippets();
  const allSnippets = [...presetSnippets, ...customSnippets];

  const insertSnippet = (value: string) => {
    if (!selectorInputRef.current) return;
    const input = selectorInputRef.current;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const newValue = selector.slice(0, start) + value + selector.slice(end);
    handleSelectorChange(newValue);
    setShowSnippetMenu(false);
    input.focus();
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = start + value.length;
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (snippetMenuRef.current && !snippetMenuRef.current.contains(e.target as Node)) {
        setShowSnippetMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="field-editor">
      <div className="field-editor__header">
        <span className="field-editor__label">{getFieldLabel(fieldKey)}</span>
        <span className={`field-editor__state field-editor__state--${fieldState}`}>
          {fieldState === 'picking' ? '拾取中...' : fieldState === 'selected' ? '已选择' : '未选择'}
        </span>
      </div>

      <div className="field-editor__selector-row">
        <Input
          ref={selectorInputRef}
          value={selector}
          onChange={e => handleSelectorChange(e.target.value)}
          placeholder="点击'选择元素'或手动输入选择器"
          leftIcon={<span className="selector-icon">🔍</span>}
          rightIcon={
            <button
              type="button"
              className="snippet-trigger"
              onClick={() => setShowSnippetMenu(!showSnippetMenu)}
              aria-label="插入片段"
            >
              ⌄
            </button>
          }
        />
        <Button variant="primary" onClick={handlePickElement} size="sm">
          选择元素
        </Button>
      </div>

      {showSnippetMenu && (
        <div ref={snippetMenuRef} className="snippet-menu" role="menu">
          {allSnippets.map(snippet => (
            <button
              key={snippet.id}
              type="button"
              className="snippet-menu__item"
              role="menuitem"
              onClick={() => insertSnippet(snippet.value)}
            >
              <span className="snippet-menu__label">{snippet.label}</span>
              <span className="snippet-menu__value">{snippet.value}</span>
            </button>
          ))}
        </div>
      )}

      <div className="field-editor__options">
        <label className="field-editor__checkbox">
          <input
            type="checkbox"
            checked={useJsIndex}
            onChange={e => { setUseJsIndex(e.target.checked); updateField(ruleType, fieldKey, { useJsIndex: e.target.checked }); }}
          />
          <span>使用 JS 索引模式</span>
        </label>
        {isLinkField && (
          <label className="field-editor__checkbox">
            <input
              type="checkbox"
              checked={webView}
              onChange={e => { setWebView(e.target.checked); updateField(ruleType, fieldKey, { webView: e.target.checked }); }}
            />
            <span>webView (详情页)</span>
          </label>
        )}
      </div>

      {(isListField || !isListField) && (
        <div className="field-editor__index">
          <span className="field-editor__index-label">索引配置:</span>
          <div className="field-editor__index-inputs">
            <Input
              type="number"
              min="0"
              placeholder="起始"
              value={listIndex.start ?? ''}
              onChange={e => handleIndexChange('start', e.target.value)}
              style={{ width: '80px' }}
            />
            <Input
              type="number"
              placeholder="结束"
              value={listIndex.end ?? ''}
              onChange={e => handleIndexChange('end', e.target.value)}
              style={{ width: '80px' }}
            />
            <Input
              type="number"
              min="0"
              placeholder="单值"
              value={listIndex.single ?? ''}
              onChange={e => handleIndexChange('single', e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
          <p className="field-editor__index-hint">
            1-based 闭区间，空值表示不限。列表模式：start/end；单值模式：single。
          </p>
        </div>
      )}

      <div className="field-editor__preview">
        <span className="field-editor__preview-label">生成规则预览:</span>
        <pre className="field-editor__preview-code">{buildPreviewRule() || '(无选择器)'}</pre>
        {matchedCount > 0 && (
          <span className="field-editor__match-count">匹配 {matchedCount} 个元素</span>
        )}
      </div>
    </div>
  );
}