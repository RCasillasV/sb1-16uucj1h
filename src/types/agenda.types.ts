// src/types/agenda.types.ts

// Esto sería tu DB types generados por Supabase, por ejemplo:
// type AgendaSettingDB = Database['public']['Tables']['agenda_settings']['Row'];
// type ServiceDB = Database['public']['Tables']['services']['Row'];
// type ServiceInsert = Database['public']['Tables']['services']['Insert'];
// type AgendaSettingInsert = Database['public']['Tables']['agenda_settings']['Insert'];
// Para este ejemplo, los definimos manualmente:
 
export interface TcAgendaSettingDB {
    id: string;
    created_at: string;
    updated_at: string;
    idbu: string; // UUID
    start_time: string; // "HH:MM"
    end_time: string;   // "HH:MM"
    consultation_days: string[]; // text[]
    slot_interval_minutes: number;
    user_id: string | null;
  }
  
  export interface ServiceDB {
    id: string;
    created_at: string;
    updated_at: string;
    idbu: string; // UUID
    name: string;
    duration_minutes: number;
    base_cost: number;
    is_active: boolean;
    description: string | null;
    user_id: string | null;
  }
  
  // Estos son los tipos que usaremos en el estado de React (podrían ser ligeramente diferentes para facilitar la UI)
  export type DayOfWeek = "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
  
  export interface ServiceUI {
    id: string; // Para identificar en el frontend
    name: string;
    durationMinutes: number; // En minutos
    baseCost: number;
    isActive: boolean;
    isNew?: boolean; // Para marcar servicios que se acaban de añadir en la UI
    isDirty?: boolean; // Para marcar servicios que se han modificado
    hasError?: boolean; // Para validación en UI
  }
  
  export interface AgendaSettingsUI {
    startTime: string; // Ej: "09:00"
    endTime: string;   // Ej: "18:00"
    consultationDays: DayOfWeek[];
    slotIntervalMinutes: number;
    services: ServiceUI[];
  }
  