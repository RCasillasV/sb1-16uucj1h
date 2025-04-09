import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { EventInput } from '@fullcalendar/core';
import clsx from 'clsx';

interface PickCalendarProps {
  events: EventInput[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  calendarRef: React.RefObject<FullCalendar>;
}

export function PickCalendar({ events, selectedDate, onDateSelect, calendarRef }: PickCalendarProps) {
  const { currentTheme } = useTheme();

  // Filter events for the selected date
  const selectedDateEvents = events.filter(event => {
    const eventDate = new Date(event.start as string);
    return format(eventDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  }).sort((a, b) => {
    const dateA = new Date(a.start as string);
    const dateB = new Date(b.start as string);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div 
      className="w-full rounded-lg shadow-lg overflow-hidden"
      style={{ 
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
      }}
    >
      {/* Mini Calendar */}
      <div className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next'
          }}
          locale={es}
          firstDay={1}
          height="auto"
          dayMaxEvents={0}
          events={events}
          dateClick={(info) => onDateSelect(info.date)}
          dayCellClassNames={(arg) => {
            const hasEvents = events.some(event => {
              const eventDate = new Date(event.start as string);
              return format(eventDate, 'yyyy-MM-dd') === format(arg.date, 'yyyy-MM-dd');
            });

            const isSelected = format(arg.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

            return clsx(
              hasEvents && 'has-events',
              isSelected && 'selected-date'
            );
          }}
          views={{
            dayGrid: {
              dayHeaderFormat: { weekday: 'short' },
              fixedWeekCount: false,
              showNonCurrentDates: false,
            }
          }}
        />
      </div>

      {/* Custom styles for calendar */}
      <style>
        {`
          .has-events {
            position: relative;
          }
          .has-events::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: ${currentTheme.colors.primary};
          }
          .selected-date {
            background-color: ${currentTheme.colors.primary} !important;
            color: ${currentTheme.colors.buttonText} !important;
          }
          .fc .fc-daygrid-day.fc-day-today {
            background-color: ${currentTheme.colors.primary}20 !important;
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
        `}
      </style>

      {/* Daily Appointments List */}
      <div 
        className="border-t"
        style={{ borderColor: currentTheme.colors.border }}
      >
        <div 
          className="p-4"
          style={{ color: currentTheme.colors.text }}
        >
          <h3 className="font-short mb-2">
            Citas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </h3>
          <div className="space-y-3">
            {selectedDateEvents.length === 0 ? (
              <p 
                className="text-sm text-center py-4"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                No hay citas programadas para este día
              </p>
            ) : (
              selectedDateEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                  style={{ 
                    background: `${currentTheme.colors.primary}10`,
                  }}
                >
                  <Clock 
                    className="h-5 w-5 mt-0.5 shrink-0" 
                    style={{ color: currentTheme.colors.primary }} 
                  />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">
                        {format(new Date(event.start as string), 'HH:mm')}
                      </span>
                      <span className="font-medium truncate">
                        {event.extendedProps?.patient?.first_name} {event.extendedProps?.patient?.paternal_surname}
                      </span>
                    </div>
                    <p 
                      className="text-sm truncate"
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