// src/services/heredoFamHistServ.ts
import { createService } from './crudService';
import { Cache } from '../lib/cache';

const cache = new Cache<any[]>(5 * 60 * 1000, 'heredo_familial_'); // Cache por 5 minutos
const svc = createService<'tpFcHeredoFamiliar'>('tpFcHeredoFamiliar', 'id_usuario', true);

export const heredoFamilialHistory = {
  async getAllByPatientId(patientId: string) {
    const key = `patient_${patientId}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const { data, error } = await svc.getAll(
      `id, created_at, updated_at, patient_id, id_usuario, idbu, miembro_fam, estado_vital, patologias, notas, edad`
    ).eq('patient_id', patientId); // Return array of records for all family members

    if (error) throw error;
    if (data) cache.set(key, data);
    return data || [];
  },

  async create(payload: any) {
    const result = await svc.create(payload);
    cache.clear(); // Limpiar cache al crear
    return result;
  },

  async update(id: bigint, payload: any) {
    console.log('heredoFamilialHistory service: Updating record with id:', id, 'payload:', payload);
    const result = await svc.update(id, payload);
    cache.clear(); // Limpiar cache al actualizar
    return result;
  },

  async createOrUpdate(payload: any) {
    console.log('heredoFamilialHistory service: createOrUpdate called with payload:', payload);
    if (payload.id) {
      console.log('heredoFamilialHistory service: Updating existing record');
      // Update existing record
      return await this.update(payload.id, payload);
    } else {
      console.log('heredoFamilialHistory service: Creating new record');
      // Create new record
      return await this.create(payload);
    }
  },
};
