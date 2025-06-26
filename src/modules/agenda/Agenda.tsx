import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../../lib/api';
import { useSelectedPatient } from '../../contexts/SelectedPatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal } from '../../components/Modal';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, CalendarPlus } from 'lucide-react';
import { MiniCalendar } from '../../components/MiniCalendar';
import clsx from 'clsx';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';

interface AppointmentFormData {
  date: Date;
  patient_id: string;
  time: string;
  duration: number;
  reason: string;
  cubicle: number;
  tipo_consulta: string;
}

export function Agenda() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentViewDates, setCurrentViewDates] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  let appointmentData; // Declaración sin inicialización
  const [shouldSyncCalendars, setShouldSyncCalendars] = useState(false);
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek'>('timeGridWeek');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const calendarWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const now = new Date();
      const scrollTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      
      // Scroll to current time with offset
      calendarApi.scrollToTime(scrollTime);
      
      // Fine-tune scroll position to center current time
      if (calendarWrapperRef.current) {
        const timeGridContainer = calendarWrapperRef.current.querySelector('.fc-timegrid-body');
        if (timeGridContainer) {
          const containerHeight = timeGridContainer.clientHeight;
          const currentOffset = timeGridContainer.scrollTop;
          timeGridContainer.scrollTop = currentOffset - (containerHeight / 3);
        }
      }
    }
  }, [calendarView]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleMonthChange = (date: Date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      setShouldSyncCalendars(false);
      calendarApi.gotoDate(date);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedDate(today);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  const fetchAppointments = async () => {
    try {
      const appointments = await api.appointments.getAll();
      const calendarEvents = appointments.map(appointment => ({
        id: appointment.id,
        title: `${appointment.patients?.Nombre} ${appointment.patients?.Paterno} - ${appointment.motivo}`,
        start: new Date(`${appointment.fecha_cita}T${appointment.hora_cita}`),
        end: new Date(new Date(`${appointment.fecha_cita}T${appointment.hora_cita}`).getTime() + 15 * 60000),
        backgroundColor: getEventColor(appointment.estado),
        extendedProps: {
          status: appointment.estado,
          patient: appointment.patients,
          reason: appointment.motivo,
          consultorio: appointment.consultorio || 1,
        }
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error al cargar las citas:', error);
    }
  };

  const getEventColor = (estado: string) => {
    switch (estado) {
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

    // Navegar a CitasPage con la fecha seleccionada
    navigate('/citas', {
      state: {
        selectedDate: selectInfo.start,
        selectedPatient: selectedPatient
      }
    });
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    // Navegar a CitasPage para editar la cita
    navigate('/citas', {
      state: {
        editMode: true,
        appointmentId: clickInfo.event.id,
        selectedPatient: selectedPatient
      }
    });
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShouldSyncCalendars(true);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
      
      // If in month view, switch to week view
      if (calendarApi.view.type === 'dayGridMonth') {
        calendarApi.changeView('timeGridWeek');
        setCalendarView('timeGridWeek');
      }
      
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
    if (!shouldSyncCalendars) {
      const effectiveStartDate = arg.view.type === 'dayGridMonth' ? startOfMonth(arg.view.currentStart) : arg.start;
      
      setCurrentViewDates({
        start: effectiveStartDate,
        end: arg.end
      });
      
      // Update selected date if it's outside the new view
      if (selectedDate < arg.start || selectedDate >= arg.end) {
        //setSelectedDate(arg.start);
      }
    }
    setShouldSyncCalendars(false);
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
    <div className="flex flex-col items-center justify-start min-h-screen w-full p-2">
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
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Main Calendar */}
          <div 
            className={clsx(
              'flex-1 rounded-lg shadow-lg transition-all duration-300 flex flex-col',
              isMobile && 'hidden'
            )}
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              height: 'calc(100vh - 8rem)',
            }}
          >
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: currentTheme.colors.border }}>
              <h2 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>
                Calendario de Citas
              </h2>
              <Link
                to="/citas"
                className={buttonStyle.base}
                style={buttonStyle.primary}
              >
                <CalendarPlus className="h-4 w-4 mr-1" />
                Agregar Cita
              </Link>
            </div>
            <div className="flex-1">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={calendarView}
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
                viewDidMount={(info) => {
                  setCalendarView(info.view.type as 'dayGridMonth' | 'timeGridWeek');
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
                slotDuration="00:30:00"
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                slotLabelInterval="00:30:00"
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
                //contentHeight="100%"
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
                   color: ${currentTheme.colors.text} !important;
                  }
                  .fc-timegrid-axis-cushion {
                    font-size: 0.75rem !important;
                   color: ${currentTheme.colors.text} !important;
                  }
                  .fc .fc-timegrid-slot-label-cushion {
                    font-size: 0.75rem !important;
                   color: ${currentTheme.colors.text} !important;
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
                  .fc-timegrid-body {
                    overflow-y: auto !important;
                  }
                  .fc-timegrid-body::-webkit-scrollbar {
                    width: 8px;
                  }
                  .fc-timegrid-body::-webkit-scrollbar-track {
                    background: ${currentTheme.colors.background};
                    border-radius: 4px;
                  }
                  .fc-timegrid-body::-webkit-scrollbar-thumb {
                    background: ${currentTheme.colors.border};
                    border-radius: 4px;
                  }
                  .fc-timegrid-body::-webkit-scrollbar-thumb:hover {
                    background: ${currentTheme.colors.textSecondary};
                  }
                  .fc .fc-timegrid-slot {
                    height: 3rem !important;
                  }
                  .fc .fc-timegrid-axis,
                  .fc .fc-timegrid-slot-label {
                    position: sticky;
                    left: 0;
                    z-index: 2;
                    background: ${currentTheme.colors.surface};
                  }
                  .fc .fc-col-header {
                    position: sticky;
                    top: 0;
                    z-index: 3;
                    background: ${currentTheme.colors.surface};
                  }
                `}
              </style>
            </div>
          </div>
        </div>
      </div>

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