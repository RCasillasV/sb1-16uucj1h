import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfDay, endOfDay, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addMinutes, isWithinInterval, addDays, addWeeks, isAfter, getDay } from 'date-fns';
import esLocale from '@fullcalendar/core/locales/es';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, X, CalendarPlus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';

const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const INTERVAL_MINUTES = 15; // Changed from 30 to 15 minutes
const DAYS_TO_SHOW = 6;
const MAX_DAYS_AHEAD = 60;

// Generate time slots for the available hours
const TIME_SLOTS = Array.from(
  { length: ((END_HOUR - START_HOUR) * 60) / INTERVAL_MINUTES },
  (_, i) => {
    const totalMinutes = i * INTERVAL_MINUTES;
    const hour = Math.floor(totalMinutes / 60) + START_HOUR;
    const minutes = totalMinutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
);

interface AppointmentFormData {
  date: Date;
  time: string;
  duration: number;
  reason: string;
  cubicle?: number; // Added cubicle selection
}

export function Calendar() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const mainCalendarRef = useRef<FullCalendar>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: new Date(),
    time: '09:00',
    duration: 15, // Changed default duration to 15 minutes
    reason: '',
    cubicle: 1,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const appointments = await api.appointments.getAll();
      const calendarEvents = appointments.map(appointment => ({
        id: appointment.id,
        title: `${appointment.patients?.Nombre} ${appointment.patients?.Paterno} - ${appointment.motivo}`,
        start: new Date(`${appointment.fecha_cita}T${appointment.hora_cita}`),
        end: addMinutes(new Date(`${appointment.fecha_cita}T${appointment.hora_cita}`), 15), // Changed to 15 minutes
        backgroundColor: getEventColor(appointment.estado),
        extendedProps: {
          status: appointment.estado,
          patient: appointment.patients,
          reason: appointment.motivo,
          cubicle: appointment.consultorio || 1,
        }
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'completada':
        return '#10B981';
      case 'cancelada':
        return '#EF4444';
      case 'programada':
      default:
        return currentTheme.colors.primary;
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }

    const selectedDateTime = new Date(selectInfo.start);
    setFormData({
      date: selectedDateTime,
      time: format(selectedDateTime, 'HH:mm'),
      duration: 15,
      reason: '',
      cubicle: 1,
    });
    setShowAppointmentModal(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedPatient) {
      setFormError('Por favor seleccione un paciente');
      return;
    }

    if (!user) {
      setFormError('Usuario no autenticado');
      return;
    }

    try {
      const appointmentDate = format(formData.date, 'yyyy-MM-dd');

      if (selectedEvent) {
        await api.appointments.update(selectedEvent.id as string, {
          fecha_cita: appointmentDate,
          hora_cita: formData.time,
          motivo: formData.reason,
          estado: 'programada',
          consultorio: formData.cubicle,
        });
      } else {
        await api.appointments.create({
          id_paciente: selectedPatient.id,
          fecha_cita: appointmentDate,
          hora_cita: formData.time,
          motivo: formData.reason,
          estado: 'programada',
          consultorio: formData.cubicle,
          id_user: user.id,
        });
      }

      await fetchAppointments();
      setShowAppointmentModal(false);
      setSelectedEvent(null);
      setFormData({
        date: new Date(),
        time: '09:00',
        duration: 15,
        reason: '',
        cubicle: 1,
      });
      setFormError(null);
    } catch (error) {
      console.error('Error al guardar la cita:', error);
      setFormError('Calendar -> Error al guardar la cita. Por favor, inténtelo de nuevo.');
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-2">
      <div className="w-[90vw] max-w-[1600px]">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Calendario
          </h1>
        </div>

        <div 
          className="rounded-lg shadow-lg p-4"
          style={{ 
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            minHeight: '100vh',
            height: 'auto',
            overflowY: 'auto'
          }}
        >
          <div className="h-full">
            <FullCalendar
              ref={mainCalendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
              }}
              locale={esLocale}
              firstDay={1}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              slotDuration="00:15:00" // Changed to 15 minutes
              slotMinTime="08:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              views={{
                timeGridWeek: {
                  dayHeaderFormat: { weekday: 'long', day: 'numeric' },
                  slotLabelFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }
                }
              }}
              height="100%"
              //contentHeight="auto"
              aspectRatio={2}
              handleWindowResize={true}
              stickyHeaderDates={true}
              expandRows={true}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedEvent(null);
          setFormError(null);
        }}
        title={selectedEvent ? "Editar Cita" : "Nueva Cita"}
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
                  {selectedPatient.Nombre} {selectedPatient.Paterno}
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
              Fecha
            </label>
            <input
              type="date"
              value={format(formData.date, 'yyyy-MM-dd')}
              onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, cubicle: Number(e.target.value) }))}
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
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full p-2 rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
              placeholder="Ingrese el motivo de la consulta"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={buttonStyle.base}
            style={buttonStyle.primary}
            onClick={() => {
              setShowWarningModal(false);
              navigate('/patients');
            }}
          >
            Entendido
          </button>
        }
      >
        <p>Por favor, seleccione un paciente primero desde la sección de Pacientes.</p>
      </Modal>
    </div>
  );
}