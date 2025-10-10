import React, { useState } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { useTheme } from '../contexts/ThemeContext';
import { getStatusBadgeInfo } from '../utils/appointmentStatuses';
import clsx from 'clsx';

interface AppointmentStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatusId: number;
  currentStatusName: string;
  newStatusId: number;
  newStatusName: string;
  isTerminalStatus: boolean;
  onConfirm: (notes: string) => Promise<void>;
}

export function AppointmentStatusChangeModal({
  isOpen,
  onClose,
  currentStatusId,
  currentStatusName,
  newStatusId,
  newStatusName,
  isTerminalStatus,
  onConfirm,
}: AppointmentStatusChangeModalProps) {
  const { currentTheme } = useTheme();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatusInfo = getStatusBadgeInfo(currentStatusId);
  const newStatusInfo = getStatusBadgeInfo(newStatusId);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirm(notes);
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Error changing status:', err);
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNotes('');
      setError(null);
      onClose();
    }
  };

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons?.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors?.buttonPrimary || currentTheme.colors.primary,
      color: currentTheme.colors.buttonText,
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirmar Cambio de Estado"
      actions={
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={clsx(buttonStyle.base, 'border')}
            style={{
              background: 'transparent',
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={clsx(buttonStyle.base, 'disabled:opacity-50')}
            style={buttonStyle.primary}
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar Cambio'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Status change visualization */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Cambio de Estado
          </label>
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg" style={{ background: currentTheme.colors.background }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${currentStatusInfo.color}20` }}>
              <currentStatusInfo.icon className="h-5 w-5" style={{ color: currentStatusInfo.color }} />
              <span className="font-medium" style={{ color: currentStatusInfo.color }}>
                {currentStatusName}
              </span>
            </div>
            <ArrowRight className="h-6 w-6" style={{ color: currentTheme.colors.textSecondary }} />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${newStatusInfo.color}20` }}>
              <newStatusInfo.icon className="h-5 w-5" style={{ color: newStatusInfo.color }} />
              <span className="font-medium" style={{ color: newStatusInfo.color }}>
                {newStatusName}
              </span>
            </div>
          </div>
        </div>

        {/* Warning for terminal status */}
        {isTerminalStatus && (
          <div
            className="p-3 rounded-lg border-l-4 flex items-start gap-3"
            style={{
              background: '#FEF3C7',
              borderLeftColor: '#F59E0B',
            }}
          >
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                Estado Terminal
              </p>
              <p className="text-xs mt-1" style={{ color: '#92400E' }}>
                Este es un estado terminal. Una vez cambiado, no podrá modificarse posteriormente.
              </p>
            </div>
          </div>
        )}

        {/* Notes input */}
        <div>
          <label htmlFor="statusChangeNotes" className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Notas {isTerminalStatus && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="statusChangeNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ingrese el motivo del cambio de estado..."
            className="w-full px-3 py-2 rounded-md border resize-none"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
          <p className="text-xs mt-1" style={{ color: currentTheme.colors.textSecondary }}>
            {isTerminalStatus
              ? 'Las notas son obligatorias para cambios a estados terminales'
              : 'Opcional: agregue información relevante sobre este cambio'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="p-3 rounded-md border-l-4"
            style={{
              background: '#FEE2E2',
              borderLeftColor: '#DC2626',
            }}
          >
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
              {error}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
