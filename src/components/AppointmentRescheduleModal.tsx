import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from './Modal';
import { api } from '../lib/api';
import clsx from 'clsx';

interface AppointmentRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatusId: number) => void;
  originalDate: string;
  originalTime: string;
  newDate: string;
  newTime: string;
  patientName: string;
  reason: string;
  currentStatusId: number;
}

interface StatusOption {
  id: number;
  estado: string;
  descripcion: string;
  usocita: string;
}

export function AppointmentRescheduleModal({
  isOpen,
  onClose,
  onConfirm,
  originalDate,
  originalTime,
  newDate,
  newTime,
  patientName,
  reason,
  currentStatusId,
}: AppointmentRescheduleModalProps) {
  const { currentTheme } = useTheme();
  const [selectedStatusId, setSelectedStatusId] = useState<number>(currentStatusId);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllowedStatuses();
  }, [currentStatusId]);

  const fetchAllowedStatuses = async () => {
    setLoadingStatuses(true);
    setStatusError(null);
    try {
      const filteredStatuses = await api.appointments.getFilteredStatusOptions(currentStatusId);
      setStatusOptions(filteredStatuses);
      
      // Set default to first allowed transition or current status
      const allowedTransitions = await api.appointments.getAllowedStatusTransitions(currentStatusId);
      if (allowedTransitions.length > 0) {
        // Find the first reprogramming-related status or use the first allowed
        const reprogrammingStatus = allowedTransitions.find(id => id === 8 || id === 9);
        setSelectedStatusId(reprogrammingStatus || allowedTransitions[0]);
      } else {
        setSelectedStatusId(currentStatusId);
      }
    } catch (err) {
      console.error('Error fetching status options:', err);
      setStatusError(err instanceof Error ? err.message : 'Error al cargar opciones de estado');
    } finally {
      setLoadingStatuses(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedStatusId);
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return `${date} a las ${time}`;
    }
  };

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
    secondary: {
      background: 'transparent',
      border: `1px solid ${currentTheme.colors.border}`,
      color: currentTheme.colors.text,
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Reprogramación de Cita"
      className="max-w-2xl"
      actions={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={buttonStyle.base}
            style={buttonStyle.secondary}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            Confirmar Reprogramación
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Patient and Appointment Info */}
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{
            background: `${currentTheme.colors.primary}10`,
            borderLeftColor: currentTheme.colors.primary,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
            <span className="font-medium" style={{ color: currentTheme.colors.text }}>
              {patientName}
            </span>
          </div>
          <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
            Motivo: {reason}
          </p>
        </div>

        {/* Date/Time Changes */}
        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg"
            style={{ background: currentTheme.colors.background }}
          >
            <h4 className="font-medium mb-3" style={{ color: currentTheme.colors.text }}>
              Cambio de Fecha y Hora
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                <div>
                  <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                    Fecha original:
                  </span>
                  <span className="ml-2 font-medium" style={{ color: currentTheme.colors.text }}>
                    {formatDateTime(originalDate, originalTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                <div>
                  <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                    Nueva fecha:
                  </span>
                  <span className="ml-2 font-medium" style={{ color: currentTheme.colors.primary }}>
                    {formatDateTime(newDate, newTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <h4 className="font-medium mb-3" style={{ color: currentTheme.colors.text }}>
              Nuevo Estado de la Cita
            </h4>
            
            {loadingStatuses ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
                Cargando opciones de estado...
              </div>
            ) : statusError ? (
              <div 
                className="p-3 rounded-md text-sm"
                style={{
                  background: '#FEE2E2',
                  color: '#DC2626',
                }}
              >
                {statusError}
              </div>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: currentTheme.colors.textSecondary }}>
                  Seleccione el nuevo estado que debe tener la cita tras la reprogramación:
                </p>
                
                <div className="space-y-3">
                  {statusOptions.map((option) => (
                    <div
                      key={option.id}
                      className={clsx(
                        'p-3 rounded-lg border-2 transition-colors cursor-pointer',
                        selectedStatusId === option.id 
                          ? 'border-current' 
                          : 'border-transparent hover:border-gray-200'
                      )}
                      style={{
                        background: selectedStatusId === option.id 
                          ? `${currentTheme.colors.primary}10` 
                          : currentTheme.colors.surface,
                        borderColor: selectedStatusId === option.id 
                          ? currentTheme.colors.primary 
                          : currentTheme.colors.border,
                      }}
                      onClick={() => setSelectedStatusId(option.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id={`status-${option.id}`}
                          name="reschedule-status"
                          value={option.id}
                          checked={selectedStatusId === option.id}
                          onChange={() => setSelectedStatusId(option.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`status-${option.id}`}
                            className="block font-medium cursor-pointer"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {option.estado}
                          </label>
                          <p 
                            className="text-sm mt-1"
                            style={{ color: currentTheme.colors.textSecondary }}
                          >
                            {option.descripcion}
                          </p>
                          {option.usocita && (
                            <p 
                              className="text-xs mt-1 italic"
                              style={{ color: currentTheme.colors.textSecondary }}
                            >
                              Uso: {option.usocita}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Warning Note */}
          <div 
            className="flex items-start gap-2 p-3 rounded-md"
            style={{
              background: '#FFFBEB',
              borderColor: '#FED7AA',
              color: '#D97706',
            }}
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Nota importante:</p>
              <p>Esta acción registrará el cambio en el historial de citas y actualizará el estado según la selección.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}