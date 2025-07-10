import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
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
  onMonthChange?: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect, events, currentViewDates, onMonthChange }: MiniCalendarProps) {
  const { currentTheme } = useTheme();
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));
  const localNavigation = useRef(false); // New ref to track local navigation

  React.useEffect(() => {
    // Only update currentMonth from external changes if not initiated locally
    if (!localNavigation.current) {
      if (!isSameMonth(currentMonth, currentViewDates.start)) {
        setCurrentMonth(startOfMonth(currentViewDates.start));
      }
    } else {
      // Reset localNavigation after it has been processed
      localNavigation.current = false;
    }
  }, [currentViewDates, currentMonth]);

  // Handle today button click
  const handleTodayClick = () => {
    const today = new Date();
    localNavigation.current = true; // Mark as local navigation
    setCurrentMonth(startOfMonth(today));
    onDateSelect(today);
    onMonthChange?.(today);
  };

  // Get calendar days including days from adjacent months
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth); //endOfMonth(monthStart);
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
    //return dateA.getTime() - dateB.getTime();
    return dateA.getTime() - dateB.getTime(); // Sort by time
  });

  // Week day headers
  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  // Navigation handlers with synchronization
  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    localNavigation.current = true; // Mark as local navigation
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    localNavigation.current = true; // Mark as local navigation
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
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
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
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
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const hasEvents = events.some(event => 
              isSameDay(new Date(event.start as string), day)
            );

            return (
              <button
                key={day.toString()}
                onClick={() => onDateSelect(day)}
                className={clsx(
                  'w-7 h-7 text-[10px] rounded-full flex items-center justify-center relative transition-colors',
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
                <span className="leading-none">{format(day, 'd')}</span>
                {hasEvents && !isSelected && (
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
                No hay citas programadas
              </p>
            ) : (
              selectedDateEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-1.5 p-1.5 rounded"
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
 