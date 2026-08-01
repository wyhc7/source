import React, { useState } from 'react';
import { Collapse } from './Collapse';
import type { CategoryNode } from '@lib';
import './TreeNode.css';

export interface TreeNodeProps {
  node: CategoryNode;
  level?: number;
  onSelect?: (path: string) => void;
  selectedPath?: string;
  showCheckbox?: boolean;
  checkedPaths?: Set<string>;
  onCheckChange?: (path: string, checked: boolean) => void;
}

function getFullPath(node: CategoryNode, prefix = ''): string {
  return prefix ? `${prefix}/${node.name}` : node.name;
}

function collectPaths(node: CategoryNode, prefix = '', result: string[] = []): string[] {
  const path = getFullPath(node, prefix);
  if (node.children.size === 0) {
    result.push(path);
  } else {
    for (const child of node.children.values()) {
      collectPaths(child, path, result);
    }
  }
  return result;
}

export function TreeNode({
  node,
  level = 0,
  onSelect,
  selectedPath,
  showCheckbox = false,
  checkedPaths = new Set(),
  onCheckChange
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(node.children.size > 0 && level < 2);
  const fullPath = getFullPath(node, '');
  const isSelected = selectedPath === fullPath;
  const isChecked = checkedPaths.has(fullPath);
  const allChildPaths = collectPaths(node, '');
  const isIndeterminate = !isChecked && allChildPaths.some(p => checkedPaths.has(p));

  const handleClick = () => {
    if (node.children.size > 0) {
      setIsOpen(!isOpen);
    } else if (onSelect) {
      onSelect(fullPath);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const nextChecked = e.target.checked;
    const pathsToUpdate = node.children.size > 0 ? allChildPaths : [fullPath];
    pathsToUpdate.forEach(p => onCheckChange?.(p, nextChecked));
  };

  if (node.children.size === 0) {
    return (
      <div className="tree-node tree-node--leaf" style={{ paddingLeft: `${16 + level * 16}px` }}>
        <label className="tree-node__row">
          {showCheckbox && (
            <input
              type="checkbox"
              className="tree-node__checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              aria-label={`选择 ${node.name}`}
            />
          )}
          <span
            className={`tree-node__label ${isSelected ? 'tree-node__label--selected' : ''}`}
            onClick={handleClick}
          >
            {node.name}
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className="tree-node">
      <label className="tree-node__row tree-node__row--parent" onClick={handleClick}>
        {showCheckbox && (
          <input
            type="checkbox"
            className="tree-node__checkbox"
            checked={isChecked}
            // @ts-expect-error - indeterminate is a valid HTMLInputElement property
            indeterminate={isIndeterminate}
            onChange={handleCheckboxChange}
            aria-label={`选择 ${node.name} 及其子项`}
          />
        )}
        <span className="tree-node__expand-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 4L7 7L9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className={`tree-node__label ${isSelected ? 'tree-node__label--selected' : ''}`}>
          {node.name}
        </span>
      </label>
      <Collapse isOpen={isOpen} title={node.name}>
        <div className="tree-node__children">
          {Array.from(node.children.values()).map(child => (
            <TreeNode
              key={child.name}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              showCheckbox={showCheckbox}
              checkedPaths={checkedPaths}
              onCheckChange={onCheckChange}
            />
          ))}
        </div>
      </Collapse>
    </div>
  );
}