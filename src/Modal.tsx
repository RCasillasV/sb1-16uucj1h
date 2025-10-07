import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, actions, className }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print-modal-root">
      {/* Backdrop */}
      <div 
        id="modal-overlay-print-target"
        className="fixed inset-0 bg-black bg-opacity-50 print:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={clsx(
          "relative rounded-lg shadow-xl w-full print:shadow-none print:rounded-none print:max-w-none print:p-0 print:overflow-visible print:max-h-none modal-content",
          className || "max-w-md"
        )}
        id="modal-content-print-target"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {/* Header */}
        {title && (
          <div 
            className="px-6 py-4 border-b print:hidden"
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
          className="px-6 py-4 overflow-y-auto max-h-[90vh] modal-content-wrapper"
          style={{ color: currentTheme.colors.text }}
        >
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div 
            className="px-6 py-4 border-t flex justify-end print:hidden"
            style={{ borderColor: currentTheme.colors.border }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}