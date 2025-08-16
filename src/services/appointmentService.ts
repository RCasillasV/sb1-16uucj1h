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
      id, fecha_cita, hora_cita, estado,
      patients:id_paciente(id,Nombre,Paterno,Materno)
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

  async createSecure(dto: {
    id_paciente: string;
    fecha_cita: string;
    hora_cita: string;
    motivo: string;
    consultorio: number;
    duracion_minutos: number;
    tipo_consulta: string;
    [key: string]: any;
  }) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

    const data = await handle(
      supabase.rpc('agendar_cita', {
        ...dto,
        p_id_user: user.id,
        p_idbu: idbu,
      }),
      null
    );
    cache.delete('all');
    return data;
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