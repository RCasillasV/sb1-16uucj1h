import React from 'react';
import { format } from 'date-fns';
import { Modal } from '../../components/Modal';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';
import type { EventInput } from '@fullcalendar/core';

interface ModalAgendaProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: EventInput | null;
  selectedPatient: any;
  formData: {
    date: Date;
    time: string;
    reason: string;
    cubicle: number;
    tipo_consulta: string;
  };
  formError: string | null;
  onSubmit: () => void;
  onFormDataChange: (data: any) => void;
}

export function ModalAgenda({
  isOpen,
  onClose,
  selectedEvent,
  selectedPatient,
  formData,
  formError,
  onSubmit,
  onFormDataChange,
}: ModalAgendaProps) {
  const { currentTheme } = useTheme();

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
      title={selectedEvent ? "Editar Cita" : "Nueva Cita"}
      actions={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
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
            onClick={onSubmit}
            disabled={!formData.reason.trim()}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            {selectedEvent ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {formError && (
          <div 
            className="p-3 rounded-md text-sm"
            style={{
              background: '#FEE2E2',
              color: '#DC2626',
            }}
          >
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Paciente
          </label>
          <div 
            className="p-3 rounded-md"
            style={{
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
            }}
          >
            {selectedPatient ? (
              <span className="font-medium">
                {selectedPatient.Nombre} {selectedPatient.Paterno} {selectedPatient.Materno}
              </span>
            ) : (
              <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                Por favor seleccione un paciente desde la sección de Pacientes
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Tipo de Consulta
          </label>
          <select
            value={formData.tipo_consulta}
            onChange={(e) => onFormDataChange({ ...formData, tipo_consulta: e.target.value })}
            className="w-full p-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          >
            <option value="primera">Primera vez</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="urgencia">Urgencia</option>
            <option value="control">Control rutinario</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Fecha
          </label>
          <input
            type="date"
            value={format(formData.date, 'yyyy-MM-dd')}
            onChange={(e) => onFormDataChange({ ...formData, date: new Date(e.target.value) })}
            className="w-full p-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Hora
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => onFormDataChange({ ...formData, time: e.target.value })}
            className="w-full p-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Consultorio
          </label>
          <select
            value={formData.cubicle}
            onChange={(e) => onFormDataChange({ ...formData, cubicle: Number(e.target.value) })}
            className="w-full p-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          >
            <option value={1}>Consultorio 1</option>
            <option value={2}>Consultorio 2</option>
            <option value={3}>Consultorio 3</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Motivo de la Consulta
          </label>
           <select
            value={formData.reason}
            onChange={(e) => onFormDataChange({ ...formData, reason: e.target.value })}
  className="w-full p-2 rounded-md border"
             style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
            >
            <option value={"Primera vez"}>Primera Vez</option>
            <option value={"Seguimiento"}>Seguimiento</option>
            <option value={"Urgencia"}>Urgencia</option>
            <option value={"Control Rutinario"}>Control Rutinario</option>
          </select>
        </div>
        
      </div>
    </Modal>
  );
}