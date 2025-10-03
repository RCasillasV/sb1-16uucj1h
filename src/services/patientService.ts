import { createService } from './crudService';
import { Cache } from '../lib/cache';

const cache = new Cache<any[]>(20 * 60 * 1000, 'patients_');
const svc = createService<'tcPacientes'>('tcPacientes');

export const patients = {
  async getAll() {
    const key = 'all';
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await svc.getAll(
      `id, Nombre, Paterno, Materno, FechaNacimiento, Sexo, Telefono, Email`
    );
    cache.set(key, data);
    return data;
  },

  async getById(id: string) {
    const key = `by_${id}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await svc.getById(`*, user_id, idbu`, id);
    if (data) cache.set(key, data);
    return data;
  },

  async create(payload: any) {
    const result = await svc.create(payload);
    cache.delete('all');
    return result;
  },

  async update(id: string, payload: any) {
    const result = await svc.update(id, payload);
    cache.delete('all');
    cache.delete(`by_${id}`);

    if (!result) {
      throw new Error('No se pudo actualizar el paciente');
    }

    return result;
  },
};