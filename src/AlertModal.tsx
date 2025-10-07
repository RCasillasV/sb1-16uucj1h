import React from 'react';
import { Modal } from './Modal';
import { useTheme } from '../contexts/ThemeContext';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

export function AlertModal({ isOpen, onClose, type, title, message }: AlertModalProps) {
  const { currentTheme } = useTheme();

  const getIconAndColors = () => {
    switch (type) {
      case 'error':
        return {
          icon: XCircle,
          bgColor: '#FEE2E2', // Red-100
          textColor: '#DC2626', // Red-600
          iconColor: '#DC2626',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: '#FFFBEB', // Yellow-100
          textColor: '#D97706', // Yellow-700
          iconColor: '#D97706',
        };
      case 'info':
        return {
          icon: Info,
          bgColor: '#DBEAFE', // Blue-100
          textColor: '#2563EB', // Blue-600
          iconColor: '#2563EB',
        };
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: '#D1FAE5', // Green-100
          textColor: '#059669', // Green-600
          iconColor: '#059669',
        };
      default:
        return {
          icon: Info,
          bgColor: currentTheme.colors.background,
          textColor: currentTheme.colors.text,
          iconColor: currentTheme.colors.textSecondary,
        };
    }
  };

  const { icon: Icon, bgColor, textColor, iconColor } = getIconAndColors();

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <button
          onClick={onClose}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          Aceptar
        </button>
      }
    >
      <div className="flex items-start gap-3 p-3 rounded-md" style={{ background: bgColor, color: textColor }}>
        <Icon className="h-6 w-6 flex-shrink-0" style={{ color: iconColor }} />
        <p className="text-sm">{message}</p>
      </div>
    </Modal>
  );
}
