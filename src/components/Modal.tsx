import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  const { currentTheme } = useTheme();

  if (!isOpen) return null;

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative rounded-lg shadow-xl max-w-md w-full"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {/* Header */}
        {title && (
          <div 
            className="px-6 py-4 border-b"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <h3 
              className="text-lg font-medium"
              style={{ color: currentTheme.colors.text }}
            >
              {title}
            </h3>
          </div>
        )}

        {/* Content */}
        <div 
          className="px-6 py-4"
          style={{ color: currentTheme.colors.text }}
        >
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div 
            className="px-6 py-4 border-t flex justify-end"
            style={{ borderColor: currentTheme.colors.border }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}