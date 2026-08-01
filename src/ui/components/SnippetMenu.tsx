import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@store';
import { Button, Input, Modal } from '@ui/components/common';
import { getPresetSnippets, loadCustomSnippets, addCustomSnippet, removeCustomSnippet } from '@core/quick-snippet';
import type { Snippet } from '@lib';
import './SnippetMenu.css';

interface SnippetMenuProps {
  onInsert: (value: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export function SnippetMenu({ onInsert, triggerRef }: SnippetMenuProps) {
  const { snippets: storeSnippets, setSnippets } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSnippet, setNewSnippet] = useState({ label: '', value: '' });
  const menuRef = useRef<HTMLDivElement>(null);
  const presetSnippets = getPresetSnippets();
  const customSnippets = loadCustomSnippets();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [triggerRef]);

  const handleInsert = (value: string) => {
    onInsert(value);
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    if (!newSnippet.label || !newSnippet.value) return;
    const snippet: Snippet = {
      id: `custom-${Date.now()}`,
      label: newSnippet.label,
      value: newSnippet.value
    };
    addCustomSnippet(snippet);
    setSnippets([...storeSnippets, snippet]);
    setNewSnippet({ label: '', value: '' });
    setShowAddModal(false);
  };

  const handleRemoveCustom = (id: string) => {
    removeCustomSnippet(id);
    setSnippets(storeSnippets.filter(s => s.id !== id));
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="snippet-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="插入片段"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        ⌄
      </button>

      {isOpen && (
        <div ref={menuRef} className="snippet-menu" role="menu">
          <div className="snippet-menu__section">
            <div className="snippet-menu__section-title">预设片段</div>
            {presetSnippets.map(snippet => (
              <button
                key={snippet.id}
                type="button"
                className="snippet-menu__item"
                role="menuitem"
                onClick={() => handleInsert(snippet.value)}
              >
                <span className="snippet-menu__label">{snippet.label}</span>
                <span className="snippet-menu__value">{snippet.value}</span>
              </button>
            ))}
          </div>

          {customSnippets.length > 0 && (
            <div className="snippet-menu__section">
              <div className="snippet-menu__section-title">自定义片段</div>
              {customSnippets.map(snippet => (
                <div key={snippet.id} className="snippet-menu__item snippet-menu__item--custom">
                  <button
                    type="button"
                    className="snippet-menu__btn"
                    role="menuitem"
                    onClick={() => handleInsert(snippet.value)}
                  >
                    <span className="snippet-menu__label">{snippet.label}</span>
                    <span className="snippet-menu__value">{snippet.value}</span>
                  </button>
                  <button
                    type="button"
                    className="snippet-menu__delete"
                    onClick={e => { e.stopPropagation(); handleRemoveCustom(snippet.id); }}
                    aria-label={`删除 ${snippet.label}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="snippet-menu__footer">
            <button type="button" className="snippet-menu__add-btn" onClick={() => setShowAddModal(true)}>
              + 新建片段
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <Modal isOpen={true} onClose={() => setShowAddModal(false)} title="新建自定义片段" size="sm">
          <Input
            label="标签"
            value={newSnippet.label}
            onChange={e => setNewSnippet(prev => ({ ...prev, label: e.target.value }))}
            placeholder="我的片段"
            autoFocus
          />
          <Input
            label="值"
            value={newSnippet.value}
            onChange={e => setNewSnippet(prev => ({ ...prev, value: e.target.value }))}
            placeholder="@href"
          />
          <div className="modal__footer">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={handleAddCustom}>保存</Button>
          </div>
        </Modal>
      )}
    </>
  );
}