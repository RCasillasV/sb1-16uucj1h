import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAgenda } from '../contexts/AgendaContext';
import clsx from 'clsx';
import type { EventInput } from '@fullcalendar/core';
import type { DatesSetArg } from '@fullcalendar/core';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: EventInput[];
  currentViewDates: {
    start: Date;
    end: Date;
  };
}

export function MiniCalendar({ selectedDate, onDateSelect, events, currentViewDates }: MiniCalendarProps) {
  const { currentTheme } = useTheme();
  const { blockedDates, isDateBlocked, isWorkDay } = useAgenda();
  const navigate = useNavigate();
  
  // Derivar el mes mostrado directamente de currentViewDates.start
  const displayedMonth = startOfMonth(currentViewDates.start);

  // Handle today button click
  const handleTodayClick = () => {
    const today = new Date();
    onDateSelect(today);
  };

  // Get calendar days including days from adjacent months
  const calendarDays = React.useMemo(() => {
    const monthStart = displayedMonth;
    const monthEnd = endOfMonth(displayedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // End on Sunday

    const days = [];
    let currentDate = calendarStart;

    while (currentDate <= calendarEnd) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  }, [displayedMonth]);

  // Get events for selected date
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.start as string);
    return isSameDay(eventDate, selectedDate);
  }).sort((a, b) => {
    const dateA = new Date(a.start as string);
    const dateB = new Date(b.start as string);
    //return dateA.getTime() - dateB.getTime();
    return dateA.getTime() - dateB.getTime(); // Sort by time
  });

  // Week day headers
  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  // Navigation handlers with synchronization
  const handlePrevMonth = () => {
    const newMonthDate = subMonths(displayedMonth, 1);
    onDateSelect(newMonthDate);
  };

  const handleNextMonth = () => {
    const newMonthDate = addMonths(displayedMonth, 1);
    onDateSelect(newMonthDate);
  };

  return (
    <div 
      className="w-64 rounded-lg shadow-lg overflow-hidden"
      style={{ 
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
      }}
    >
      {/* Calendar Header */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" style={{ color: currentTheme.colors.text }} />
          </button>
          <div className="flex items-center gap-2">
            <span 
              className="text-[10px] font-medium capitalize leading-tight"
              style={{ color: currentTheme.colors.text }}
            >
              {format(displayedMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              type="button"
              onClick={handleTodayClick}
              className="text-[10px] px-2 py-0.5 rounded hover:bg-black/5 transition-colors"
              style={{ color: currentTheme.colors.primary }}
            >
              Hoy
            </button>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronRight className="h-3 w-3" style={{ color: currentTheme.colors.text }} />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[9px] font-medium leading-tight"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {calendarDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, displayedMonth);
            const dayString = format(day, 'yyyy-MM-dd');
            const dayName = day.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
            const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            
            const isDayBlocked = isDateBlocked(dayString);
            const isDayWorkDay = isWorkDay(dayString);

            // Log para el mini-calendario
            console.log(`Mini Calendar Day: ${dayString} (${capitalizedDayName}) - isWorkDay: ${isDayWorkDay}, isBlocked: ${isDayBlocked}`);
            const hasEvents = events.some(event => 
              isSameDay(new Date(event.start as string), day)
            );

            // Log para el mini-calendario
            console.log(`Mini Calendar Day: ${dayString} (${capitalizedDayName}) - isWorkDay: ${isDayWorkDay}, isBlocked: ${isDayBlocked}`);
            return (
              <button
                key={day.toString()}
                onClick={() => onDateSelect(day)}
                disabled={isDayBlocked || !isDayWorkDay}
                className={clsx(
                  'w-7 h-7 text-[10px] rounded-full flex items-center justify-center relative transition-colors disabled:cursor-not-allowed',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'text-white',
                  isDayBlocked && 'opacity-40',
                  !isDayWorkDay && 'opacity-40'
                )}
                style={{
                  background: isSelected 
                    ? currentTheme.colors.primary 
                    : isDayBlocked 
                      ? '#EF4444' 
                      : !isDayWorkDay 
                        ? '#9CA3AF' 
                        : 'transparent',
                  color: isSelected 
                    ? currentTheme.colors.buttonText 
                    : (isDayBlocked || !isDayWorkDay)
                      ? '#FFFFFF'
                    : isCurrentMonth 
                      ? currentTheme.colors.text 
                      : currentTheme.colors.textSecondary,
                }}
                title={
                  isDayBlocked 
                    ? 'Fecha bloqueada'
                    : !isDayWorkDay 
                      ? 'No es día de consulta' 
                      : undefined
                }
              >
                <span className="leading-none">{format(day, 'd')}</span>
                {hasEvents && !isSelected && isDayWorkDay && !isDayBlocked && (
                  <span 
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ 
                      background: isCurrentMonth 
                        ? currentTheme.colors.primary 
                        : currentTheme.colors.textSecondary 
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointments Panel */}
      <div 
        className="border-t"
        style={{ borderColor: currentTheme.colors.border }}
      >
        <div className="p-3">
          {/* Indicador de estado del día */}
          <div className="mb-2">
            {isDateBlocked(format(selectedDate, 'yyyy-MM-dd')) && (
              <div 
                className="text-[9px] px-2 py-1 rounded text-center font-medium"
                style={{ background: '#FEE2E2', color: '#DC2626' }}
              >
                Fecha Bloqueada
              </div>
            )}
            {!isWorkDay(format(selectedDate, 'yyyy-MM-dd')) && !isDateBlocked(format(selectedDate, 'yyyy-MM-dd')) && (
              <div 
                className="text-[9px] px-2 py-1 rounded text-center font-medium"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                No es día de consulta
              </div>
            )}
          </div>

          <h3 
            className="text-[10px] font-medium mb-2 leading-tight"
            style={{ color: currentTheme.colors.text }}
          >
            Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </h3>
          <div className="space-y-1.5">
            {selectedDateEvents.length === 0 ? (
              <p 
                className="text-[9px] text-center py-1.5 leading-tight"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {isDateBlocked(format(selectedDate, 'yyyy-MM-dd')) 
                  ? 'Fecha bloqueada'
                  : !isWorkDay(format(selectedDate, 'yyyy-MM-dd'))
                    ? 'No es día de consulta'
                    : 'No hay citas programadas'
                }
              </p>
            ) : (
              selectedDateEvents.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => {
                    navigate('/citas', {
                      state: {
                        editMode: true,
                        appointmentId: event.id,
                        selectedPatient: event.extendedProps?.patient,
                        viewOnly: event.extendedProps?.isPastEvent
                      }
                    });
                  }}
                  className="flex items-start gap-1.5 p-1.5 rounded cursor-pointer hover:bg-opacity-80 transition-colors"
                  style={{ 
                    background: `${currentTheme.colors.primary}10`,
                  }}
                >
                  <Clock 
                    className="h-3 w-3 mt-px shrink-0" 
                    style={{ color: currentTheme.colors.primary }} 
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-medium leading-tight">
                        {format(new Date(event.start as string), 'HH:mm')}
                      </span>
                      <span 
                        className="text-[10px] font-medium truncate leading-tight"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {event.extendedProps?.patient?.Nombre} {event.extendedProps?.patient?.Paterno} : {event.extendedProps?.tipo_consulta} 
                      </span>
                    </div>
                    <p 
                      className="text-[9px] truncate leading-tight"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                     {event.extendedProps?.reason}:                      {event.extendedProps?.tiempo_evolucion} {event.extendedProps?.unidad_tiempo}  
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 