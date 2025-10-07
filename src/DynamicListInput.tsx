import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface DynamicListInputProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  itemType: string;
}

export function DynamicListInput({ items, onAdd, onRemove, placeholder, itemType }: DynamicListInputProps) {
  const { currentTheme } = useTheme();
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 p-2 rounded-md border text-sm"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className={clsx(
            'px-3 py-2 rounded-md transition-colors text-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{
            background: currentTheme.colors.primary,
            color: currentTheme.colors.buttonText,
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: currentTheme.colors.textSecondary }}>
            {itemType} registrados ({items.length}):
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded border"
                style={{
                  background: currentTheme.colors.background,
                  borderColor: currentTheme.colors.border,
                }}
              >
                <span className="text-sm flex-1" style={{ color: currentTheme.colors.text }}>
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1 rounded-full hover:bg-red-100 transition-colors"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}