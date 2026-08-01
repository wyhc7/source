import React, { useState } from 'react';
import { Button, Input, Modal } from '@ui/components/common';
import { TreeNode } from '@ui/components/common/TreeNode';
import { parseCategoryTree, flattenCategoryTree } from '@core/import-export';
import type { CategoryNode } from '@lib';
import './CategoryTree.css';

interface CategoryTreeProps {
  category: string;
  onSave: (category: string) => void;
  onCancel: () => void;
}

export function CategoryTree({ category, onSave, onCancel }: CategoryTreeProps) {
  const [tree, setTree] = useState<CategoryNode>(() => parseCategoryTree(category));
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryPath, setNewCategoryPath] = useState('');

  const handleSelect = (path: string) => {
    setSelectedPath(path);
  };

  const handleAddCategory = () => {
    if (!newCategoryPath.trim()) return;
    const parts = newCategoryPath.split('/').map(p => p.trim()).filter(Boolean);
    let current = tree;
    for (const part of parts) {
      if (!current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map() });
      }
      current = current.children.get(part)!;
    }
    setTree({ ...tree });
    setNewCategoryPath('');
    setShowAddModal(false);
  };

  const handleSave = () => {
    const paths = flattenCategoryTree(tree);
    onSave(paths.join('/'));
    onCancel();
  };

  return (
    <div className="category-tree">
      <div className="category-tree__toolbar">
        <h3 className="category-tree__title">分类树</h3>
        <div className="category-tree__actions">
          <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>新增</Button>
          <Button variant="secondary" size="sm" onClick={() => { setTree({ name: '', children: new Map() }); }}>清空</Button>
        </div>
      </div>

      <div className="category-tree__content">
        {tree.children.size === 0 ? (
          <div className="category-tree__empty">
            <p>暂无分类，点击"新增"添加</p>
          </div>
        ) : (
          <div className="category-tree__tree">
            {Array.from(tree.children.values()).map(child => (
              <TreeNode
                key={child.name}
                node={child}
                onSelect={handleSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>

      <div className="category-tree__footer">
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button variant="primary" onClick={handleSave}>保存</Button>
      </div>

      {showAddModal && (
        <Modal isOpen={true} onClose={() => setShowAddModal(false)} title="新增分类" size="sm">
          <Input
            label="分类路径"
            value={newCategoryPath}
            onChange={e => setNewCategoryPath(e.target.value)}
            placeholder="小说/玄幻/东方玄幻"
            helperText="使用 / 分隔层级"
            autoFocus
          />
          <div className="modal__footer">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={handleAddCategory}>添加</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}