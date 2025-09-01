import { createService } from './crudService';
import { Cache } from '../lib/cache';
import { handle, requireSession, requireBusinessUnit } from '../lib/apiHelpers';
import { supabase } from '../lib/supabase';

const cache = new Cache<any[]>(20 * 60 * 1000, 'appts_');
const svc = createService<'tcCitas'>('tcCitas');

export const appointments = {
  async getAll() {
    const key = 'all';
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await svc.getAll(
      ` 
      id, fecha_cita, hora_cita, estado,motivo, notas, urgente, consultorio,
      tipo_consulta, tiempo_evolucion, unidad_tiempo, sintomas_asociados, hora_fin, 
      duracion_minutos, patients:id_paciente(id,Nombre,Paterno,Materno)
      `
    );
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

    const data = await handle(
      supabase
        .from('tcCitas')
        .select(`
          *,
          patients:id_paciente(id,Nombre,Paterno,Materno)
        `)
        .eq('id_paciente', patientId)
        .order('fecha_cita', { ascending: true })
        .order('hora_cita', { ascending: true }),
      []
    );
    
    cache.set(key, data);
    return data;
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
    cache.delete('all');
    return data;
  },

  async create(payload: any) {
    const result = await svc.create(payload);
    cache.delete('all');
    return result;
  },

  async update(id: string, dto: any) {
    const result = await svc.update(id, dto);
    cache.delete('all');
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