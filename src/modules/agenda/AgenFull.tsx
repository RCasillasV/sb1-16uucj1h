import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { es } from 'date-fns/locale';
import type { EventInput, DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { useTheme } from '../../contexts/ThemeContext';

// Componente aislado para probar FullCalendar
export default function AgenFull() {
  const { currentTheme } = useTheme();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<EventInput[]>([
    {
      id: '1',
      title: 'Ejemplo de cita',
      start: new Date().setHours(10, 0, 0, 0),
      end: new Date().setHours(10, 30, 0, 0),
      backgroundColor: '#10B981',
    },
    {
      id: '2',
      title: 'Otra cita',
      start: new Date().setHours(12, 0, 0, 0),
      end: new Date().setHours(12, 30, 0, 0),
      backgroundColor: '#3B82F6',
    },
  ]);

  // Handlers mínimos para selección y click de eventos
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    alert('Seleccionaste: ' + selectInfo.startStr);
  };
  const handleEventClick = (clickInfo: EventClickArg) => {
    alert('Evento: ' + clickInfo.event.title);
  };
  const handleDatesSet = (arg: DatesSetArg) => {
    // No-op para demo
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', background: '#fff', borderRadius: 8, padding: 16 }}>
      <style>
        {`
          .fc-timegrid-slot-label,
          .fc-timegrid-axis-cushion,
          .fc .fc-timegrid-slot-label-cushion {
            font-size: 0.75rem !important;
            color: ${currentTheme.colors.text} !important;
          }
          .fc .fc-button {
            background-color: ${currentTheme.colors.primary} !important;
            border-color: ${currentTheme.colors.primary} !important;
            color: ${currentTheme.colors.buttonText} !important;
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
            background: ${currentTheme.colors.text};
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
          week: 'Semana'
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
          hour12: false,
        }}
        views={{
          timeGridWeek: {
            dayHeaderFormat: { weekday: 'short', day: 'numeric' },
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            },
          },
        }}
        height="auto"
      />
    </div>
  );
}
