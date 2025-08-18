// src/services/heredoFamilialHistoryService.ts
import { createService } from './crudService';
import { Cache } from '../lib/cache';

const cache = new Cache<any[]>(5 * 60 * 1000, 'heredo_familial_'); // Cache por 5 minutos
const svc = createService<'tpFcHeredoFamiliar'>('tpFcHeredoFamiliar');

export const heredoFamilialHistory = {
  async getByPatientId(patientId: string) {
    const key = `patient_${patientId}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const { data, error } = await svc.getAll(
      `id, created_at, updated_at, patient_id, id_usuario, idbu, miembro_fam, estado_vital, patologias, notas`
    ).eq('patient_id', patientId).single(); // Asumiendo que solo hay un registro por paciente

    if (error) throw error;
    if (data) cache.set(key, data);
    return data;
  },

  async create(payload: any) {
    const result = await svc.create(payload);
    cache.clear(); // Limpiar cache al crear
    return result;
  },

  async update(id: number, payload: any) {
    const result = await svc.update(id, payload);
    cache.clear(); // Limpiar cache al actualizar
    return result;
  },
};
