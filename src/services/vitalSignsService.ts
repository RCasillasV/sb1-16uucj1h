import { supabase } from '../lib/supabase';
import type {
  VitalSignCatalog,
  VitalSignRecord,
  VitalSignFormData,
} from '../types/vitalSigns.types';

export const vitalSignsService = {
  async getCatalog(idbu: string): Promise<VitalSignCatalog[]> {
    const { data, error } = await supabase
      .from('tcSignosVitales')
      .select('*')
      .eq('idbu', idbu)
      .eq('activo', true)
      .order('Descripcion');

    if (error) throw error;
    return data || [];
  },

  async getCatalogById(id: string): Promise<VitalSignCatalog | null> {
    const { data, error } = await supabase
      .from('tcSignosVitales')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createCatalogItem(
    item: Omit<VitalSignCatalog, 'id' | 'created_at' | 'updated_at'>
  ): Promise<VitalSignCatalog> {
    const { data, error } = await supabase
      .from('tcSignosVitales')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCatalogItem(
    id: string,
    updates: Partial<VitalSignCatalog>
  ): Promise<VitalSignCatalog> {
    const { data, error } = await supabase
      .from('tcSignosVitales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deactivateCatalogItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('tcSignosVitales')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  },

  async getPatientRecords(
    pacienteId: string,
    limit?: number
  ): Promise<VitalSignRecord[]> {
    let query = supabase
      .from('tpSignosVitales')
      .select(
        `
        *,
        tcSignosVitales (
          id,
          Descripcion,
          Unidad,
          valor_minimo_normal,
          valor_maximo_normal,
          valor_critico_bajo,
          valor_critico_alto
        )
      `
      )
      .eq('paciente_id', pacienteId)
      .is('deleted_at', null)
      .order('fecha_hora', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getPatientRecordsByType(
    pacienteId: string,
    idSignoVital: string,
    limit?: number
  ): Promise<VitalSignRecord[]> {
    let query = supabase
      .from('tpSignosVitales')
      .select(
        `
        *,
        tcSignosVitales (
          id,
          Descripcion,
          Unidad,
          valor_minimo_normal,
          valor_maximo_normal,
          valor_critico_bajo,
          valor_critico_alto
        )
      `
      )
      .eq('paciente_id', pacienteId)
      .eq('id_signo_vital', idSignoVital)
      .is('deleted_at', null)
      .order('fecha_hora', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createRecord(
    pacienteId: string,
    idbu: string,
    userId: string,
    formData: VitalSignFormData
  ): Promise<VitalSignRecord> {
    const catalogItem = await this.getCatalogById(formData.id_signo_vital);
    if (!catalogItem) {
      throw new Error('Signo vital no encontrado en el catálogo');
    }

    const esCritico =
      (catalogItem.valor_critico_bajo !== null &&
        formData.valor_medido < catalogItem.valor_critico_bajo) ||
      (catalogItem.valor_critico_alto !== null &&
        formData.valor_medido > catalogItem.valor_critico_alto);

    const recordData = {
      paciente_id: pacienteId,
      user_id: userId,
      idbu,
      id_signo_vital: formData.id_signo_vital,
      valor_medido: formData.valor_medido,
      fecha_hora: formData.fecha_hora,
      metodo_usado: formData.metodo_usado || null,
      notas: formData.notas || null,
      id_cita: formData.id_cita || null,
      es_critico: esCritico,
    };

    const { data, error } = await supabase
      .from('tpSignosVitales')
      .insert(recordData)
      .select(
        `
        *,
        tcSignosVitales (
          id,
          Descripcion,
          Unidad,
          valor_minimo_normal,
          valor_maximo_normal,
          valor_critico_bajo,
          valor_critico_alto
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async updateRecord(
    id: string,
    updates: Partial<VitalSignFormData>
  ): Promise<VitalSignRecord> {
    const { data, error } = await supabase
      .from('tpSignosVitales')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        tcSignosVitales (
          id,
          Descripcion,
          Unidad,
          valor_minimo_normal,
          valor_maximo_normal,
          valor_critico_bajo,
          valor_critico_alto
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async softDeleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('tpSignosVitales')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async getCriticalRecords(idbu: string, limit: number = 50): Promise<VitalSignRecord[]> {
    const { data, error } = await supabase
      .from('tpSignosVitales')
      .select(
        `
        *,
        tcSignosVitales (
          id,
          Descripcion,
          Unidad,
          valor_minimo_normal,
          valor_maximo_normal,
          valor_critico_bajo,
          valor_critico_alto
        ),
        tcPacientes (
          id,
          Nombre,
          ApellidoPaterno,
          ApellidoMaterno
        )
      `
      )
      .eq('idbu', idbu)
      .eq('es_critico', true)
      .is('deleted_at', null)
      .order('fecha_hora', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
