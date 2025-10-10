import React, { useState, useEffect } from 'react';
import { format, parse, addDays, isEqual, isBefore, startOfDay, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../lib/api';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Database } from '../types/database.types';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

type AppointmentInsert = Database['public']['Tables']['tcCitas']['Insert'];
type AppointmentWithPatient = Database['public']['Tables']['tcCitas']['Row'] & {
  patients: {
    id: string;
    Nombre: string;
    Paterno: string;
    Materno: string;
    FechaNacimiento: string;
    Sexo: string;
    Email: string;
    Telefono: string;
  } | null;
};

interface AppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  appointment?: AppointmentWithPatient | null;
}

const START_HOUR = 8; // 8 AM
const END_HOUR = 23; // 11 PM
const INTERVAL_MINUTES = 30;
const DAYS_TO_SHOW = 6;
const MAX_DAYS_AHEAD = 60;

interface AppointmentStatus {
  id: number;
  estado: string;
  descripcion: string;
}

export function AppointmentForm({ onSuccess, onCancel, appointment }: AppointmentFormProps) {
  const { currentTheme } = useTheme();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    appointment 
      ? new Date(`${appointment.fecha_cita}T${appointment.hora_cita}`)
      : startOfDay(new Date())
  );
  const [existingAppointments, setExistingAppointments] = useState<Database['public']['Tables']['tcCitas']['Row'][]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    appointment 
      ? appointment.hora_cita
      : null
  );
  const [startDate, setStartDate] = useState<Date>(startOfDay(
    appointment 
      ? new Date(`${appointment.fecha_cita}T${appointment.hora_cita}`)
      : new Date()
  ));
  const [reason, setReason] = useState(appointment?.motivo || '');
  const [notes, setNotes] = useState(appointment?.notas || '');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<number>(appointment?.estado || 1);
  const [availableStatuses, setAvailableStatuses] = useState<AppointmentStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  
  useEffect(() => {
    if (!selectedPatient && !appointment) {
      onCancel();
      return;
    }

    // Si hay un appointment, asegúrate de que el paciente esté seleccionado
    if (appointment?.patients && !selectedPatient) {
      setSelectedPatient(appointment.patients);
    }

    fetchExistingAppointments();
  }, [selectedDate, appointment, selectedPatient, setSelectedPatient]);

  useEffect(() => {
    const fetchAvailableStatuses = async () => {
      setLoadingStatuses(true);
      try {
        // Si es una cita nueva, pasar undefined para obtener estados iniciales
        // Si es edición, pasar el estado actual de la cita
        const currentStatusId = appointment?.estado;
        const statuses = await api.appointments.getFilteredStatusOptions(currentStatusId);
        setAvailableStatuses(statuses);

        // Si es una cita nueva y no hay estado seleccionado, establecer el primer estado permitido
        if (!appointment && statuses.length > 0 && !status) {
          setStatus(statuses[0].id);
        }
      } catch (error) {
        console.error('Error fetching available statuses:', error);
        // Fallback a estados por defecto
        if (!appointment) {
          setAvailableStatuses([
            { id: 1, estado: 'Programada', descripcion: 'Cita programada' },
            { id: 11, estado: 'Urgencia', descripcion: 'Cita de urgencia' },
          ]);
        }
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchAvailableStatuses();
  }, [appointment?.estado]);

  async function fetchExistingAppointments() {
    try {
      const data = await api.appointments.getAll();
      setExistingAppointments(
        data.filter(a => a.id !== appointment?.id)
      );
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }

  const isTimeSlotTaken = (hour: number, minute: number) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    return existingAppointments.some(appointment => 
      appointment.fecha_cita === dateString && appointment.hora_cita === timeString
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTime) {
      setError('Seleccione una hora para la cita');
      return;
    }

    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    const dateString = format(selectedDate, 'yyyy-MM-dd');

    const appointmentData: AppointmentInsert = {
      id_paciente: appointment?.id_paciente || selectedPatient?.id,
      fecha_cita: dateString,
      hora_cita: selectedTime,
      id_user: user.id,
      motivo: reason,
      notas: notes || null,
      estado: status,
      consultorio: appointment?.consultorio || 1,
      tipo_consulta: appointment?.tipo_consulta || 'primera',
      duracion_minutos: appointment?.duracion_minutos || 30,
      hora_fin: appointment?.hora_fin || null,
    };

    try {
      if (appointment) {
        await api.appointments.update(appointment.id, appointmentData);
      } else {
        await api.appointments.create(appointmentData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la cita');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevWeek = () => {
    const newStartDate = addDays(startDate, -DAYS_TO_SHOW);
    if (!isBefore(newStartDate, startOfDay(new Date()))) {
      setStartDate(newStartDate);
    }
  };

  const handleNextWeek = () => {
    const newStartDate = addDays(startDate, DAYS_TO_SHOW);
    const maxDate = addDays(startOfDay(new Date()), MAX_DAYS_AHEAD - DAYS_TO_SHOW);
    if (!isBefore(maxDate, newStartDate)) {
      setStartDate(newStartDate);
    }
  };

  const dateRange = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i));
  const today = startOfDay(new Date());
  const maxDate = addDays(today, MAX_DAYS_AHEAD);
  const canGoBack = !isEqual(startDate, today);
  const canGoForward = !isEqual(addDays(startDate, DAYS_TO_SHOW), maxDate);

  const selectedDateTime = selectedTime 
    ? `${format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })} a las ${selectedTime} horas`
    : null;

  const timeSlots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += INTERVAL_MINUTES) {
      timeSlots.push({ hour, minute });
    }
  }

  if (!selectedPatient && !appointment) return null;

  const patient = appointment?.patients || selectedPatient;

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 rounded-md transition-colors',
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons?.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors?.buttonPrimary || currentTheme.colors.primary,
      color: currentTheme.colors.buttonText,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${currentTheme.colors.border}`,
      color: currentTheme.colors.text,
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h2 className="text-2xl font-bold">{appointment ? 'Editar Cita' : 'Nueva Cita'}</h2>
        </div>
        {selectedDateTime && (
          <p className="text-blue-600 font-medium">
            {selectedDateTime}
          </p>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Calendar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium" style={{ color: currentTheme.colors.text }}>
              Fecha
            </label>
            <span className="text-gray-600 font-medium">
              {format(startDate, "MMMM yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevWeek}
              disabled={!canGoBack}
              className={clsx(
                'p-2 rounded-md',
                canGoBack
                  ? 'hover:bg-gray-100'
                  : 'opacity-50 cursor-not-allowed'
              )}
              style={{ color: currentTheme.colors.text }}
            >
              <ChevronLeft className="h-5 w-4" />
            </button>
            <div className="grid grid-cols-6 gap-2 flex-1 mx-4">
              {dateRange.map((date) => {
                const isSelected = isEqual(startOfDay(date), startOfDay(selectedDate));
                const isPast = isBefore(date, today);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(date)}
                    className={clsx(
                      'p-2 text-center rounded-md transition-colors',
                      isPast ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-10',
                      isSelected ? 'text-white' : ''
                    )}
                    style={{
                      backgroundColor: isSelected 
                        ? currentTheme.colors.primary 
                        : isPast 
                          ? currentTheme.colors.border
                          : 'transparent',
                      color: isSelected 
                        ? currentTheme.colors.buttonText
                        : currentTheme.colors.text
                    }}
                  >
                    <div className="text-xs mb-1">{format(date, 'EEE', { locale: es })}</div>
                    <div className="font-semibold">{format(date, 'd')}</div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleNextWeek}
              disabled={!canGoForward}
              className={clsx(
                'p-2 rounded-md',
                canGoForward
                  ? 'hover:bg-gray-100'
                  : 'opacity-50 cursor-not-allowed'
              )}
              style={{ color: currentTheme.colors.text }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Time slots - 6x6 grid */}
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Hora
          </label>
          <div className="grid grid-cols-6 gap-2">
            {timeSlots.map(({ hour, minute }) => {
              const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              const isTaken = isTimeSlotTaken(hour, minute);
              const isSelected = selectedTime === timeString;
              return (
                <button
                  key={timeString}
                  type="button"
                  disabled={isTaken}
                  onClick={() => setSelectedTime(timeString)}
                  className={clsx(
                    'p-2 text-center rounded-md transition-colors',
                    isTaken ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-10'
                  )}
                  style={{
                    backgroundColor: isSelected 
                      ? currentTheme.colors.primary 
                      : isTaken 
                        ? currentTheme.colors.border
                        : 'transparent',
                    color: isSelected 
                      ? currentTheme.colors.buttonText
                      : currentTheme.colors.text
                  }}
                >
                  {timeString}
                </button>
              );
            })}
          </div>
        </div>

        {/* Patient selection */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
            Paciente:
          </label>
          <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-md">
            <span className="font-medium">
              {patient?.Nombre} {patient?.Paterno}
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="flex items-center gap-2">
          <label htmlFor="reason" className="text-sm font-medium whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
            Razón:
          </label>
          <input
            type="text"
            name="reason"
            id="reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border,
            }}
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm font-medium whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
            Estado:
          </label>
          <select
            name="status"
            id="status"
            value={status}
            onChange={(e) => setStatus(parseInt(e.target.value))}
            disabled={loadingStatuses}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border,
            }}
          >
            {loadingStatuses ? (
              <option>Cargando estados...</option>
            ) : (
              availableStatuses.map((statusOption) => (
                <option key={statusOption.id} value={statusOption.id}>
                  {statusOption.estado}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            Notas adicionales:
          </label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border,
            }}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className={buttonStyle.base}
            style={buttonStyle.secondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !selectedTime || isLoading}
            className={clsx(buttonStyle.base, 'disabled:opacity-50')}
            style={buttonStyle.primary}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {appointment ? 'Actualizando...' : 'Guardando...'}
              </div>
            ) : (
              appointment ? 'Actualizar' : 'Guardar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}