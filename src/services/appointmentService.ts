// src/services/appointmentService.ts

import { createService } from './crudService';
import { Cache } from '../lib/cache';
import { handle, requireSession, requireBusinessUnit } from '../lib/apiHelpers';
import { supabase } from '../lib/supabase';

const cache = new Cache<any[]>(20 * 60 * 1000, 'appts_');
// CAMBIO AQUÍ: Especificar 'id_user' como el nombre de la columna de usuario
const svc = createService<'tcCitas'>('tcCitas', 'id_user');

// Nueva función auxiliar interna para consultas de citas
async function _fetchAppointments(patientId?: string) {
  let query = supabase
    .from('tcCitas')
    .select(
      `id, fecha_cita, hora_cita, estado, motivo, notas, urgente, consultorio,
      tipo_consulta, tiempo_evolucion, unidad_tiempo, sintomas_asociados, hora_fin,
      duracion_minutos, patients:id_paciente(id,Nombre,Paterno,Materno)`
    )
    .order('fecha_cita', { ascending: true })
    .order('hora_cita', { ascending: true });

  if (patientId) {
    query = query.eq('id_paciente', patientId);
  }

  return query;
}

export const appointments = {
  async getAll() {
    const key = 'all';
    const cached = cache.get(key);
    if (cached) return cached;

    const { data, error } = await _fetchAppointments(); // Usar la nueva función auxiliar

    if (error) {
      throw error;
    }

    cache.set(key, data);
    return data;
  },
  
  async getById(id: string) {
    return svc.getById(
      `
      *,
      patients:id_paciente(id,Nombre,Paterno,Materno)
      `,
      id
    );
  },

  async getByPatientId(patientId: string) {
    const key = `patient_${patientId}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const { data, error } = await _fetchAppointments(patientId); // Usar la nueva función auxiliar
    
    if (error) {
      throw error;
    }
    
    cache.set(key, data || []);
    return data || [];
  },

  async getByDateAndConsultorio(fecha: string, consultorio: number) {
    const key = `date_consultorio_${fecha}_${consultorio}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await handle(
      supabase
        .from('tcCitas')
        .select(`
          *,
          patients:id_paciente(id,Nombre,Paterno,Materno)
        `)
        .eq('fecha_cita', fecha)
        .eq('consultorio', consultorio)
        .order('hora_cita', { ascending: true }),
      []
    );
    
    cache.set(key, data);
    return data;
  },

  async createSecure(dto: {
    id_paciente: string;
    fecha_cita: string;
    hora_cita: string;
    motivo: string;
    consultorio: number;
    duracion_minutos: number;
    tipo_consulta: string;
    tiempo_evolucion?: number | null;
    unidad_tiempo?: 'horas' | 'dias' | 'semanas' | 'meses' | null;
    sintomas_asociados?: string[];
    urgente?: boolean;
    notas?: string | null;
  }) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

    // Map parameters to match the expected p_ prefixed signature of agendar_cita function
    const rpcPayload = {
      p_id_paciente: dto.id_paciente,
      p_fecha_cita: dto.fecha_cita,
      p_hora_cita: dto.hora_cita,
      p_motivo: dto.motivo,
      p_consultorio: dto.consultorio,
      p_duracion_minutos: dto.duracion_minutos,
      p_tipo_consulta: dto.tipo_consulta,
      p_tiempo_evolucion: dto.tiempo_evolucion,
      p_unidad_tiempo: dto.unidad_tiempo,
      p_sintomas_asociados: dto.sintomas_asociados,
      p_urgente: dto.urgente,
      p_notas: dto.notas,
      // Note: p_id_user and p_idbu are NOT included here because the function
      // obtains them internally via auth.uid() and a query to tcUsuarios
    };

    const data = await handle(
      supabase.rpc('agendar_cita', rpcPayload),
      null
    );
    
    // Invalidar cachés relevantes
    cache.delete('all');
    cache.delete(`patient_${dto.id_paciente}`);
    cache.delete(`date_consultorio_${dto.fecha_cita}_${dto.consultorio}`);
    
    return data;
  },

  async create(payload: any) {
    const result = await svc.create(payload);
    
    // Invalidar cachés relevantes
    cache.delete('all');
    if (payload.id_paciente) {
      cache.delete(`patient_${payload.id_paciente}`);
    }
    if (payload.fecha_cita && payload.consultorio) {
      cache.delete(`date_consultorio_${payload.fecha_cita}_${payload.consultorio}`);
    }
    
    return result;
  },

  async update(id: string, dto: any) {
    // Obtener datos de la cita original para invalidar cachés correctamente
    const originalAppointment = await this.getById(id);
    
    const result = await svc.update(id, dto);
    
    // Invalidar cachés relevantes
    cache.delete('all');
    
    // Invalidar caché del paciente original
    if (originalAppointment?.id_paciente) {
      cache.delete(`patient_${originalAppointment.id_paciente}`);
    }
    
    // Invalidar caché del paciente nuevo (si cambió)
    if (dto.id_paciente && dto.id_paciente !== originalAppointment?.id_paciente) {
      cache.delete(`patient_${dto.id_paciente}`);
    }
    
    // Invalidar caché de fecha y consultorio original
    if (originalAppointment?.fecha_cita && originalAppointment?.consultorio) {
      cache.delete(`date_consultorio_${originalAppointment.fecha_cita}_${originalAppointment.consultorio}`);
    }
    
    // Invalidar caché de fecha y consultorio nuevo (si cambió)
    if (dto.fecha_cita && dto.consultorio && 
        (dto.fecha_cita !== originalAppointment?.fecha_cita || dto.consultorio !== originalAppointment?.consultorio)) {
      cache.delete(`date_consultorio_${dto.fecha_cita}_${dto.consultorio}`);
    }
    
    return result;
  },

  async checkSlotAvailability(
    fecha: string,
    hora_inicio: string,
    duracion_minutos: number,
    consultorio: number
  ) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

    return handle(
      supabase.rpc('verificar_slot', {
        p_fecha: fecha,
        p_hora_inicio: hora_inicio,
        p_duracion_minutos: duracion_minutos,
        p_consultorio: consultorio,
        p_idbu: idbu,
      }),
      { available: false, reason: '' }
    );
  },
};
