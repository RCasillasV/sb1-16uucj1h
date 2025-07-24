import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfMonth, endOfMonth, parseISO, addMinutes, isBefore, startOfWeek } from 'date-fns';
import esLocale from '@fullcalendar/core/locales/es';
import { api } from '../../lib/api';
import { useSelectedPatient } from '../../contexts/SelectedPatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/Modal';
import { PatientListSelector } from '../../components/PatientListSelector';
import { AlertModal } from '../../components/AlertModal';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, CalendarPlus, Clock, User, FileText, AlertCircle, MapPin } from 'lucide-react';
import { MiniCalendar } from '../../components/MiniCalendar';
import clsx from 'clsx';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg, EventMountArg } from '@fullcalendar/core';
import { useStyles } from '../../hooks/useStyles';
import { useIdleTimer } from '../../hooks/useIdleTimer';


export function Agenda() {
  const { currentTheme } = useTheme();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPatientSelectionModal, setShowPatientSelectionModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [currentAppointmentDetails, setCurrentAppointmentDetails] = useState<any>(null);
  const [currentViewDates, setCurrentViewDates] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek'>('timeGridWeek');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const calendarWrapperRef = useRef<HTMLDivElement>(null);
  const { buttonClasses } = useStyles();

  // Nuevo estado para el modal de advertencia de slot pasado
  const [showPastSlotWarningModal, setShowPastSlotWarningModal] = useState(false);

  // Configurar el timer de inactividad
  const handleAppReload = () => {
    console.log('Recargando aplicación por inactividad...');
    window.location.reload();
  };

  const { remainingTime, isCountingDown, resetTimer } = useIdleTimer({
    idleTimeoutMs: 14 * 60 * 1000, // 14 minutos
    countdownDurationMs: 60 * 1000, // 60 segundos
    onTimeout: handleAppReload
  });

  const initialScrollTime = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // This useEffect will handle scrolling to the current time after the calendar renders
  // It will run on every mount and when calendarView changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const now = new Date();
      const scrollTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

      calendarApi.scrollToTime(scrollTime);

      // Optional: Adjust scroll position slightly to center the current time
      if (calendarWrapperRef.current) {
        const timeGridContainer = calendarRef.current.getApi().el.querySelector('.fc-timegrid-body');
        if (timeGridContainer) {
          const containerHeight = timeGridContainer.clientHeight;
          const currentOffset = timeGridContainer.scrollTop;
          // Scroll up by 1/3 of the container height to show more of the past
          timeGridContainer.scrollTop = currentOffset - (containerHeight / 3);
        }
      }
    }
  }, [calendarView]); // Depend on calendarView to re-scroll if view changes

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [user, authLoading]);

  const handleMonthChange = (date: Date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);
    }
  };

  const fetchAppointments = async () => {
    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    try {
      const appointments = await api.appointments.getAll();
      const now = new Date(); // Get current date and time

      const calendarEvents = appointments.map(appointment => {
        const appointmentDateTime = parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`);
        const isPastEvent = isBefore(appointmentDateTime, now); // Check if the event is in the past

        return {
          id: appointment.id,
          title: `${appointment.patients?.Nombre} ${appointment.patients?.Paterno} - ${appointment.motivo}`,
          start: appointmentDateTime,
          end: appointment.hora_fin ? parseISO(`${appointment.fecha_cita}T${appointment.hora_fin}`) : addMinutes(appointmentDateTime, appointment.duracion_minutos || 15),
          backgroundColor: isPastEvent ? '#9CA3AF' : getEventColor(appointment.estado), // Assign a different color for past events 
          extendedProps: {
            status: appointment.estado, 
            patient: appointment.patients,
            reason: appointment.motivo,
            notas: appointment.notas,
            consultorio: appointment.consultorio || 1,
            tiempo_evolucion: appointment.tiempo_evolucion,
            unidad_tiempo: appointment.unidad_tiempo,
            tipo_consulta: appointment.tipo_consulta,
            isPastEvent: isPastEvent,
          }
        };
      });
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error al cargar las citas en Agenda:', error);
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

  const handleEventDidMount = (info: EventMountArg) => {
    info.el.addEventListener('dblclick', () => {
      setCurrentAppointmentDetails(info.event);
      setShowAppointmentDetailsModal(true);
    });
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!selectedPatient) {
      setShowPatientSelectionModal(true);
      setTempSelectedDate(selectInfo.start);
      return;
    }

    // NUEVA LÓGICA: Verificar si el slot seleccionado está en el pasado
    const selectedSlotDateTime = new Date(selectInfo.start);
    const now = new Date();

    if (selectedSlotDateTime < now) {
      // Si el slot seleccionado está en el pasado, mostrar un modal de advertencia
      setShowPastSlotWarningModal(true);
      return; // No navegar
    }

    navigate('/citas', {
      state: {
        selectedDate: selectInfo.start,
        selectedPatient: selectedPatient
      }
    });
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const isPastEvent = clickInfo.event.extendedProps?.isPastEvent || false;
    
    navigate('/citas', {
      state: {
        editMode: true,
        appointmentId: clickInfo.event.id,
        selectedPatient: selectedPatient,
        viewOnly: isPastEvent
      }
    });
  };

  const handleCloseDetailsModal = () => {
    setShowAppointmentDetailsModal(false);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(date);

      if (calendarApi.view.type === 'dayGridMonth') {
        calendarApi.changeView('timeGridWeek');
        setCalendarView('timeGridWeek');
      }
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const effectiveStartDate = arg.view.type === 'dayGridMonth' ? startOfMonth(arg.view.currentStart) : startOfWeek(arg.start, { weekStartsOn: 1 });

    setCurrentViewDates({
      start: effectiveStartDate,
      end: arg.end
    });

    if (!isBefore(selectedDate, arg.start) && !isBefore(arg.end, selectedDate)) {
      // selectedDate is still within the new view, do nothing
    } else {
      setSelectedDate(arg.start);
    }
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
          'flex gap-4 transition-all duration-100',
          isMobile && 'flex-col'
        )}>
          {/* Mini Calendar */}
          <div className={clsx(
            'shrink-0 transition-all duration-100',
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
            ref={calendarWrapperRef}
            className={clsx(
              'flex-1 rounded-lg shadow-lg transition-all duration-100 flex flex-col',
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
                Citas Programadas
              </h2>
              <Link
                to="/citas"
                className={clsx(buttonClasses.base, buttonClasses.primary)}
              >
                <CalendarPlus className="h-4 w-4 mr-0" />
                Agregar Cita
              </Link>
            </div>
            <div className="flex-1">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                scrollTime={initialScrollTime}
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
                locale={esLocale}
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
                eventDidMount={handleEventDidMount}
                slotLabelInterval="00:15:00"
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
                aspectRatio={2}
                handleWindowResize={true}
                stickyHeaderDates={true}
                expandRows={true}
              />

              {/* Custom styles for time slots */}
              <style>
                {`
                  .fc-timegrid-slot-label {
                    width: 60px !important;
                    font-size: 0.75rem !important;
                   color: ${currentTheme.colors.text} !important;
                  }
                  .fc-timegrid-axis-cushion {
                    font-size: 0.75rem !important;
                   color: ${currentTheme.colors.text} !important;
                  }
                  .fc .fc-timegrid-slot-label-cushion {
                    width: 60px !important;
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
                    font-size: 1.25em !important;
                    font-weight: bold;
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
                    touch-action: manipulation;
                  }
                  .fc .fc-timegrid-axis {
                    width: 70px !important;
                  }
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
                  .fc-event-title {
                    font-size: 0.7rem !important;
                  }
                `}
              </style>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPatientSelectionModal}
        onClose={() => setShowPatientSelectionModal(false)}
        title="Seleccionar Paciente"
        actions={
          <button
            className={clsx(buttonClasses.base, buttonClasses.primary)}
            onClick={() => setShowPatientSelectionModal(false)}
          >
            Cancelar
          </button>
        }
      >
        <PatientListSelector
          onSelectPatient={(patient) => {
            setSelectedPatient(patient);
            setShowPatientSelectionModal(false);

            if (tempSelectedDate) {
              navigate('/citas', {
                state: {
                  selectedDate: tempSelectedDate,
                  selectedPatient: patient
                }
              });
              setTempSelectedDate(null);
            }
          }}
          isModal={true}
        />
      </Modal>

      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={clsx(buttonClasses.base, buttonClasses.primary)}
            onClick={() => {
              setShowWarningModal(false);
              setShowPatientSelectionModal(true);
            }}
          >
            Entendido
          </button>
        }
      >
        <p>Para continuar, necesita seleccionar un paciente.</p>
      </Modal>

      <Modal
        isOpen={showAppointmentDetailsModal}
        onClose={handleCloseDetailsModal}
        title="Detalles de la Cita"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                if (currentAppointmentDetails) {
                  navigate('/citas', {
                    state: {
                      editMode: true,
                      appointmentId: currentAppointmentDetails.id,
                      selectedPatient: currentAppointmentDetails.extendedProps?.patient
                    }
                  });
                }
              }}
              className={clsx(buttonClasses.base, buttonClasses.primary)}
            >
              Editar Cita
            </button>
          </div>
        }
      >
        {currentAppointmentDetails && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${currentTheme.colors.primary}10` }}>
              <Clock className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                  Fecha y Hora
                </p>
                <p className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>
                  {format(new Date(currentAppointmentDetails.start), 'dd/MM/yyyy HH:mm')} hrs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${currentTheme.colors.primary}10` }}>
              <User className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                  Paciente
                </p>
                <p className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>
                  {currentAppointmentDetails.extendedProps?.patient?.Nombre} {currentAppointmentDetails.extendedProps?.patient?.Paterno} {currentAppointmentDetails.extendedProps?.patient?.Materno}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${currentTheme.colors.primary}10` }}>
              <FileText className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                  Motivo de Consulta
                </p>
                <p className="text-lg" style={{ color: currentTheme.colors.text }}>
                  {currentAppointmentDetails.extendedProps?.reason}
                </p>
                {currentAppointmentDetails.extendedProps?.tiempo_evolucion && (
                  <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                    Evolución: {currentAppointmentDetails.extendedProps?.tiempo_evolucion} {currentAppointmentDetails.extendedProps?.unidad_tiempo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${currentTheme.colors.primary}10` }}>
              <MapPin className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
              <div>
                <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                  Consultorio
                </p>
                <p className="text-lg" style={{ color: currentTheme.colors.text }}>
                  Consultorio {currentAppointmentDetails.extendedProps?.consultorio}
                </p>
              </div>
            </div>

            {currentAppointmentDetails.extendedProps?.notas && (
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${currentTheme.colors.primary}10` }}>
                <AlertCircle className="h-5 w-5 mt-1" style={{ color: currentTheme.colors.primary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                    Notas Adicionales
                  </p>
                  <p className="text-base" style={{ color: currentTheme.colors.text }}>
                    {currentAppointmentDetails.extendedProps?.notas}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Nuevo Modal para advertencia de slot pasado */}
      <AlertModal
        isOpen={showPastSlotWarningModal}
        onClose={() => setShowPastSlotWarningModal(false)}
        type="warning"
        title="Horario no disponible"
        message="Por favor, seleccione un día y horario futuro para continuar con la reserva."
      />

      {/* Contador de inactividad */}
      {isCountingDown && (
        <div 
          className="fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border-2 animate-pulse"
          style={{
            background: currentTheme.colors.surface,
            borderColor: remainingTime <= 10 ? '#EF4444' : '#F59E0B',
            color: currentTheme.colors.text,
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                background: remainingTime <= 10 ? '#EF4444' : '#F59E0B'
              }}
            />
            <div>
              <p className="text-sm font-medium">
                Sesión por expirar
              </p>
              <p className="text-lg font-bold">
                {remainingTime} segundos
              </p>
              <button
                onClick={resetTimer}
                className="text-xs underline hover:no-underline mt-1"
                style={{ color: currentTheme.colors.primary }}
              >
                Mantener sesión activa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
