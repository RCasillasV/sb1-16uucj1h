import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MiniCalendar } from '../components/MiniCalendar';
import clsx from 'clsx';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';

interface AppointmentFormData {
  date: Date;
  time: string;
  duration: number;
  reason: string;
  cubicle: number;
}

export function Agenda2() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentViewDates, setCurrentViewDates] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: new Date(),
    time: '09:00',
    duration: 15,
    reason: '',
    cubicle: 1,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const appointments = await api.appointments.getAll();
      const calendarEvents = appointments.map(appointment => ({
        id: appointment.id,
        title: `${appointment.patients?.first_name} ${appointment.patients?.paternal_surname} - ${appointment.reason}`,
        start: new Date(appointment.appointment_date),
        end: new Date(new Date(appointment.appointment_date).getTime() + 15 * 60000),
        backgroundColor: getEventColor(appointment.status),
        extendedProps: {
          status: appointment.status,
          patient: appointment.patients,
          reason: appointment.reason,
          cubicle: appointment.cubicle || 1,
        }
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
    }
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'scheduled':
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
    setSelectedDate(selectedDateTime);
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

    try {
      const appointmentDate = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes);

      if (selectedEvent) {
        await api.appointments.update(selectedEvent.id as string, {
          appointment_date: appointmentDate.toISOString(),
          reason: formData.reason,
          status: 'scheduled',
          cubicle: formData.cubicle,
        });
      } else {
        await api.appointments.create({
          patient_id: selectedPatient.id,
          appointment_date: appointmentDate.toISOString(),
          reason: formData.reason,
          status: 'scheduled',
          cubicle: formData.cubicle,
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
      setFormError('Error al guardar la cita. Por favor, inténtelo de nuevo.');
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
      
      // Update view if date is outside current view
      const view = calendarApi.view;
      const viewStart = view.currentStart;
      const viewEnd = view.currentEnd;
      
      if (date < viewStart || date >= viewEnd) {
        if (view.type === 'timeGridWeek') {
          calendarApi.gotoDate(date);
        } else if (view.type === 'dayGridMonth') {
          calendarApi.gotoDate(date);
        }
      }
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentViewDates({
      start: arg.start,
      end: arg.end
    });
    
    // Update selected date if it's outside the new view
    if (selectedDate < arg.start || selectedDate >= arg.end) {
      setSelectedDate(arg.start);
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
            Agenda
          </h1>
        </div>

        <div className={clsx(
          'flex gap-4 transition-all duration-300',
          isMobile && 'flex-col'
        )}>
          {/* Mini Calendar */}
          <div className={clsx(
            'shrink-0 transition-all duration-300',
            isMobile && 'w-full'
          )}>
            <MiniCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateChange}
              events={events}
              currentViewDates={currentViewDates}
            />
          </div>

          {/* Main Calendar */}
          <div 
            className={clsx(
              'flex-1 rounded-lg shadow-lg p-4 transition-all duration-300',
              isMobile && 'hidden'
            )}
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              minHeight: '100vh',
              height: 'auto',
              overflowY: 'auto',
              fontSize: 'auto'
            }}
          >
            <div className="h-full">
              <FullCalendar
                ref={calendarRef}
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
                locale={es}
                firstDay={1}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                slotDuration="00:15:00"
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
                    dayHeaderFormat: { weekday: 'short', day: 'numeric' },
                    slotLabelFormat: {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }
                  }
                }}
                height="100%"
                contentHeight="auto"
                aspectRatio={2}
                handleWindowResize={true}
                stickyHeaderDates={true}
                expandRows={true}
              />

              {/* Custom styles for time slots */}
              <style>
                {`
                  .fc-timegrid-slot-label {
                    font-size: 0.75rem !important;
                  }
                  .fc-timegrid-axis-cushion {
                    font-size: 0.75rem !important;
                  }
                  .fc .fc-timegrid-slot {
                    height: 2rem !important;
                  }
                  .fc .fc-timegrid-slot-label-cushion {
                    font-size: 0.75rem !important;
                  }
                  .fc .fc-button {
                    background-color: ${currentTheme.colors.primary} !important;
                    border-color: ${currentTheme.colors.primary} !important;
                  }
                  .fc .fc-button:disabled {
                    opacity: 0.5;
                  }
                  .fc .fc-button:hover {
                    background-color: ${currentTheme.colors.primary}dd !important;
                  }
                  .fc .fc-toolbar-title {
                    color: ${currentTheme.colors.text};
                  }
                  .fc .fc-col-header-cell {
                    color: ${currentTheme.colors.textSecondary};
                  }
                  .fc .fc-daygrid-day {
                    color: ${currentTheme.colors.text};
                  }
                  .fc .fc-timegrid-col.fc-day-today {
                    background-color: ${currentTheme.colors.primary}10 !important;
                  }
                `}
              </style>
            </div>
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
                  {selectedPatient.first_name} {selectedPatient.paternal_surname}
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