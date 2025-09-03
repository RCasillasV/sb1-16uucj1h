// src/services/gynecoObstetricService.ts
import { createService } from './crudService';
import { Cache } from '../lib/cache';
import { supabase } from '../lib/supabase';
import { handle } from '../lib/apiHelpers';
import { requireSession, requireBusinessUnit } from '../lib/apiHelpers';

// Define un tipo para la tabla para mejor tipado
type GynecoObstetricHistoryTable = 'tpPacienteHistGineObst';

// Crea una instancia de caché específica para este servicio
const cache = new Cache<any[]>(5 * 60 * 1000, 'gyneco_obstetric_'); // Cache por 5 minutos

export const gynecoObstetricHistory = {
  /**
   * Obtiene el historial gineco-obstétrico de un paciente específico.
   * Se espera que solo haya un registro por paciente.
   * @param patientId El ID del paciente.
   * @returns El registro de historial gineco-obstétrico o null si no se encuentra.
   */
  async getByPatientId(patientId: string) {
    const key = `patient_${patientId}`;
    const cached = cache.get(key);
    if (cached) return cached;

    // Force session refresh to ensure uid() is up-to-date for RLS
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('GYNECO_SERVICE: Session not found or error during refresh:', sessionError);
      throw new Error('User session not found or could not be refreshed.');
    }

    const user = await requireSession();
    const user_idbu = await requireBusinessUnit(user.id);

    console.log('GYNECO_SERVICE: Fetching for patientId:', patientId, 'and user_idbu (from app):', user_idbu); // LOG 1
    console.log('GYNECO_SERVICE: Current authenticated user ID:', user.id); // Log the UID

    const { data, error } = await supabase
      .from('tpPacienteHistGineObst')
      .select('*')
      .eq('patient_id', patientId)
      .eq('idbu', user_idbu) // Añadir filtro explícito por idbu
      .single(); // Since patient_id is now unique, we can use .single()

    console.log('GYNECO_SERVICE: Raw Supabase data:', data);
    console.log('GYNECO_SERVICE: Raw Supabase error:', error);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const record = data || null;
    if (record) cache.set(key, record);
    return record;
  },

  /**
   * Crea un nuevo registro de historial gineco-obstétrico.
   * @param payload Los datos del nuevo registro.
   * @returns El registro creado.
   */
  async create(payload: any) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

    const { data, error } = await supabase
      .from('tpPacienteHistGineObst')
      .insert([{ ...payload, user_id: user.id, idbu: idbu }])
      .select()
      .single();

    if (error) throw error;
    cache.clear(); // Limpiar caché al crear un nuevo registro
    return data;
  },

  /**
   * Actualiza un registro de historial gineco-obstétrico existente.
   * @param patientId El ID del paciente (ahora identificador único).
   * @param payload Los datos a actualizar.
   * @returns El registro actualizado.
   */
  async update(patientId: string, payload: any) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

    const { data, error } = await supabase
      .from('tpPacienteHistGineObst')
      .update({ ...payload, user_id: user.id, idbu: idbu, updated_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .select()
      .single();

    if (error) throw error;
    cache.clear(); // Limpiar caché al actualizar un registro
    return data;
  },

  /**
   * Elimina un registro de historial gineco-obstétrico.
   * @param patientId El ID del paciente.
   */
  async deleteByPatientId(patientId: string) {
    const { error } = await supabase
      .from('tpPacienteHistGineObst')
      .delete()
      .eq('patient_id', patientId);

    if (error) throw error;
    cache.clear(); // Limpiar caché al eliminar un registro
  },
};
