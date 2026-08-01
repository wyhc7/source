import React, { useState, useCallback } from 'react';
import { useStore } from '@store';
import { Button, Modal, Input, useToast } from '@ui/components/common';
import { ExploreCard } from './ExploreCard';
import { deserializeExploreCards, serializeExploreCards, applyBatchReplace, applyCategoryPaging } from '@core/explore-url';
import type { ExploreCard as ExploreCardType } from '@lib';
import './ExploreCardGrid.css';

export function ExploreCardGrid() {
  const { rules, reorderExploreCards, addExploreCard, updateExploreCard, removeExploreCard } = useStore();
  const cards = rules.explore.exploreCards;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchReplaceModal, setShowBatchReplaceModal] = useState(false);
  const [showCategoryPagingModal, setShowCategoryPagingModal] = useState(false);
  const [batchReplace, setBatchReplace] = useState({ pattern: '', replacement: '' });
  const [categoryPagingTemplate, setCategoryPagingTemplate] = useState('');
  const { show: showToast } = useToast();

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      const newCards = [...cards];
      const removed = newCards.splice(draggedIndex, 1)[0];
      if (removed) {
        newCards.splice(index, 0, removed);
        reorderExploreCards(newCards);
      }
    }
    setDraggedIndex(null);
  }, [draggedIndex, cards, reorderExploreCards]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleAddCard = (newCard: ExploreCardType) => {
    addExploreCard(newCard);
    setShowAddModal(false);
    showToast('探索卡片已添加', 'success');
  };

  const handleUpdateCard = (index: number, updatedCard: Partial<ExploreCardType>) => {
    updateExploreCard(index, updatedCard);
    showToast('探索卡片已更新', 'success');
  };

  const handleRemoveCard = (index: number) => {
    if (window.confirm('确定要删除这个探索卡片吗？')) {
      removeExploreCard(index);
      showToast('探索卡片已删除', 'success');
    }
  };

  const handleBatchReplace = () => {
    if (!batchReplace.pattern) {
      showToast('请输入要替换的模式', 'warning');
      return;
    }
    const newCards = applyBatchReplace(cards, batchReplace.pattern, batchReplace.replacement);
    newCards.forEach((card, index) => {
      updateExploreCard(index, card);
    });
    setShowBatchReplaceModal(false);
    showToast(`已批量替换 ${newCards.length} 个卡片`, 'success');
  };

  const handleCategoryPaging = () => {
    if (!categoryPagingTemplate) {
      showToast('请输入分页模板', 'warning');
      return;
    }
    const newCards = applyCategoryPaging(cards, categoryPagingTemplate);
    newCards.forEach((card, index) => {
      updateExploreCard(index, card);
    });
    setShowCategoryPagingModal(false);
    showToast(`已应用分页模板到 ${newCards.length} 个卡片`, 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedCards = deserializeExploreCards(content);
        importedCards.forEach(card => addExploreCard(card));
        showToast(`已导入 ${importedCards.length} 个探索卡片`, 'success');
      } catch (err) {
        showToast('导入失败：文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const content = serializeExploreCards(cards);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'explore-cards.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('探索卡片已导出', 'success');
  };

  return (
    <div className="explore-card-grid">
      <div className="explore-card-grid__toolbar">
        <h3>探索卡片列表</h3>
        <div className="explore-card-grid__actions">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>添加卡片</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowBatchReplaceModal(true)}>批量替换</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowCategoryPagingModal(true)}>分类分页</Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>导出</Button>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
            id="import-explore-cards"
            ref={(el) => el?.click()}
          />
          <label htmlFor="import-explore-cards">
            <Button variant="secondary" size="sm">导入</Button>
          </label>
        </div>
      </div>

      <div className="explore-card-grid__list">
        {cards.map((card, index) => (
          <ExploreCard
            key={card.url + index}
            card={card}
            index={index}
            onUpdate={handleUpdateCard}
            onRemove={handleRemoveCard}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
        {cards.length === 0 && (
          <div className="explore-card-grid__empty">暂无探索卡片，点击「添加卡片」创建</div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="添加探索卡片" size="lg">
        <ExploreCard
          card={{ name: '', url: '', category: {}, pageTemplate: '', enabled: true }}
          index={cards.length}
          onUpdate={(idx, updated) => handleAddCard({ ...updated, id: Date.now().toString() } as ExploreCardType)}
          onRemove={() => {}}
          onDragStart={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
          onDragEnd={() => {}}
        />
      </Modal>

      <Modal isOpen={showBatchReplaceModal} onClose={() => setShowBatchReplaceModal(false)} title="批量替换" size="md">
        <div className="modal-form">
          <Input
            label="查找模式 (正则)"
            value={batchReplace.pattern}
            onChange={e => setBatchReplace({ ...batchReplace, pattern: e.target.value })}
            placeholder="例如: /book/"
          />
          <Input
            label="替换为"
            value={batchReplace.replacement}
            onChange={e => setBatchReplace({ ...batchReplace, replacement: e.target.value })}
            placeholder="例如: /novel/"
          />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowBatchReplaceModal(false)}>取消</Button>
          <Button variant="primary" onClick={handleBatchReplace}>执行替换</Button>
        </div>
      </Modal>

      <Modal isOpen={showCategoryPagingModal} onClose={() => setShowCategoryPagingModal(false)} title="分类分页" size="md">
        <div className="modal-form">
          <Input
            label="分页 URL 模板"
            value={categoryPagingTemplate}
            onChange={e => setCategoryPagingTemplate(e.target.value)}
            placeholder="例如: /category/{page}.html"
          />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowCategoryPagingModal(false)}>取消</Button>
          <Button variant="primary" onClick={handleCategoryPaging}>应用模板</Button>
        </div>
      </Modal>
    </div>
  );
}