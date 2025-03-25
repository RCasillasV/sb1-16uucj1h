import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { Search, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  allDay?: boolean;
  extendedProps?: {
    description?: string;
    type?: string;
    patient?: {
      id: string;
      name: string;
    };
  };
}

interface CalendarViewState {
  view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  date: Date;
}

interface AppointmentFormData {
  date: Date;
  duration: number;
  type: string;
  reason: string;
  notes: string;
}

const APPOINTMENT_TYPES = [
  { id: 'regular', name: 'Consulta Regular', color: '#3B82F6', duration: 30 },
  { id: 'followup', name: 'Seguimiento', color: '#10B981', duration: 20 },
  { id: 'emergency', name: 'Urgencia', color: '#EF4444', duration: 45 },
  { id: 'procedure', name: 'Procedimiento', color: '#8B5CF6', duration: 60 },
];

const BUSINESS_HOURS = {
  startTime: '08:00',
  endTime: '20:00',
  daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
};

export function Calendar() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewState, setViewState] = useState<CalendarViewState>({
    view: 'timeGridWeek',
    date: new Date(),
  });
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: new Date(),
    duration: 30,
    type: 'regular',
    reason: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [viewState]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = format(
        viewState.view === 'dayGridMonth'
          ? startOfMonth(viewState.date)
          : startOfWeek(viewState.date),
        'yyyy-MM-dd'
      );
      const end = format(
        viewState.view === 'dayGridMonth'
          ? endOfMonth(viewState.date)
          : endOfWeek(viewState.date),
        'yyyy-MM-dd'
      );

      const appointments = await api.appointments.getAll();
      const formattedEvents = appointments.map(appointment => ({
        id: appointment.id,
        title: `${appointment.patients?.first_name} ${appointment.patients?.paternal_surname} - ${appointment.reason}`,
        start: appointment.appointment_date,
        end: addMinutes(new Date(appointment.appointment_date), 30).toISOString(),
        color: getAppointmentColor(appointment.status),
        extendedProps: {
          description: appointment.notes || '',
          type: appointment.status,
          patient: {
            id: appointment.patient_id || '',
            name: appointment.patients 
              ? `${appointment.patients.first_name} ${appointment.patients.paternal_surname}`
              : 'Sin paciente'
          }
        },
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return currentTheme.colors.primary;
      case 'completed':
        return '#10B981'; // green
      case 'cancelled':
        return '#EF4444'; // red
      default:
        return currentTheme.colors.secondary;
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    const start = new Date(selectInfo.start);
    const end = new Date(selectInfo.end);

    // Check if selected time is within business hours
    const hour = start.getHours();
    if (hour < 8 || hour >= 20) {
      setFormError('Las citas solo pueden programarse entre 8:00 AM y 8:00 PM');
      return;
    }

    // Check for overlapping appointments
    const isOverlapping = events.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (start >= eventStart && start < eventEnd) ||
        (end > eventStart && end <= eventEnd) ||
        (start <= eventStart && end >= eventEnd)
      );
    });

    if (isOverlapping) {
      setFormError('Ya existe una cita programada en este horario');
      return;
    }

    setSelectedTimeSlot({ start, end });
    setFormData(prev => ({
      ...prev,
      date: start,
      duration: APPOINTMENT_TYPES[0].duration,
    }));
    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedTimeSlot || !selectedPatient) {
      setFormError('Por favor seleccione un paciente y un horario válido');
      return;
    }

    try {
      const appointmentData = {
        patient_id: selectedPatient.id,
        appointment_date: selectedTimeSlot.start.toISOString(),
        reason: formData.reason,
        notes: formData.notes,
        status: 'scheduled',
      };

      await api.appointments.create(appointmentData);
      await fetchEvents();
      setShowAppointmentModal(false);
      setFormData({
        date: new Date(),
        duration: 30,
        type: 'regular',
        reason: '',
        notes: '',
      });
      setSelectedTimeSlot(null);
      setFormError(null);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setFormError('Error al crear la cita. Por favor intente nuevamente.');
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
  };

  const inputStyle = {
    base: clsx(
      'w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg'
    ),
    default: {
      background: currentTheme.colors.surface,
      borderColor: currentTheme.colors.border,
      color: currentTheme.colors.text,
    },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ 
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamily,
            }}
          >
            Agenda
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" 
              style={{ color: currentTheme.colors.textSecondary }}
            />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={inputStyle.base}
              style={inputStyle.default}
            />
          </div>

          {/* New Event Button */}
          <button
            onClick={() => setShowAppointmentModal(true)}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div 
        className="flex-1 rounded-lg shadow-lg overflow-hidden"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={es}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          businessHours={BUSINESS_HOURS}
          slotMinTime={BUSINESS_HOURS.startTime}
          slotMaxTime={BUSINESS_HOURS.endTime}
          allDaySlot={false}
          select={handleDateSelect}
          height="100%"
          themeSystem="standard"
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
          }}
          buttonIcons={{
            prev: 'chevron-left',
            next: 'chevron-right',
          }}
          nowIndicator={true}
          scrollTime="08:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00"
        />
      </div>

      {/* New Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setFormError(null);
        }}
        title="Nueva Cita"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAppointmentModal(false)}
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
              onClick={handleAppointmentSubmit}
              className={buttonStyle.base}
              style={buttonStyle.primary}
            >
              Guardar Cita
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

          {/* Patient Info */}
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
                  {selectedPatient.first_name} {selectedPatient.paternal_surname} {selectedPatient.last_name}
                </span>
              ) : (
                <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                  Por favor seleccione un paciente desde la sección de Pacientes
                </span>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Fecha y Hora
            </label>
            <div 
              className="p-3 rounded-md"
              style={{
                background: currentTheme.colors.background,
                color: currentTheme.colors.text,
              }}
            >
              {selectedTimeSlot ? (
                format(selectedTimeSlot.start, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
              ) : (
                <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                  Seleccione un horario en el calendario
                </span>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Tipo de Consulta
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                const type = APPOINTMENT_TYPES.find(t => t.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  type: e.target.value,
                  duration: type?.duration || 30,
                }));
              }}
              className={inputStyle.base}
              style={inputStyle.default}
            >
              {APPOINTMENT_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.duration} minutos)
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Motivo de la Consulta
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className={inputStyle.base}
              style={inputStyle.default}
              placeholder="Ingrese el motivo de la consulta"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Notas Adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className={inputStyle.base}
              style={inputStyle.default}
              rows={3}
              placeholder="Ingrese notas adicionales (opcional)"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}