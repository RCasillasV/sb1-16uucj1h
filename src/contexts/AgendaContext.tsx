import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Database } from '../types/database.types';

interface AgendaSettings {
  id: string;
  start_time: string;
  end_time: string;
  consultation_days: string[];
  slot_interval: number;
}

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  block_type: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface AgendaContextType {
  // Configuración
  agendaSettings: AgendaSettings | null;
  blockedDates: BlockedDate[];
  
  // Estados
  loading: boolean;
  error: string | null;
  
  // Funciones
  loadConfiguration: () => Promise<void>;
  isDateBlocked: (date: string) => boolean;
  isWorkDay: (date: string) => boolean;
  generateTimeSlots: (date: string, consultorio: number) => Promise<TimeSlot[]>;
  createSecureAppointment: (appointmentData: any) => Promise<any>;
  checkSlotAvailability: (fecha: string, hora: string, duracion: number, consultorio: number) => Promise<{ available: boolean; reason?: string }>;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export function AgendaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [agendaSettings, setAgendaSettings] = useState<AgendaSettings | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [settings, blocked] = await Promise.all([
        api.agendaSettings.get(),
        api.blockedDates.getAll()
      ]);
      
      setAgendaSettings(settings);
      setBlockedDates(blocked);
    } catch (err) {
      console.error('Error loading agenda configuration:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar configuración de agenda');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar configuración al cambiar de usuario
  useEffect(() => {
    if (user) {
      loadConfiguration();
    }
  }, [user, loadConfiguration]);

  const isDateBlocked = useCallback((date: string): boolean => {
    return blockedDates.some(block => 
      date >= block.start_date && date <= block.end_date
    );
  }, [blockedDates]);

  const isWorkDay = useCallback((date: string): boolean => {
    if (!agendaSettings) return false;
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    
    return agendaSettings.consultation_days.includes(capitalizedDay);
  }, [agendaSettings]);

  const generateTimeSlots = useCallback(async (date: string, consultorio: number): Promise<TimeSlot[]> => {
    if (!agendaSettings) return [];

    // Verificar si es día de trabajo
    if (!isWorkDay(date)) {
      return [];
    }

    // Verificar si la fecha está bloqueada
    if (isDateBlocked(date)) {
      return [];
    }

    // Generar slots basados en configuración
    const slots: TimeSlot[] = [];
    const startTime = agendaSettings.start_time.substring(0, 5); // HH:MM
    const endTime = agendaSettings.end_time.substring(0, 5);     // HH:MM
    const intervalMinutes = agendaSettings.slot_interval;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Verificar si el slot está en el pasado
      const slotDateTime = new Date(`${date}T${timeString}:00`);
      const now = new Date();
      
      if (slotDateTime < now) {
        slots.push({
          time: timeString,
          available: false,
          reason: 'Horario pasado'
        });
      } else {
        // Verificar disponibilidad en el backend
        try {
          const availability = await api.appointments.checkSlotAvailability(
            date, 
            timeString, 
            intervalMinutes, 
            consultorio
          );
          
          slots.push({
            time: timeString,
            available: availability.available,
            reason: availability.reason
          });
        } catch (err) {
          slots.push({
            time: timeString,
            available: false,
            reason: 'Error al verificar disponibilidad'
          });
        }
      }

      // Incrementar tiempo
      currentMinute += intervalMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
  }, [agendaSettings, isWorkDay, isDateBlocked]);

  const createSecureAppointment = useCallback(async (appointmentData: any) => {
    try {
      const result = await api.appointments.createSecure(appointmentData);
      
      // Recargar configuración para actualizar estado
      await loadConfiguration();
      
      return result;
    } catch (err) {
      throw err;
    }
  }, [loadConfiguration]);

  const checkSlotAvailability = useCallback(async (
    fecha: string, 
    hora: string, 
    duracion: number, 
    consultorio: number
  ) => {
    try {
      return await api.appointments.checkSlotAvailability(fecha, hora, duracion, consultorio);
    } catch (err) {
      return { 
        available: false, 
        reason: err instanceof Error ? err.message : 'Error al verificar disponibilidad' 
      };
    }
  }, []);

  const value = {
    agendaSettings,
    blockedDates,
    loading,
    error,
    loadConfiguration,
    isDateBlocked,
    isWorkDay,
    generateTimeSlots,
    createSecureAppointment,
    checkSlotAvailability,
  };

  return (
    <AgendaContext.Provider value={value}>
      {children}
    </AgendaContext.Provider>
  );
}

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (context === undefined) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};