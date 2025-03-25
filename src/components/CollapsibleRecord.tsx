import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ReadOnlyRichText } from './ReadOnlyRichText';
import clsx from 'clsx';

interface CollapsibleRecordProps {
  date: string;
  content: string;
  index: number;
}

export function CollapsibleRecord({ date, content, index }: CollapsibleRecordProps) {
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={clsx(
        'border rounded-lg overflow-hidden transition-all duration-300 w-full',
        isExpanded ? 'shadow-md' : 'hover:shadow-sm'
      )}
      style={{
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
      }}
    >
      <button
        onClick={toggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors"
        style={{
          background: isExpanded ? `${currentTheme.colors.primary}10` : 'transparent',
          color: currentTheme.colors.text,
        }}
        aria-expanded={isExpanded}
        aria-controls={`record-content-${index}`}
      >
        <span className="font-medium text-left">{date}</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
        )}
      </button>
      
      <div
        id={`record-content-${index}`}
        role="region"
        aria-labelledby={`record-header-${index}`}
        className={clsx(
          'transition-all duration-300 origin-top w-full',
          isExpanded ? 'opacity-100' : 'opacity-0 h-0'
        )}
      >
        {isExpanded && (
          <div className="px-4 py-3 border-t w-full" style={{ borderColor: currentTheme.colors.border }}>
            <ReadOnlyRichText content={content} />
          </div>
        )}
      </div>
    </div>
  );
}