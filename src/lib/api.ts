// src/lib/api.ts

import { patients } from '../services/patientService';
import { appointments } from '../services/appointmentService';
import { patologies } from '../services/patologyService';
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
      .order('created_at', { ascending: false });

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
    // This is a placeholder - implement based on your file storage solution
    return [];
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