import { createService } from './crudService';
import { Cache } from '../lib/cache';
import { supabase } from '../lib/supabase';
import { handle } from '../lib/apiHelpers';

const cache = new Cache<any[]>(30 * 60 * 1000, 'patologies_');
const svc = createService<'tcPatologias'>('tcPatologias');

export const patologies = {
  async getAll() {
    const key = 'all';
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await svc.getAll(
      `id, nombre, especialidad, sexo, activo, created_at`
    );
    cache.set(key, data);
    return data;
  },

  async getAllActive() {
    const key = 'active';
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await handle(
      supabase
        .from('tcPatologias')
        .select('id, nombre, especialidad, sexo')
        .eq('activo', true)
        .order('nombre'),
      []
    );
    cache.set(key, data);
    return data;
  },

  async getById(id: string) {
    const key = `by_${id}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await svc.getById(`*`, id);
    if (data) cache.set(key, data);
    return data;
  },

  async create(payload: any) {
    const result = await svc.create(payload);
    cache.clear();
    return result;
  },

  async update(id: string, payload: any) {
    const result = await svc.update(id, payload);
    cache.clear();
    return result;
  },

  async delete(id: string) {
    const result = await handle(
      supabase
        .from('tcPatologias')
        .delete()
        .eq('id', id),
      null
    );
    cache.clear();
    return result;
  },

  async search(searchTerm: string) {
    const key = `search_${searchTerm}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const data = await handle(
      supabase
        .from('tcPatologias')
        .select('id, nombre, codcie10, especialidad, sexo')
        .eq('activo', true)
        .or(`nombre.ilike.%${searchTerm}%,especialidad.ilike.%${searchTerm}%`)
        .order('nombre')
        .limit(20),
      []
    );
    cache.set(key, data);
    return data;
  },
};