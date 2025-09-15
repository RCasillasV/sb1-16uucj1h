// src/modules/agenda/Agenda.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfMonth, endOfMonth, parseISO, addMinutes, isBefore, startOfWeek, isWithinInterval } from 'date-fns';
import esLocale from '@fullcalendar/core/locales/es';
import { api } from '../../lib/api';
import { useSelectedPatient } from '../../contexts/SelectedPatientContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAgenda } from '../../contexts/AgendaContext';
import { Modal } from '../../components/Modal';
import { PatientListSelector } from '../../components/PatientListSelector';
import { AlertModal } from '../../components/AlertModal';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, CalendarPlus, Clock, User, FileText, AlertCircle, MapPin, X, Settings } from 'lucide-react';
import { MiniCalendar } from '../../components/MiniCalendar';
import clsx from 'clsx';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg, EventMountArg, DayCellMountArg } from '@fullcalendar/core';
import { useStyles } from '../../hooks/useStyles';
import { useIdleTimer } from '../../hooks/useIdleTimer';
// Importar las nuevas constantes
import { getStatusColor, DetailedAppointmentStatus } from '../../utils/appointmentStatuses';

interface AppointmentFormData {
  fecha_cita: string;
  hora_cita: string;
  motivo: string;
  consultorio: number;
  duracion_minutos: number;
  tipo_consulta: 'primera' | 'seguimiento' | 'urgencia' | 'revision' | 'control';
  tiempo_evolucion?: number | null;
  unidad_tiempo?: 'horas' | 'dias' | 'semanas' | 'meses' | null;
  sintomas_asociados?: string[];
  urgente?: boolean;
  notas?: string;
}

export function Agenda() {
  const { currentTheme } = useTheme();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const { 
    agendaSettings, 
    blockedDates, 
    loading: agendaLoading, 
    error: agendaError,
    loadConfiguration,
    isDateBlocked,
    isWorkDay,
    createSecureAppointment,
    checkSlotAvailability 
  } = useAgenda();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPatientSelectionModal, setShowPatientSelectionModal] = useState(false);
  const [showQuickAppointmentModal, setShowQuickAppointmentModal] = useState(false);
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
  const [showConfigurationErrorModal, setShowConfigurationErrorModal] = useState(false);
  const [configurationErrorMessage, setConfigurationErrorMessage] = useState('');

  // Estados para el formulario rápido de citas
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>({
    fecha_cita: '',
    hora_cita: '',
    motivo: '',
    consultorio: 1,
    duracion_minutos: 30,
    tipo_consulta: 'primera',
    tiempo_evolucion: null,
    unidad_tiempo: null,
    sintomas_asociados: [],
    urgente: false,
    notas: ''
  });
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

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
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
      loadConfiguration();
    }
  }, [user, authLoading, loadConfiguration]);

  // Verificar configuración al cargar
  useEffect(() => {
    if (agendaError) {
      setConfigurationErrorMessage(agendaError);
      setShowConfigurationErrorModal(true);
    }
  }, [agendaError]);

  // Log para depurar configuración de agenda
  useEffect(() => {
    if (agendaSettings) {
      console.log('=== Agenda Settings Loaded ===');
      console.log('agendaSettings:', agendaSettings);
      console.log('agendaSettings:', agendaSettings);
      console.log('consultation_days:', agendaSettings.consultation_days);
      console.log('start_time:', agendaSettings.start_time);
      console.log('end_time:', agendaSettings.end_time);
      console.log('slot_interval:', agendaSettings.slot_interval);
      console.log('==============================');
    }
  }, [agendaSettings]);
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
          // Usar getStatusColor para el color del evento
          backgroundColor: isPastEvent ? '#9CA3AF' : getStatusColor(appointment.estado as DetailedAppointmentStatus), 
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

  const handleEventDidMount = (info: EventMountArg) => {
    info.el.addEventListener('dblclick', () => {
      setCurrentAppointmentDetails(info.event);
      setShowAppointmentDetailsModal(true);
    });
  };

  // Función corregida para atenuar días bloqueados o no laborables
  const handleDayCellDidMount = (arg: DayCellMountArg) => {
    console.log('=== handleDayCellDidMount called ===', arg.date);
    console.log('=== handleDayCellDidMount called ===', arg.date);
    
    const formattedDate = format(arg.date, 'yyyy-MM-dd');
    const dayName = arg.date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    const isBlocked = isDateBlocked(formattedDate);
    const isWork = isWorkDay(formattedDate);
    const isNonWorkDay = !isWork;

    // Log para el calendario principal
    console.log(`Main Calendar Day: ${formattedDate} (${capitalizedDayName}) - isWorkDay: ${isWork}, isBlocked: ${isBlocked}`);
    if (isBlocked || isNonWorkDay) {
      // Aplica un color de fondo atenuado y un color de texto secundario
      arg.el.style.backgroundColor = currentTheme.id.includes('dark') ? '#2A2A2A' : '#F5F5F5';
      arg.el.style.color = currentTheme.colors.textSecondary;
      arg.el.style.opacity = '0.6';
      
      // Añadir una clase CSS para identificar estos días
      arg.el.classList.add('fc-day-blocked');
      
      // Opcional: agregar un título tooltip
      if (isBlocked) {
        arg.el.title = 'Fecha bloqueada - No disponible para citas';
      } else if (isNonWorkDay) {
        arg.el.title = 'No es día de consulta';
      }
    } else {
      // Asegura que los días activos tengan el color de fondo predeterminado del tema
      arg.el.style.backgroundColor = '';
      arg.el.style.color = '';
      arg.el.style.opacity = '';
      arg.el.classList.remove('fc-day-blocked');
      arg.el.title = '';
    }
  };
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDateTime = new Date(selectInfo.start);
    const selectedDateString = format(selectedDateTime, 'yyyy-MM-dd');
    const selectedTimeString = format(selectedDateTime, 'HH:mm');

    // Verificar si hay configuración cargada
    if (!agendaSettings) {
      setConfigurationErrorMessage('No se ha configurado la agenda. Por favor, configure primero los horarios de atención.');
      setShowConfigurationErrorModal(true);
      return;
    }

    // Verificar si es día de trabajo
    if (!isWorkDay(selectedDateString)) {
      setConfigurationErrorMessage('El día seleccionado no está configurado como día de atención médica.');
      setShowConfigurationErrorModal(true);
      return;
    }

    // Verificar si la fecha está bloqueada
    if (isDateBlocked(selectedDateString)) {
      setConfigurationErrorMessage('La fecha seleccionada está bloqueada. No se pueden agendar citas en esta fecha.');
      setShowConfigurationErrorModal(true);
      return;
    }

    if (!selectedPatient) {
      setShowPatientSelectionModal(true);
      setTempSelectedDate(selectedDateTime);
      return;
    }

    // Verificar si el slot seleccionado está en el pasado
    const now = new Date();
    if (selectedDateTime < now) {
      setShowPastSlotWarningModal(true);
      return;
    }

    // Verificar si está dentro del horario de trabajo
    const startTime = agendaSettings.start_time.substring(0, 5);
    const endTime = agendaSettings.end_time.substring(0, 5);
    
    if (selectedTimeString < startTime || selectedTimeString >= endTime) {
      setConfigurationErrorMessage(`El horario seleccionado está fuera del horario de atención (${startTime} - ${endTime}).`);
      setShowConfigurationErrorModal(true);
      return;
    }
   navigate('/citas', {
      state: {
        selectedDate: selectedDateTime, // Pasa la fecha y hora seleccionadas
        selectedPatient: selectedPatient // Pasa el paciente seleccionado
      }
    });

  };

  const handleQuickAppointmentSubmit = async () => {
    if (!selectedPatient) return;
    
    setSubmittingAppointment(true);
    setAppointmentError(null);
    
    try {
      await createSecureAppointment({
        id_paciente: selectedPatient.id,
        ...appointmentForm
      });
      
      setShowQuickAppointmentModal(false);
      await fetchAppointments(); // Recargar eventos
      
      // Limpiar formulario
      setAppointmentForm({
        fecha_cita: '',
        hora_cita: '',
        motivo: '',
        consultorio: 1,
        duracion_minutos: 30,
        tipo_consulta: 'primera',
        tiempo_evolucion: null,
        unidad_tiempo: null,
        sintomas_asociados: [],
        urgente: false,
        notas: ''
      });
    } catch (err) {
      setAppointmentError(err instanceof Error ? err.message : 'Error al agendar la cita');
    } finally {
      setSubmittingAppointment(false);
    }
  };

  // Mejorar el renderizado de eventos basado en configuración
  const enhanceEventRendering = (event: EventInput) => {
    const eventDate = format(new Date(event.start as string), 'yyyy-MM-dd');
    
    // Marcar eventos en fechas bloqueadas
    if (isDateBlocked(eventDate)) {
      return {
        ...event,
        backgroundColor: '#9CA3AF', // Gris para fechas bloqueadas
        borderColor: '#6B7280'
      };
    }
    
    // Mantener colores originales para fechas normales
    return event;
  };

  // Validar disponibilidad antes de mostrar el formulario
  const validateSlotBeforeForm = async (fecha: string, hora: string, consultorio: number, duracion: number) => {
    try {
      const availability = await checkSlotAvailability(fecha, hora, duracion, consultorio);
      return availability;
    } catch (err) {
      return { 
        available: false, 
        reason: 'Error al verificar disponibilidad' 
      };
    }
  };

  // Verificar configuración antes de permitir acciones
  const canPerformAgendaActions = () => {
    return agendaSettings && !agendaLoading && !agendaError;
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const isPastEvent = clickInfo.event.extendedProps?.isPastEvent || false;
    
    navigate('/citas', {
      state: {
        editMode: true,
        appointmentId: clickInfo.event.id,
        selectedPatient: clickInfo.event.extendedProps?.patient,
        viewOnly: isPastEvent
      }
    });
  };

  const handleEventDrop = async (dropInfo: any) => {
    const event = dropInfo.event;
    const oldEvent = dropInfo.oldEvent;
    const revert = dropInfo.revert;

    const newStartDate = format(event.start, 'yyyy-MM-dd');
    const newStartTime = format(event.start, 'HH:mm');
    const newEndTime = event.end ? format(event.end, 'HH:mm') : format(addMinutes(event.start, event.extendedProps?.duracion_minutos || 30), 'HH:mm');
    const durationMinutes = event.extendedProps.duracion_minutos || 30;
    const consultorio = event.extendedProps.consultorio || 1;

    // 1. Validaciones previas al intento de actualización
    if (!agendaSettings) {
      setConfigurationErrorMessage('No se ha cargado la configuración de la agenda. No se puede mover la cita.');
      setShowConfigurationErrorModal(true);
      revert();
      return;
    }

    if (!isWorkDay(newStartDate)) {
      setConfigurationErrorMessage('La nueva fecha no está configurada como día de atención médica.');
      setShowConfigurationErrorModal(true);
      revert();
      return;
    }

    if (isDateBlocked(newStartDate)) {
      setConfigurationErrorMessage('La nueva fecha está bloqueada. No se puede mover la cita aquí.');
      setShowConfigurationErrorModal(true);
      revert();
      return;
    }

    const now = new Date();
    if (event.start < now) {
      setConfigurationErrorMessage('No se puede mover una cita a un horario en el pasado.');
      setShowConfigurationErrorModal(true);
      revert();
      return;
    }

    // 2. Verificar disponibilidad del slot
    try {
      const availability = await checkSlotAvailability(newStartDate, newStartTime, durationMinutes, consultorio);
      if (!availability.available) {
        setConfigurationErrorMessage(`El slot seleccionado no está disponible: ${availability.reason || 'Conflicto con otra cita.'}`);
        setShowConfigurationErrorModal(true);
        revert();
        return;
      }

      // 3. Actualizar la cita en la base de datos
      await api.appointments.update(event.id, {
        fecha_cita: newStartDate,
        hora_cita: newStartTime,
        hora_fin: newEndTime,
      });

      // 4. Refrescar las citas para asegurar sincronización
      await fetchAppointments();
    } catch (error) {
      console.error('Error al mover la cita:', error);
      setConfigurationErrorMessage('Error al mover la cita. Por favor, inténtelo de nuevo.');
      setShowConfigurationErrorModal(true);
      revert();
    }
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
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/settings/schedule')}
                  disabled={!canPerformAgendaActions()}
                  title="Configurar"
                  className={clsx(
                    buttonClasses.base, 
                    'flex items-center p-2 text-sm',
                    !canPerformAgendaActions() && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ 
                    background: 'transparent',
                    border: `1px solid ${currentTheme.colors.border}`,
                    color: currentTheme.colors.text
                  }}
                >
                  <Settings className="h-5 w-5" />
                </button>
                <Link
                  to="/citas"
                  className={clsx(buttonClasses.base, 'flex items-center', 'px-4 py-2',
                    currentTheme.buttons.style === 'rounded' && 'rounded-lg',
                    currentTheme.buttons.style === 'pill' && 'rounded-full',
                    currentTheme.buttons.style === 'square' && 'rounded-none'
                  )}
                  style={{ background: currentTheme.colors.buttonPrimary, color: currentTheme.colors.buttonText }}
                >
                  <CalendarPlus className="h-5 w-5 mr-2" />
                  Nueva Cita
                </Link>
              </div>
            </div>
            
            {/* Mostrar estado de configuración */}
            {agendaLoading && (
              <div 
                className="p-4 border-b flex items-center gap-2"
                style={{ borderColor: currentTheme.colors.border }}
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
                <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                  Cargando configuración de agenda...
                </span>
              </div>
            )}
            
            {agendaSettings && (
              <div 
                className="p-2 border-b text-xs"
                style={{ 
                  borderColor: currentTheme.colors.border,
                  background: `${currentTheme.colors.primary}05`,
                  color: currentTheme.colors.textSecondary 
                }}
              >
                Horario: {agendaSettings.start_time.substring(0, 5)} - {agendaSettings.end_time.substring(0, 5)} | 
                Slots: {agendaSettings.slot_interval} min | 
                Días: {agendaSettings.consultation_days.join(', ')} | 
                Bloqueos: {blockedDates.length}
              </div>
            )}
            
            <div className="flex-1">
              {agendaSettings ? (
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
                editable={true}
                eventStartEditable={true}
                eventDurationEditable={true}
                editable={true}
                eventStartEditable={true}
                eventDurationEditable={true}
                  select={handleDateSelect}
                  eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventDrop={handleEventDrop}
                  datesSet={handleDatesSet}
                  slotDuration={`00:${(agendaSettings.slot_interval ?? 15).toString().padStart(2, '0')}:00`}
                  slotMinTime={agendaSettings.start_time} 
                  slotMaxTime={agendaSettings.end_time} 
                  eventDidMount={handleEventDidMount}
                  dayCellDidMount={handleDayCellDidMount}
                  slotLabelInterval={`00:${(agendaSettings.slot_interval ?? 15).toString().padStart(2, '0')}:00`}
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
                 nowIndicator={true}
                />
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
                  <span className="ml-3" style={{ color: currentTheme.colors.text }}>
                    Cargando configuración de agenda...
                  </span>
                </div>
              )}

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
                  /* Estilos adicionales para días bloqueados */
                  .fc-day-blocked {
                    position: relative;
                  }
                  .fc-day-blocked::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 2px,
                      ${currentTheme.colors.border} 2px,
                      ${currentTheme.colors.border} 4px
                    );
                    opacity: 0.1;
                    pointer-events: none;
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
            className={clsx(buttonClasses.base, buttonClasses.outline)}
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

      {/* ============== Modal de cita rápida =======================*/}
<Modal
  isOpen={showQuickAppointmentModal}
  onClose={() => {
    setShowQuickAppointmentModal(false);
    setAppointmentError(null);
  }}
  title="Agendar Cita Rápida"
  className="max-w-2xl"
  actions={
    <div className="flex justify-end gap-2">
      {/* Botón Cancelar */}
      <button
        type="button"
        onClick={() => {
          setShowQuickAppointmentModal(false);
          setAppointmentError(null);
        }}
        className={clsx(buttonClasses.base, buttonClasses.outline)}
      >
        Cancelar
      </button>
      {/* Botón Formulario Completo */}
      <button
        type="button"
        onClick={() => navigate('/citas', {
          state: {
            selectedDate: new Date(`${appointmentForm.fecha_cita}T${appointmentForm.hora_cita}`),
            selectedPatient: selectedPatient
          }          
        })}
        className={clsx(buttonClasses.base, buttonClasses.outline)}
      >
        Formulario Completo
      </button>
      {/* Botón Agendar */}
      <button
        type="button"
        onClick={handleQuickAppointmentSubmit}
        disabled={submittingAppointment || !appointmentForm.motivo.trim()}
        className={clsx(buttonClasses.base, buttonClasses.primary)}
        >
        {submittingAppointment ? 'Agendando...' : 'Agendar'}
      </button>
    </div>
  }
>
        <div className="space-y-4">
          {appointmentError && (
            <div 
              className="p-3 rounded-md text-sm border-l-4"
              style={{
                background: '#FEE2E2',
                borderLeftColor: '#DC2626',
                color: '#DC2626',
              }}
            >
              {appointmentError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Paciente
            </label>
            <div 
              className="p-3 rounded-md font-medium"
              style={{
                background: currentTheme.colors.background,
                color: currentTheme.colors.text,
              }}
            >
              {selectedPatient?.Nombre} {selectedPatient?.Paterno} {selectedPatient?.Materno}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha
              </label>
              <input
                type="date"
                value={appointmentForm.fecha_cita}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, fecha_cita: e.target.value }))}
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
                value={appointmentForm.hora_cita}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, hora_cita: e.target.value }))}
                className="w-full p-2 rounded-md border"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Consultorio
              </label>
              <select
                value={appointmentForm.consultorio}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, consultorio: Number(e.target.value) }))}
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
                Duración (minutos)
              </label>
              <select
                value={appointmentForm.duracion_minutos}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, duracion_minutos: Number(e.target.value) }))}
                className="w-full p-2 rounded-md border"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Tipo de Consulta
            </label>
            <select
              value={appointmentForm.tipo_consulta}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, tipo_consulta: e.target.value as any }))}
              className="w-full p-2 rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value="primera">Primera vez</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="control">Control</option>
              <option value="revision">Revisión</option>
              <option value="urgencia">Urgencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Motivo de la Consulta *
            </label>
            <input
              type="text"
              value={appointmentForm.motivo}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ej: Dolor de cabeza, control de presión..."
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
              Notas (opcional)
            </label>
            <textarea
              value={appointmentForm.notas || ''}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, notas: e.target.value }))}
              rows={2}
              className="w-full p-2 rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Modal de error de configuración */}
      <AlertModal
        isOpen={showConfigurationErrorModal}
        onClose={() => setShowConfigurationErrorModal(false)}
        type="warning"
        title="Configuración de Agenda"
        message={configurationErrorMessage}
      />

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
