import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addMinutes, isWithinInterval, addDays, addWeeks, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarPlus,Plus, Clock, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

const START_HOUR = 8; // 8 AM
const END_HOUR = 23; // 10 PM
const INTERVAL_MINUTES = 30;
const DAYS_TO_SHOW = 6;
const MAX_DAYS_AHEAD = 60;

const TIME_SLOTS = Array.from(
  { length: (END_HOUR - START_HOUR) * 2 },
  (_, i) => {
    const hour = Math.floor(i / 2) + START_HOUR;
    const minutes = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
);

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  reason: string;
  status: string;
  patients?: {
    first_name: string;
    paternal_surname: string;
    last_name: string;
  };
}

interface AppointmentFormData {
  date: Date;
  time: string;
  duration: number;
  reason: string;
}

export function Calendar() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: new Date(),
    time: '09:00',
    duration: 30,
    reason: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<Array<{ date: Date; time: string }>>([]);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const timeMarkersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    const timeGrid = timeGridRef.current;
    const timeMarkers = timeMarkersRef.current;

    if (!timeGrid || !timeMarkers) return;

    const handleScroll = () => {
      requestAnimationFrame(() => {
        if (timeMarkers) {
          timeMarkers.style.transform = `translateY(-${timeGrid.scrollTop}px)`;
        }
      });
    };

    timeGrid.addEventListener('scroll', handleScroll);
    return () => timeGrid.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timeGrid = timeGridRef.current;
    if (!timeGrid) return;

    const now = new Date();
    const currentHour = now.getHours();
    const scrollPosition = (currentHour - START_HOUR) * 96;
    timeGrid.scrollTop = scrollPosition;
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.appointments.getAll();
      setAppointments(data);
      generateSuggestedSlots(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestedSlots = (existingAppointments: Appointment[]) => {
    const slots: Array<{ date: Date; time: string }> = [];
    let currentDate = new Date();
    let daysToCheck = 7;
    const now = new Date();

    while (slots.length < 5 && daysToCheck > 0) {
      TIME_SLOTS.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = new Date(currentDate);
        slotDate.setHours(hours, minutes, 0, 0);

        if (isAfter(slotDate, now)) {
          const isAvailable = !existingAppointments.some(app => 
            isWithinInterval(parseISO(app.appointment_date), {
              start: slotDate,
              end: addMinutes(slotDate, 30)
            })
          );

          if (isAvailable && slots.length < 5) {
            slots.push({ date: slotDate, time });
          }
        }
      });

      currentDate = addDays(currentDate, 1);
      daysToCheck--;
    }

    setSuggestedSlots(slots);
  };

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: es });
    const end = endOfWeek(selectedDate, { locale: es });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const getDayAppointments = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.appointment_date), date)
    );
  };

  const getAppointmentForTimeSlot = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);

    return appointments.find(appointment => {
      const appointmentDate = parseISO(appointment.appointment_date);
      return isWithinInterval(appointmentDate, { start: slotStart, end: slotEnd });
    });
  };

  const isTimeSlotAvailable = (date: Date, time: string) => {
    return !getAppointmentForTimeSlot(date, time);
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    const appointment = getAppointmentForTimeSlot(date, time);
    
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowAppointmentDetails(true);
      return;
    }

    if (!selectedPatient) {
      setFormError('Por favor seleccione un paciente antes de agendar una cita');
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    setSelectedTimeSlot(selectedDateTime);
    setFormData({
      date: selectedDateTime,
      time,
      duration: 30,
      reason: '',
    });
    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = async () => {
    if (!selectedPatient || !selectedTimeSlot) {
      setFormError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      await api.appointments.create({
        patient_id: selectedPatient.id,
        appointment_date: selectedTimeSlot.toISOString(),
        reason: formData.reason,
        status: 'scheduled',
      });

      await fetchAppointments();
      setShowAppointmentModal(false);
      setFormData({
        date: new Date(),
        time: '09:00',
        duration: 30,
        reason: '',
      });
      setSelectedTimeSlot(null);
      setFormError(null);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setFormError('Error al crear la cita. Por favor intente nuevamente.');
    }
  };

  const handleReschedule = async (newDate: Date, newTime: string) => {
    if (!selectedAppointment) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const appointmentDate = new Date(newDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    try {
      await api.appointments.update(selectedAppointment.id, {
        appointment_date: appointmentDate.toISOString(),
      });
      await fetchAppointments();
      setShowAppointmentDetails(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setFormError('Error al reprogramar la cita. Por favor intente nuevamente.');
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: currentTheme.colors.text }} />
          </button>
          <span 
            className="text-2xl font-medium"
            style={{ color: currentTheme.colors.text }}
          >
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" style={{ color: currentTheme.colors.text }} />
          </button>
        </div>

        <button
          onClick={() => setShowAppointmentModal(true)}
          className={clsx(buttonStyle.base, 'whitespace-nowrap')}
          style={buttonStyle.primary}
        >
          <CalendarPlus className="h-5 w-5 mr-2" />
          Nueva Cita
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex gap-6 flex-1">
        {/* Monthly Calendar */}
        <div className="flex flex-col w-64">
          <div 
            className="rounded-lg shadow-lg overflow-hidden"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <div 
              className="p-4 border-b text-center"
              style={{ borderColor: currentTheme.colors.border }}
            >
              <span 
                className="text-lg font-medium"
                style={{ color: currentTheme.colors.text }}
              >
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                  <div 
                    key={day}
                    className="text-xs font-medium"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const dayAppointments = getDayAppointments(day);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={clsx(
                        'aspect-square flex flex-col items-center justify-center rounded-full relative',
                        isSelected && 'font-bold',
                        !isSameMonth(day, currentDate) && 'opacity-50'
                      )}
                      style={{
                        background: isSelected 
                          ? currentTheme.colors.primary 
                          : isToday
                            ? `${currentTheme.colors.primary}20`
                            : 'transparent',
                        color: isSelected
                          ? currentTheme.colors.buttonText
                          : currentTheme.colors.text,
                      }}
                    >
                      <span>{format(day, 'd')}</span>
                      {dayAppointments.length > 0 && (
                        <div 
                          className="absolute bottom-1 w-1 h-1 rounded-full"
                          style={{ background: currentTheme.colors.primary }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day's Appointments Summary */}
          <div 
            className="mt-4 rounded-lg shadow-lg p-4"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h3 
              className="text-sm font-medium mb-3"
              style={{ color: currentTheme.colors.text }}
            >
              Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
            </h3>
            <div className="space-y-3">
              {getDayAppointments(selectedDate).map(appointment => (
                <div 
                  key={appointment.id}
                  className="text-sm space-y-1"
                >
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                    <span className="font-medium" style={{ color: currentTheme.colors.text }}>
                      {format(parseISO(appointment.appointment_date), 'HH:mm')}
                    </span>
                  </div>
                  <div style={{ color: currentTheme.colors.text }}>
                    {appointment.patients?.first_name} {appointment.patients?.paternal_surname}
                  </div>
                  <div style={{ color: currentTheme.colors.textSecondary }}>
                    {appointment.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly View */}
        <div className="flex-1 rounded-lg shadow-lg overflow-hidden relative">
          {/* Week Header */}
          <div 
            className="grid grid-cols-7 border-b sticky top-0 z-20"
            style={{ 
              borderColor: currentTheme.colors.border,
              background: currentTheme.colors.surface,
              marginLeft: '4rem', // Space for time markers
            }}
          >
            {weekDays.map(day => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className="p-3 text-center border-r last:border-r-0"
                  style={{ borderColor: currentTheme.colors.border }}
                >
                  <div 
                    className="text-xs uppercase"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {format(day, 'EEEE', { locale: es })}
                  </div>
                  <div 
                    className={clsx(
                      'text-xl font-medium inline-flex items-center justify-center w-8 h-8 rounded-full',
                      isToday && 'font-bold'
                    )}
                    style={{
                      background: isToday ? `${currentTheme.colors.primary}20` : 'transparent',
                      color: currentTheme.colors.text,
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid Container */}
          <div 
            ref={timeGridRef}
            className="relative overflow-auto"
            style={{ height: 'calc(100vh - 16rem)' }}
          >
            {/* Fixed Time Column */}
            <div 
              className="absolute left-0 top-0 w-16 z-10"
              style={{ 
                background: currentTheme.colors.surface,
                borderRight: `1px solid ${currentTheme.colors.border}`,
              }}
            >
              {TIME_SLOTS.map(time => (
                <div 
                  key={time}
                  className="h-12 flex items-center justify-end pr-2"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  <span className="text-xs font-medium">{time}</span>
                </div>
              ))}
            </div>

            {/* Appointments Grid */}
            <div className="ml-16"> {/* Offset to account for time column */}
              {TIME_SLOTS.map(time => (
                <div 
                  key={time}
                  className="grid grid-cols-7 border-b last:border-b-0"
                  style={{ 
                    borderColor: currentTheme.colors.border,
                    height: '48px', // Fixed height for consistency
                  }}
                >
                  {weekDays.map(day => {
                    const isAvailable = isTimeSlotAvailable(day, time);
                    const appointment = getAppointmentForTimeSlot(day, time);
                    
                    return (
                      <button
                        key={`${day.toISOString()}-${time}`}
                        onClick={() => handleTimeSlotClick(day, time)}
                        className={clsx(
                          'border-r last:border-r-0 relative group transition-colors h-full',
                          isAvailable && 'hover:bg-opacity-5'
                        )}
                        style={{ 
                          borderColor: currentTheme.colors.border,
                          background: isAvailable 
                            ? 'transparent'
                            : `${currentTheme.colors.primary}10`,
                        }}
                      >
                        {appointment && (
                          <div 
                            className="absolute inset-0 p-1 flex flex-col justify-center overflow-hidden"
                            style={{ color: currentTheme.colors.text }}
                          >
                            <div className="text-[10px] leading-tight font-medium truncate">
                              {appointment.patients?.first_name} {appointment.patients?.paternal_surname}
                            </div>
                            <div 
                              className="text-[9px] leading-tight truncate"
                              style={{ color: currentTheme.colors.textSecondary }}
                            >
                              {appointment.reason}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
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
                  {selectedPatient.first_name} {selectedPatient.paternal_surname}
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
                format(selectedTimeSlot, "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
              ) : (
                <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                  Seleccione un horario en el calendario
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Duración
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              className="w-full p-2 rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
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

      {/* Appointment Details Modal */}
      <Modal
        isOpen={showAppointmentDetails}
        onClose={() => {
          setShowAppointmentDetails(false);
          setSelectedAppointment(null);
        }}
        title="Detalles de la Cita"
        actions={
          <button
            onClick={() => {
              setShowAppointmentDetails(false);
              setSelectedAppointment(null);
            }}
            className={buttonStyle.base}
            style={buttonStyle.primary}
          >
            Cerrar
          </button>
        }
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>
                Paciente
              </label>
              <div className="font-medium" style={{ color: currentTheme.colors.text }}>
                {selectedAppointment.patients?.first_name} {selectedAppointment.patients?.paternal_surname}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>
                Fecha y Hora Actual
              </label>
              <div className="font-medium" style={{ color: currentTheme.colors.text }}>
                {format(parseISO(selectedAppointment.appointment_date), "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>
                Motivo
              </label>
              <div className="font-medium" style={{ color: currentTheme.colors.text }}>
                {selectedAppointment.reason}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.textSecondary }}>
                Estado
              </label>
              <div 
                className={clsx(
                  'inline-flex px-2 py-1 rounded-full text-sm font-medium',
                  selectedAppointment.status === 'scheduled' && 'bg-green-100 text-green-800',
                  selectedAppointment.status === 'completed' && 'bg-blue-100 text-blue-800',
                  selectedAppointment.status === 'cancelled' && 'bg-red-100 text-red-800'
                )}
              >
                {selectedAppointment.status === 'scheduled' ? 'Programada' :
                 selectedAppointment.status === 'completed' ? 'Completada' : 'Cancelada'}
              </div>
            </div>

            {selectedAppointment.status === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.textSecondary }}>
                  Horarios Disponibles para Reprogramar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedSlots.map(({ date, time }) => (
                    <button
                      key={`${date.toISOString()}-${time}`}
                      onClick={() => handleReschedule(date, time)}
                      className="p-2 text-sm rounded-md border transition-colors"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                    >
                      <div className="font-medium">
                        {format(date, "EEEE d 'de' MMMM", { locale: es })}
                      </div>
                      <div style={{ color: currentTheme.colors.textSecondary }}>
                        {time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}