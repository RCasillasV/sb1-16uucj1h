// src/lib/api.ts

import { patients } from '../services/patientService';
import { appointments } from '../services/appointmentService';
import { patologies } from '../services/patologyService';
import { gynecoObstetricHistory } from '../services/gynecoObstetricService';
import { supabase } from './supabase';
import { Cache } from './cache';
import { requireSession, requireBusinessUnit } from './apiHelpers';
import { DEFAULT_BU } from '../utils/constants';

// Cache instances
const cache = new Cache<any>(5 * 60 * 1000, 'api_');

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
    console.log('api.users.getCurrentUserAttributes: Starting for userId:', userId);
    try {
      console.log('api.users.getCurrentUserAttributes: About to query tcUsuarios table');
      const { data, error } = await supabase
        .from('tcUsuarios')
        .select('nombre, email, telefono, rol, estado, idbu, deleted_at')
        .eq('idusuario', userId)
        .single();

      console.log('api.users.getCurrentUserAttributes: Query completed. Error:', error, 'Data:', data);
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
      console.error('Error in getCurrentUserAttributes:', error);
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

  async update(id: string, payload: any) {
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
      .select('id, name as nombreComercial, concentration as concentracion, presentation as presentacion')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  }
};

// Files service
const files = {
  async getByPatientId(patientId: string) {
    const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME;
    if (!BUCKET_NAME) {
      throw new Error('VITE_BUCKET_NAME environment variable is required');
    }

    console.log('API FILES: Starting getByPatientId for patient:', patientId);
    console.log('API FILES: Using bucket name:', BUCKET_NAME);
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
        deleted_at
      `)
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('API FILES: Found', (data || []).length, 'database records');
    
    // Generate signed URLs for each file and verify existence
    const transformedData = await Promise.all((data || []).map(async (file) => {
      console.log('API FILES: Processing file:', file.description, 'at path:', file.file_path);
      
      let signedUrl = null;
      let signedThumbnailUrl = null;
      let fileExists = false;
      
      try {
        // First, check if file exists in storage
        const parentPath = file.file_path.split('/').slice(0, -1).join('/');
        const fileName = file.file_path.split('/').pop();
        console.log('API FILES: Checking existence - parent path:', parentPath, 'file name:', fileName);
        
        const { data: fileExistsData, error: fileExistsError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(parentPath || '', {
            search: fileName
          });

        console.log('API FILES: File existence check result:', fileExistsData, 'error:', fileExistsError);
        if (!fileExistsError && fileExistsData && fileExistsData.length > 0) {
          fileExists = true;
          console.log('FILE API: File exists in storage:', file.file_path);
        } else {
          console.warn('FILE API: File not found in storage:', file.file_path);
          console.warn('API FILES: File existence check failed - file not found at path:', file.file_path);
          // Skip this file - it doesn't exist in storage
          return null;
        }
        
        // Generate signed URL for main file only if it exists (1 hour expiry)
        console.log('API FILES: Creating signed URL for path:', file.file_path);
        const { data: urlData, error: urlError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.file_path, 3600);
        
        console.log('API FILES: Signed URL response - data:', urlData, 'error:', urlError);
        
        if (urlError) {
          console.error('FILE API: Error generating signed URL for file:', file.id, urlError);
          // Skip this file if we can't generate a signed URL
          return null;
        } else if (urlData?.signedUrl) {
          signedUrl = urlData.signedUrl;
          console.log('FILE API: Generated signed URL for:', file.file_path);
        } else {
          console.warn('FILE API: No signed URL returned for:', file.file_path);
          return null;
        }
        
        // Generate signed URL for thumbnail if it exists
        if (file.thumbnail_url) {
          const thumbParentPath = file.thumbnail_url.split('/').slice(0, -1).join('/');
          const thumbFileName = file.thumbnail_url.split('/').pop();
          console.log('API FILES: Checking thumbnail existence - path:', thumbParentPath, 'name:', thumbFileName);
          
          // Check if thumbnail exists
          const { data: thumbExistsData, error: thumbExistsError } = await supabase.storage
            .from(BUCKET_NAME)
            .list(thumbParentPath || '', {
              search: thumbFileName
            });

          if (thumbExistsError || !thumbExistsData || thumbExistsData.length === 0) {
            console.warn('FILE API: Thumbnail not found in storage:', file.thumbnail_url);
            // Continue without thumbnail
          } else {
            // Generate signed URL for thumbnail
            console.log('API FILES: Creating signed URL for thumbnail:', file.thumbnail_url);
            const { data: thumbData, error: thumbError } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(file.thumbnail_url, 3600);
            
            if (thumbError) {
              console.error('FILE API: Error generating signed URL for thumbnail:', file.id, thumbError);
            } else if (thumbData?.signedUrl) {
              signedThumbnailUrl = thumbData.signedUrl;
              console.log('FILE API: Generated signed URL for thumbnail:', file.thumbnail_url);
            }
          }
        }
      } catch (urlError) {
        console.error('FILE API: Exception during URL generation for file:', file.id, urlError);
        return null; // Skip this file completely
      }
      
      // Only return file data if we successfully generated a signed URL
      if (!signedUrl) {
        console.warn('FILE API: Skipping file due to missing signed URL:', file.id);
        return null;
      }
      
      console.log('API FILES: Successfully processed file:', file.description);
      return {
        id: file.id,
        name: file.description,
        path: file.file_path,
        type: file.mime_type,
        url: signedUrl,
        size: 0, // Not stored in DB, can be calculated if needed
        thumbnail_url: signedThumbnailUrl,
        created_at: file.created_at,
        fecha_ultima_consulta: file.fecha_ultima_consulta,
        numero_consultas: file.numero_consultas,
        patient_id: file.patient_id,
        user_id: file.user_id,
        fileExists: fileExists
      };
    }));

    // Filter out null entries (files that don't exist or couldn't generate URLs)
    const validFiles = transformedData.filter(file => file !== null);

    console.log('API FILES: Retrieved', validFiles.length, 'valid files for patient', patientId);
    console.log('API FILES: Valid files summary:', validFiles.map(f => ({ id: f?.id, name: f?.name, path: f?.path })));
    return validFiles;
  },

  async create(payload: {
    patient_id: string;
    description: string;
    file_path: string;
    mime_type: string;
    thumbnail_url?: string | null;
  }) {
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

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
    const { error } = await supabase
      .from('tpDocPaciente')
      .update({
        deleted_at: new Date().toISOString(),
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
          .eq('estado', 'programada')
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
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

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
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

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
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

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
    const user = await requireSession();
    const idbu = await requireBusinessUnit(user.id);

    const { data, error } = await supabase
      .from('tcAgendaBloqueada')
      .insert([{
        ...payload,
        idbu,
        user_id: user.id
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
    const { data, error } = await supabase
      .from('tpPacienteHistNoPatol')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      // Si PGRST116 y el resultado contiene 0 filas, significa que no hay registro, lo cual es esperado.
      if (error.code === 'PGRST116' && error.details === 'The result contains 0 rows') {
        return null; // Devuelve null explícitamente para este caso
      }
      throw error; // Lanza cualquier otro tipo de error
    }
    return data?.[0] || null; // Devuelve el primer registro o null si no hay datos
   },

  async create(payload: any) {
    try {
      const { data, error } = await supabase
        .from('tpPacienteHistNoPatol')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      // Si es un error de restricción de unicidad para esta tabla específica
      if (error.code === '23505' && error.message?.includes('unique_patient_non_path_history')) {
        console.log('Duplicate record detected, attempting to update existing record...');
        
        // Buscar el registro existente
        const existingRecord = await this.getByPatientId(payload.patient_id);
        
        if (existingRecord) {
          // Actualizar el registro existente
          return await this.update(existingRecord.id, payload);
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

  async update(id: string, payload: any) {
    const { data, error } = await supabase
      .from('tpPacienteHistNoPatol')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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

  // Pathological history service
  pathologicalHistory: {
    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .select('*')
        .eq('id_paciente', patientId)
        .order('created_at', { ascending: false }) 
        .limit(1);

     if (error) {
        if (error.code === 'PGRST116' && error.details === 'The result contains 0 rows') {
          return null; // Devuelve null explícitamente para este caso
        } 
          throw error; // Lanza cualquier otro tipo de error
      }
      return data; // Si no hay error, devuelve los datos
    },

    async create(payload: any) {
      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, payload: any) {
      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .limit(1);

      if (error) throw error;
      return data;
    }
  },
};