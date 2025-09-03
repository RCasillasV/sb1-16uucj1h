// src/services/gynecoObstetricService.ts
import { createService } from './crudService';
import { Cache } from '../lib/cache';
import { supabase } from '../lib/supabase';
import { handle } from '../lib/apiHelpers';
import { requireSession, requireBusinessUnit } from '../lib/apiHelpers';

// Define un tipo para la tabla para mejor tipado
type GynecoObstetricHistoryTable = 'tpPacienteHistGineObst';

// Crea una instancia del servicio CRUD genérico para esta tabla
// Asume que 'user_id' es la columna que relaciona el registro con el usuario
// y que 'idbu' también se maneja automáticamente.
const svc = createService<GynecoObstetricHistoryTable>('tpPacienteHistGineObst', 'user_id', true);

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

    // Usamos .limit(1) y .single() para manejar el caso de 0 o 1 fila,
    // pero si hubiera más de 1, solo tomaría la primera.
    // Para este caso, asumimos que solo habrá un registro por paciente.
    const { data, error } = await handle(
      supabase
        .from('tpPacienteHistGineObst')
        .select('*')
        .eq('patient_id', patientId)
        .eq('idbu', user_idbu) // Añadir filtro explícito por idbu
        .limit(1), // Limita a 1 resultado
      [] // Valor por defecto si no hay datos
    );

    if (error) throw error;

    const record = data && data.length > 0 ? data[0] : null;
    if (record) cache.set(key, record);
    return record;
  },

  /**
   * Crea un nuevo registro de historial gineco-obstétrico.
   * @param payload Los datos del nuevo registro.
   * @returns El registro creado.
   */
  async create(payload: any) {
    const result = await svc.create(payload);
    cache.clear(); // Limpiar caché al crear un nuevo registro
    return result;
  },

  /**
   * Actualiza un registro de historial gineco-obstétrico existente.
   * @param id El ID del registro a actualizar.
   * @param payload Los datos a actualizar.
   * @returns El registro actualizado.
   */
  async update(id: string, payload: any) {
    const result = await svc.update(id, payload);
    cache.clear(); // Limpiar caché al actualizar un registro
    return result;
  },

  /**
   * Elimina un registro de historial gineco-obstétrico.
   * @param id El ID del registro a eliminar.
   */
  async delete(id: string) {
    const result = await handle(
      supabase
        .from('tpPacienteHistGineObst')
        .delete()
        .eq('id', id),
      null
    );
    cache.clear(); // Limpiar caché al eliminar un registro
    return result;
  },
};
