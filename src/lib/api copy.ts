// src/lib/api.ts

import { patients } from '../services/patientService';
import { appointments } from '../services/appointmentService';
import { patologies } from '../services/patologyService';
import { gynecoObstetricHistory } from '../services/gynecoObstetricService';
import { activityService } from '../services/activityService';
import { supabase } from './supabase';
import { Cache } from './cache';
import { requireSession, getIdbu, requireBusinessUnit } from './supabaseUtils';
import { DEFAULT_BU } from '../utils/constants';

// Cache instances
const cache = new Cache<any>(5 * 60 * 1000, 'api_');
const pathologicalHistoryCache = new Cache<any>(10 * 60 * 1000, 'pathological_history_');

// Base service class for common operations
class BaseService {
  constructor(protected tableName: string, protected cachePrefix: string) {}

  protected async getAll(select: string = '*', orderBy?: string) {
    const cacheKey = `${this.cachePrefix}_all`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    let query = supabase.from(this.tableName).select(select);
    if (orderBy) query = query.order(orderBy);

    const { data, error } = await query;
    if (error) throw error;

    cache.set(cacheKey, data || []);
    return data || [];
  }

  protected async getById(id: string, select: string = '*') {
    const cacheKey = `${this.cachePrefix}_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) cache.set(cacheKey, data);
    return data;
  }

  protected clearCache() {
    cache.clear();
  }
}

// Users service
const users = {
  async getCurrentUserAttributes(userId: string) {
    // console.log('api.users.getCurrentUserAttributes: Starting for userId:', userId);
    try {
      console.log('api.users.getCurrentUserAttributes: About to query tcUsuarios table');
      const { data, error } = await supabase
        .from('tcUsuarios')
        .select('nombre, email, telefono, rol, estado, idbu, deleted_at')
        .eq('idusuario', userId)
        .single();

      // console.log('api.users.getCurrentUserAttributes: Query completed. Error:', error, 'Data:', data);
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user attributes:', error);
        console.log('api.users.getCurrentUserAttributes: Returning null due to error');
        return {
          nombre: null,
          email: null,
          telefono: null,
          rol: null,
          estado: null,
          idbu: DEFAULT_BU,
          deleted_at: null
        };
      }

      // If data exists, ensure idbu is never null
      if (data) {
        const result = {
          ...data,
          idbu: data.idbu || DEFAULT_BU
        };
        console.log('api.users.getCurrentUserAttributes: Returning data with fallback idbu:', result);
        return result;
      }

      // If no data found, return default structure with DEFAULT_BU
      console.log('api.users.getCurrentUserAttributes: Returning data:', data);
      return {
        nombre: null,
        email: null,
        telefono: null,
        rol: null,
        estado: null,
        idbu: DEFAULT_BU,
        deleted_at: null
      };
    } catch (error) {
      // console.error('Error in getCurrentUserAttributes:', error);
      console.log('api.users.getCurrentUserAttributes: Exception caught, returning null');
      return {
        nombre: null,
        email: null,
        telefono: null,
        rol: null,
        estado: null,
        idbu: DEFAULT_BU,
        deleted_at: null
      };
    }
  }
};

// Clinical histories service
const clinicalHistories = {
  async getByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('clinical_histories')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data || [];
  },

  async create(payload: any) {
    const { data, error } = await supabase
      .from('clinical_histories')
      .insert([payload])
      .select()
      .limit(1);

    if (error) throw error;
    return data;
  },

  async update(id: string, payload: any, newStatusId?: number) {
    const { data, error } = await supabase
      .from('clinical_histories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Clinical evolution service
const clinicalEvolution = {
  async getByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('clinical_evolution')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(payload: any) {
    const { data, error } = await supabase
      .from('clinical_evolution')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
 
// Prescriptions service
const prescriptions = {
  async getByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        prescription_medications(
          *,
          medications(*)
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(payload: { 
    prescription_number: string;
    patient_id: string;
    diagnosis: string;
    special_instructions: string | null;
    medications: Array<{
      name: string;
      concentration: string;
      presentation: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: string;
      administration_route: string;
      instructions: string;
    }>;
  }) {
    const user = await requireSession();

    // Create prescription
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert([{
        prescription_number: payload.prescription_number,
        patient_id: payload.patient_id,
        diagnosis: payload.diagnosis,
        special_instructions: payload.special_instructions,
        user_id: user.id,
      }])
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;

    // Create medications and link them
    for (const med of payload.medications) {
      // First, find or create the medication
      let medication;
      const { data: existingMed, error: findError } = await supabase
        .from('medications')
        .select('id')
        .eq('name', med.name)
        .eq('concentration', med.concentration)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existingMed) {
        medication = existingMed;
      } else {
        const { data: newMed, error: createMedError } = await supabase
          .from('medications')
          .insert([{
            name: med.name,
            concentration: med.concentration,
            presentation: med.presentation,
            active_compound: med.name,
            user_id: user.id,
          }])
          .select()
          .single();

        if (createMedError) throw createMedError;
        medication = newMed;
      }

      // Link medication to prescription
      const { error: linkError } = await supabase
        .from('prescription_medications')
        .insert([{
          prescription_id: prescription.id,
          medication_id: medication.id,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          total_quantity: med.quantity,
          administration_route: med.administration_route,
          special_instructions: med.instructions,
          user_id: user.id,
        }]);

      if (linkError) throw linkError;
    }

    return prescription;
  }
};

// Medications service
const medications = {
  async search(searchTerm: string) {
    const { data, error } = await supabase
      .from('medications')
      .select('id, name:nombreComercial, concentration:concentracion, presentation:presentacion')
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) throw error;
    return data || [];
  }
};

// Files service
const files = {
  async getByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('tpDocPaciente')
      .select(`
        id,
        description,
        file_path,
        mime_type,
        thumbnail_url,
        created_at,
        fecha_ultima_consulta,
        numero_consultas,
        patient_id,
        user_id,
        deleted_at,
        ai_processed,
        tpDocPacienteMetadata (
          id
        )
      `)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match the expected interface
    const transformedData = (data || []).map((file: any) => {
      // Supabase puede devolver un objeto si hay solo 1 registro, o null si no hay ninguno
      // Necesitamos normalizar a array
      let metadataArray = file.tpDocPacienteMetadata;
      if (metadataArray && !Array.isArray(metadataArray)) {
        metadataArray = [metadataArray];
      }
      
      const hasMetadata = metadataArray && metadataArray.length > 0;
      console.log(`File ${file.id} (${file.description}):`, {
        ai_processed: file.ai_processed,
        metadata_raw: file.tpDocPacienteMetadata,
        metadata_array: metadataArray,
        has_metadata: hasMetadata
      });
      
      return {
        id: file.id,
        name: file.description,
        path: file.file_path,
        type: file.mime_type,
        url: file.file_path, // For compatibility with existing interfaces
        size: 0, // Not stored in DB, can be calculated if needed
        thumbnail_url: file.thumbnail_url,
        created_at: file.created_at,
        fecha_ultima_consulta: file.fecha_ultima_consulta,
        numero_consultas: file.numero_consultas,
        patient_id: file.patient_id,
        user_id: file.user_id,
        ai_processed: file.ai_processed || false,
        has_metadata: hasMetadata
      };
    });

    console.log('API FILES: Retrieved', transformedData.length, 'files for patient', patientId);
    return transformedData;
  },

  async create(payload: {
    patient_id: string;
    description: string;
    file_path: string;
    mime_type: string;
    thumbnail_url?: string | null;
  }) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit();

    const { data, error } = await supabase
      .from('tpDocPaciente')
      .insert([{
        patient_id: payload.patient_id,
        description: payload.description,
        file_path: payload.file_path,
        mime_type: payload.mime_type,
        thumbnail_url: payload.thumbnail_url || null,
        user_id: user.id,
        idbu: idbu,
        fecha_creacion: new Date().toISOString(),
        numero_consultas: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(fileId: string) {
    console.log('API FILES: Soft deleting file with ID:', fileId, 'Type:', typeof fileId);
    const deletedAt = new Date().toISOString();
    console.log('API FILES: Setting deleted_at to:', deletedAt);
    
    // First, verify the file exists
    const { data: existingFile, error: selectError } = await supabase
      .from('tpDocPaciente')
      .select('id, description, deleted_at')
      .eq('id', fileId)
      .single();
    
    console.log('API FILES: Existing file before delete:', existingFile);
    if (selectError) {
      console.error('API FILES: Error finding file:', selectError);
    }
    
    const { data, error, count } = await supabase
      .from('tpDocPaciente')
      .update({
        deleted_at: deletedAt,
        updated_at: deletedAt
      })
      .eq('id', fileId)
      .select();

    console.log('API FILES: Update result - Data:', data, 'Count:', count, 'Error:', error);

    if (error) {
      console.error('API FILES: Error soft deleting file:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('API FILES: No rows were updated! File ID might not exist or RLS policy blocking update');
    }
    
    console.log('API FILES: File soft deleted successfully:', data);
  },

  async updateName(fileId: string, newName: string) {
    const { error } = await supabase
      .from('tpDocPaciente')
      .update({
        description: newName,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (error) throw error;
  },

  async markAsAIProcessed(fileId: string) {
    const { error } = await supabase
      .from('tpDocPaciente')
      .update({
        ai_processed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId);

    if (error) throw error;
  },

  async trackAccess(fileId: string) {
    try {
      // Try using the RPC function first (if it exists)
      const { error: rpcError } = await supabase.rpc('increment_file_access', {
        file_id: fileId
      });

      if (rpcError && (rpcError.code === 'PGRST202' || rpcError.message?.includes('function increment_file_access'))) {
        // If RPC function doesn't exist, fall back to manual increment
        console.log('RPC function not found, using fallback method for file access tracking');
        // Get current values
        const { data: currentData, error: selectError } = await supabase
          .from('tpDocPaciente')
          .select('numero_consultas')
          .eq('id', fileId)
          .single();

        if (selectError) throw selectError;

        // Update with incremented values
        const { error: updateError } = await supabase
          .from('tpDocPaciente')
          .update({
            numero_consultas: (currentData.numero_consultas || 0) + 1,
            fecha_ultima_consulta: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', fileId);

        if (updateError) throw updateError;
        console.log('File access tracked successfully via fallback method');
      } else if (rpcError) {
        console.error('RPC function exists but failed:', rpcError);
        throw rpcError;
      } else {
        console.log('File access tracked successfully via RPC function');
      }
    } catch (error) {
      console.error('Error tracking file access:', error);
      // Don't throw here to avoid breaking the file viewing experience
    }
  }
};

// Stats service
const stats = {
  async getDashboardStats() {
    try {
      const [patientsCount, todayAppointments, upcomingAppointments] = await Promise.all([
        supabase.from('tcPacientes').select('id', { count: 'exact' }),
        supabase.from('tcCitas').select('id', { count: 'exact' })
          .eq('fecha_cita', new Date().toISOString().split('T')[0]),
        supabase.from('tcCitas').select('id', { count: 'exact' })
          .gte('fecha_cita', new Date().toISOString().split('T')[0])
        .eq('estado', 1) // 1 = 'Programada'
      ]); 

      return {
        totalPatients: patientsCount.count || 0,
        todayAppointments: todayAppointments.count || 0,
        todayAppointmentsConfirm: 0, // placeholder
        upcomingAppointments: upcomingAppointments.count || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalPatients: 0,
        todayAppointments: 0,
        todayAppointmentsConfirm: 0,
        upcomingAppointments: 0,
      };
    }
  }
};

// Federal entities service
const federalEntities = {
  async getAll() {
    const { data, error } = await supabase
      .from('tcEntidadFed')
      .select('Entidad_Federativa')
      .order('Entidad_Federativa');

    if (error) throw error;
    return data?.map(entity => entity.Entidad_Federativa) || [];
  }
};

// Business units service
const businessUnits = {
  async getById(idbu: string) {
    const { data, error } = await supabase
      .from('tcBu')
      .select('Especialidad')
      .eq('idBu', idbu)
      .single();

    if (error) throw error;
    return data?.Especialidad || 'Medicina General';
  }
};

// Insurances service
const insurances = {
  async getAllActive() {
    const { data, error } = await supabase
      .from('tcAseguradora')
      .select('idAs, Aseguradora')
      .eq('Activo', true)
      .order('Aseguradora');

    if (error) throw error;
    return data || [];
  }
};

// Consultorios service
const consultorios = {
  async getAll() {
    const { data, error } = await supabase
      .from('tcConsultorios')
      .select('*')
      .order('id');

    if (error) throw error;
    return data || [];
  },

  async updateBatch(consultorios: Array<{ id: number; consultorio: string; activo: boolean }>) {
    for (const consultorio of consultorios) {
      const { error } = await supabase
        .from('tcConsultorios')
        .update({
          consultorio: consultorio.consultorio,
          activo: consultorio.activo,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultorio.id);

      if (error) throw error;
    }
  }
};

// Agenda settings service
const agendaSettings = {
  async get() {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from('tcAgendaSettings')
      .select('*')
      .eq('idbu', idbu)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(settings: {
    start_time: string;
    end_time: string;
    consultation_days: string[];
    slot_interval: number;
  }) {
    const idbu = await getIdbu();

    const { data: existing } = await supabase
      .from('tcAgendaSettings')
      .select('id')
      .eq('idbu', idbu)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('tcAgendaSettings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const user = await requireSession();
      const { data, error } = await supabase
        .from('tcAgendaSettings')
        .insert([{
          ...settings,
          idbu,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }
};

// Blocked dates service
const blockedDates = {
  async getAll() {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from('tcAgendaBloqueada')
      .select('*')
      .eq('idbu', idbu)
      .is('deleted_at', null)
      .order('start_date');

    if (error) throw error;
    return data || [];
  },

  async create(payload: {
    start_date: string;
    end_date: string;
    reason: string;
    block_type: string;
  }) {
    const idbu = await getIdbu();

    const { data, error } = await supabase
      .from('tcAgendaBloqueada')
      .insert([{
        ...payload,
        idbu
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tcAgendaBloqueada')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
};

// Antecedentes no patológicos service
const antecedentesNoPatologicos = {
  async getByPatientId(patientId: string) {
    try {
      const { data, error } = await supabase
        .from('tpPacienteHistNoPatol')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        // Si PGRST116, significa que no hay registro, lo cual es esperado.
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data?.[0] || null;
    } catch (err: any) {
      // Handle the case where the query throws an exception
      if (err.code === 'PGRST116' || err.message?.includes('The result contains 0 rows')) {
        console.log('AntecedentesNoPatologicos: No record found for patient (PGRST116), returning null');
        return null;
      }
      console.error('AntecedentesNoPatologicos: Unexpected error:', err);
      throw err;
    }
   },

  async create(payload: any) {
    try {
      const { data, error } = await supabase
        .from('tpPacienteHistNoPatol')
        .insert([payload])
        .select()
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error: any) {
      // Si es un error de restricción de unicidad para esta tabla específica
      if (error.code === '23505' && error.message?.includes('unique_patient_non_path_history')) {
        console.log('Duplicate record detected, attempting to update existing record...');
        
        // Buscar el registro existente
        const existingRecord = await this.getByPatientId(payload.patient_id);
        
        if (existingRecord) {
          // Actualizar el registro existente
          return await this.update(payload.patient_id, payload);
        } else {
          // Si no encontramos el registro existente, relanzar el error original
          console.error('Unique constraint error but no existing record found');
          throw error;
        }
      }
      
      // Para cualquier otro error, relanzar
      throw error;
    }
  },

  async update(patientId: string, payload: any) {
    const { data, error } = await supabase
      .from('tpPacienteHistNoPatol')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)
      .select()
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }
};

// Heredo familial history service
const heredoFamilialHistory = {
  async getAllByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('tpFcHeredoFamiliar')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(payload: any) {
    const { data, error } = await supabase
      .from('tpFcHeredoFamiliar')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: number, payload: any) {
    const { data, error } = await supabase
      .from('tpFcHeredoFamiliar')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createOrUpdate(payload: any) {
    if (payload.id) {
      return await this.update(payload.id, payload);
    } else {
      return await this.create(payload);
    }
  }
};

// Export all services
export const api = {
  // Core services
  patients,
  appointments,
  patologies,
  users,

  // Clinical services
  clinicalHistories,
  clinicalEvolution,
  prescriptions,
  medications,

  // Configuration services
  agendaSettings,
  blockedDates,
  consultorios,

  // Additional services
  businessUnits,
  federalEntities,
  insurances,
  files,
  stats,

  // Patient history services
  antecedentesNoPatologicos,
  heredoFamilialHistory,
  gynecoObstetricHistory,

  // Activity service
  activities: activityService,

  // Pathological history service
  pathologicalHistory: {
    async getByPatientId(patientId: string) {
      const cacheKey = `patient_${patientId}`;
      const cached = pathologicalHistoryCache.get(cacheKey);
      if (cached) {
        console.log('PathologicalHistory: Returning cached data for patient:', patientId);
        return cached;
      }

      console.log('PathologicalHistory: Fetching fresh data for patient:', patientId);
      try {
        const { data, error } = await supabase
          .from('tpPacienteHistPatologica')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }) 
          .limit(1);

        if (error) {
          if (error.code === 'PGRST116') {
            pathologicalHistoryCache.set(cacheKey, null);
            return null;
          } 
          throw error;
        }
        const result = data && data.length > 0 ? data[0] : null;
        pathologicalHistoryCache.set(cacheKey, result);
        console.log('PathologicalHistory: Cached and returning data for patient:', patientId);
        return result;
      } catch (err: any) {
        // Handle the case where the query throws an exception
        if (err.code === 'PGRST116' || err.message?.includes('The result contains 0 rows')) {
          console.log('PathologicalHistory: No record found for patient (PGRST116), returning null');
          pathologicalHistoryCache.set(cacheKey, null);
          return null;
        }
        console.error('PathologicalHistory: Unexpected error:', err);
        throw err;
      }
    },

    async create(payload: any) {
      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .insert([payload])
        .select()
        .limit(1);

      if (error) throw error;
      const result = data && data.length > 0 ? data[0] : null;
      
      // Invalidar caché específica del paciente
      if (payload.patient_id) {
        pathologicalHistoryCache.delete(`patient_${payload.patient_id}`);
        console.log('PathologicalHistory: Cache invalidated for patient after create:', payload.patient_id);
      }
      
      return result;
    },

    async update(patientId: string, payload: any) {
      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', patientId)
        .select()
        .limit(1);

      if (error) throw error;
      const result = data && data.length > 0 ? data[0] : null;
      
      // Invalidar caché específica del paciente
      pathologicalHistoryCache.delete(`patient_${patientId}`);
      console.log('PathologicalHistory: Cache invalidated for patient after update:', patientId);
      
      return result;
    }
  },

  // Metadata de documentos médicos extraída con IA
  documentMetadata: {
    async create(data: {
      file_id: string;
      patient_id: string;
      datos_extraidos: any;
      tokens_usados?: number;
      costo_estimado?: number;
    }) {
      const user = await requireSession();
      const idbu = await requireBusinessUnit();

      const { data: result, error } = await supabase
        .from('tpDocPacienteMetadata')
        .insert([{
          ...data,
          user_id: user.id,
          idbu,
          revisado: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },

    async getByFileId(fileId: string) {
      const { data, error } = await supabase
        .from('tpDocPacienteMetadata')
        .select('*')
        .eq('file_id', fileId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    },

    async update(id: string, datos_extraidos: any, correcciones?: string) {
      const user = await requireSession();

      const { data, error } = await supabase
        .from('tpDocPacienteMetadata')
        .update({
          datos_extraidos,
          revisado: true,
          revisado_por: user.id,
          fecha_revision: new Date().toISOString(),
          correcciones,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('tpDocPacienteMetadata')
        .select(`
          *,
          tpDocPaciente!inner(
            description,
            file_path,
            mime_type,
            created_at
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  },
};