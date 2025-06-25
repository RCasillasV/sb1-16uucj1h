import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import '@fullcalendar/common/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'
import '../styles/calendar.css'

const TestCalendar = () => {
  console.log('TestCalendar rendering')

  return (
    <div className="p-4 h-[calc(100vh-2rem)]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={[
            {
              title: 'Evento de prueba',
              start: new Date(),
              backgroundColor: '#3B82F6'
            }
          ]}
          height="100%"
          locale="es"
        />
      </div>
    </div>
  )
}

export default TestCalendar
