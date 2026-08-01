import React, { useState } from 'react';
import { Button, Input, Modal, Tooltip } from '@ui/components/common';
import { DragHandle } from '@ui/components/common/DragHandle';
import type { ExploreCard } from '@lib';
import './ExploreCard.css';

interface ExploreCardProps {
  card: ExploreCard;
  index: number;
  onUpdate: (index: number, updates: Partial<ExploreCard>) => void;
  onRemove: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function ExploreCard({
  card,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: ExploreCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    url: card.url,
    name: card.name,
    category: JSON.stringify(card.category, null, 2),
    pageTemplate: card.pageTemplate
  });
  const [showBatchReplace, setShowBatchReplace] = useState(false);
  const [batchReplace, setBatchReplace] = useState({ pattern: '', replacement: '' });
  const [showCategoryPaging, setShowCategoryPaging] = useState(false);
  const [categoryPagingTemplate, setCategoryPagingTemplate] = useState('');

const CATEGORY_PLACEHOLDER = '{"分类名": "值"}';
const HELPER_TEXT_CATEGORY = 'JSON 格式，如 {"分类": "小说", "来源": "网站"}';

const handleSave = () => {
    try {
      const category = JSON.parse(editForm.category);
      onUpdate(index, {
        url: editForm.url,
        name: editForm.name,
        category,
        pageTemplate: editForm.pageTemplate
      });
      setIsEditing(false);
    } catch (e) {
      alert('分类 JSON 格式错误');
    }
  };

  const handleBatchReplace = () => {
    if (!batchReplace.pattern) return;
    // This would need to be handled at the grid level for all cards
    setShowBatchReplace(false);
    setBatchReplace({ pattern: '', replacement: '' });
  };

  const handleCategoryPaging = () => {
    if (!categoryPagingTemplate) return;
    // This would need to be handled at the grid level for all cards
    setShowCategoryPaging(false);
    setCategoryPagingTemplate('');
  };

  const categoryStr = Object.entries(card.category)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ') || '无';

  return (
    <div
      className={`explore-card ${isEditing ? 'explore-card--editing' : ''}`}
      draggable
      onDragStart={e => onDragStart(e, index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={e => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="explore-card__drag">
        <DragHandle />
      </div>

      <div className="explore-card__content">
        <div className="explore-card__main">
          <div className="explore-card__url" title={card.url}>{card.url}</div>
          <div className="explore-card__meta">
            <span className="explore-card__name">{card.name || '未命名'}</span>
            <span className="explore-card__category">{categoryStr}</span>
            {card.pageTemplate && (
              <span className="explore-card__template">模板: {card.pageTemplate}</span>
            )}
          </div>
        </div>

        <div className="explore-card__actions">
          <label className="explore-card__toggle">
            <input
              type="checkbox"
              checked={card.enabled}
              onChange={e => onUpdate(index, { enabled: e.target.checked })}
            />
            <span>启用</span>
          </label>
          <Tooltip content="编辑" position="top">
            <button className="explore-card__btn" onClick={() => { setEditForm({ url: card.url, name: card.name, category: JSON.stringify(card.category, null, 2), pageTemplate: card.pageTemplate }); setIsEditing(true); }} aria-label="编辑">✎</button>
          </Tooltip>
          <Tooltip content="批量替换" position="top">
            <button className="explore-card__btn" onClick={() => setShowBatchReplace(true)} aria-label="批量替换">⌄</button>
          </Tooltip>
          <Tooltip content="分类翻页" position="top">
            <button className="explore-card__btn" onClick={() => setShowCategoryPaging(true)} aria-label="分类翻页">⟳</button>
          </Tooltip>
          <Tooltip content="删除" position="top">
            <button className="explore-card__btn explore-card__btn--danger" onClick={() => onRemove(index)} aria-label="删除">✕</button>
          </Tooltip>
        </div>
      </div>

      {isEditing && (
        <div className="explore-card__edit-form">
          <Input
            label="URL"
            value={editForm.url}
            onChange={e => setEditForm(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/list?page=1"
          />
          <Input
            label="名称"
            value={editForm.name}
            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="分类列表"
          />
          <Input
            label="分类"
            value={editForm.category}
            onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
            placeholder={CATEGORY_PLACEHOLDER}
            helperText={HELPER_TEXT_CATEGORY}
          />
          <Input
            label="翻页模板"
            value={editForm.pageTemplate}
            onChange={e => setEditForm(prev => ({ ...prev, pageTemplate: e.target.value }))}
            placeholder="page=页码"
            helperText="使用 '页码' 作为占位符"
          />
          <div className="explore-card__edit-actions">
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>保存</Button>
          </div>
        </div>
      )}

      {showBatchReplace && (
        <Modal isOpen={true} onClose={() => setShowBatchReplace(false)} title="批量替换 URL" size="sm">
          <Input
            label="正则模式"
            value={batchReplace.pattern}
            onChange={e => setBatchReplace(prev => ({ ...prev, pattern: e.target.value }))}
            placeholder="分类|category"
          />
          <Input
            label="替换为"
            value={batchReplace.replacement}
            onChange={e => setBatchReplace(prev => ({ ...prev, replacement: e.target.value }))}
            placeholder="category"
          />
          <div className="modal__footer">
            <Button variant="secondary" size="sm" onClick={() => setShowBatchReplace(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={handleBatchReplace}>应用</Button>
          </div>
        </Modal>
      )}

      {showCategoryPaging && (
        <Modal isOpen={true} onClose={() => setShowCategoryPaging(false)} title="分类翻页模板" size="sm">
          <Input
            label="模板"
            value={categoryPagingTemplate}
            onChange={e => setCategoryPagingTemplate(e.target.value)}
            placeholder="page=页码"
            helperText="使用 '页码' 作为占位符，将自动替换 URL 中的分类参数"
          />
          <div className="modal__footer">
            <Button variant="secondary" size="sm" onClick={() => setShowCategoryPaging(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={handleCategoryPaging}>应用</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}