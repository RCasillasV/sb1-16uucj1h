import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';
import type { EventInput } from '@fullcalendar/core';

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
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));

  // Update current month when main calendar view changes
  React.useEffect(() => {
    if (!isSameMonth(currentMonth, currentViewDates.start)) {
      setCurrentMonth(startOfMonth(currentViewDates.start));
    }
  }, [currentViewDates]);

  // Get calendar days including days from adjacent months
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // End on Sunday

    const days = [];
    let currentDate = calendarStart;

    while (currentDate <= calendarEnd) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  }, [currentMonth]);

  // Get events for selected date
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.start as string);
    return isSameDay(eventDate, selectedDate);
  }).sort((a, b) => {
    const dateA = new Date(a.start as string);
    const dateB = new Date(b.start as string);
    return dateA.getTime() - dateB.getTime();
  });

  // Week day headers
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Navigation handlers with synchronization
  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onDateSelect(newMonth); // Sync with main calendar
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onDateSelect(newMonth); // Sync with main calendar
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
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" style={{ color: currentTheme.colors.text }} />
          </button>
          <span 
            className="text-sm font-medium capitalize"
            style={{ color: currentTheme.colors.text }}
          >
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <ChevronRight className="h-4 w-4" style={{ color: currentTheme.colors.text }} />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasEvents = events.some(event => 
              isSameDay(new Date(event.start as string), day)
            );

            return (
              <button
                key={day.toString()}
                onClick={() => onDateSelect(day)}
                className={clsx(
                  'w-8 h-8 text-sm rounded-full flex items-center justify-center relative transition-colors',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'text-white'
                )}
                style={{
                  background: isSelected ? currentTheme.colors.primary : 'transparent',
                  color: isSelected 
                    ? currentTheme.colors.buttonText 
                    : isCurrentMonth 
                      ? currentTheme.colors.text 
                      : currentTheme.colors.textSecondary,
                }}
              >
                <span>{format(day, 'd')}</span>
                {hasEvents && !isSelected && (
                  <span 
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
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
        <div className="p-4">
          <h3 
            className="text-sm font-medium mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </h3>
          <div className="space-y-2">
            {selectedDateEvents.length === 0 ? (
              <p 
                className="text-sm text-center py-2"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                No hay citas programadas
              </p>
            ) : (
              selectedDateEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-2 p-2 rounded-md transition-colors"
                  style={{ 
                    background: `${currentTheme.colors.primary}10`,
                  }}
                >
                  <Clock 
                    className="h-4 w-4 mt-0.5 shrink-0" 
                    style={{ color: currentTheme.colors.primary }} 
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(event.start as string), 'HH:mm')}
                      </span>
                      <span 
                        className="text-sm font-medium truncate"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {event.extendedProps?.patient?.first_name} {event.extendedProps?.patient?.paternal_surname}
                      </span>
                    </div>
                    <p 
                      className="text-xs truncate"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      {event.extendedProps?.reason}
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