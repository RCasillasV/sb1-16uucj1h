import { supabase } from './supabase';
import { format, startOfDay, subDays } from 'date-fns'; // Import subDays
import type { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type Appointment = Tables['tcCitas']['Row'];
type Patient = Tables['tcPacientes']['Row'];
type MedicalRecord = Tables['medical_records']['Row'];
type ClinicalHistory = Tables['clinical_histories']['Row'];
type ClinicalEvolution = Tables['clinical_evolution']['Row'];
type Prescription = Tables['prescriptions']['Row'];
type PrescriptionMedication = Tables['prescription_medications']['Row'];
type Medication = Tables['medications']['Row'];


// Cache configuration
const CACHE_DURATION = 20 * 60 * 1000; // 20 minutos de cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Persistent cache utilities
const STORAGE_PREFIX = 'doctorsoft_cache_';

const persistentCache = {
  set: (key: string, data: any, timestamp: number) => {
    try {
      const cacheData = { data, timestamp };
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  get: (key: string): { data: any; timestamp: number } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },

  delete: (key: string) => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
};

// Enhanced cache utilities
const cacheUtils = {
  get: (key: string) => {
    // First try memory cache
    const memoryCache = cache.get(key);
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
      metrics.cacheHits++;
      return memoryCache.data;
    }

    // Then try persistent cache
    const persistentData = persistentCache.get(key);
    if (persistentData && Date.now() - persistentData.timestamp < CACHE_DURATION) {
      // Load back into memory cache for faster future access
      cache.set(key, persistentData);
      metrics.cacheHits++;
      return persistentData.data;
    }

    metrics.cacheMisses++;
    return null;
  },

  set: (key: string, data: any) => {
    const timestamp = Date.now();
    // Save to both memory and persistent cache
    cache.set(key, { data, timestamp });
    persistentCache.set(key, data, timestamp);
  },

  delete: (key: string) => {
    cache.delete(key);
    persistentCache.delete(key);
  },

  invalidatePattern: (pattern: string) => {
    // Invalidate memory cache
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
    
    // Invalidate persistent cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(storageKey => {
        if (storageKey.startsWith(STORAGE_PREFIX) && storageKey.includes(pattern)) {
          localStorage.removeItem(storageKey);
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate persistent cache pattern:', error);
    }
  }
};
// Performance metrics
const metrics = {
  appointmentFetchTime: 0,
  appointmentUpdateTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  validationErrors: [] as string[],
};

// Batch processing configuration
const BATCH_SIZE = 10;
const updateQueue: Array<{ id: string; data: any }> = [];
let batchUpdateTimeout: NodeJS.Timeout | null = null;

// Validation helpers
const validateAppointmentDateTime = (dateString: string, timeString: string): boolean => {
  // Combine date and time to create a complete DateTime
  const appointmentDateTime = new Date(`${dateString}T${timeString}:00`);
  const now = new Date();
  return appointmentDateTime >= now;
};

const validateAppointmentOverlap = (appointments: Appointment[], newAppointment: { fecha_cita: string, hora_cita: string }): boolean => {
  const newDateTime = new Date(`${newAppointment.fecha_cita}T${newAppointment.hora_cita}:00`);
  const thirtyMinutes = 30 * 60 * 1000;
  
  return !appointments.some(existing => {
    const existingDateTime = new Date(`${existing.fecha_cita}T${existing.hora_cita}:00`);
    const timeDiff = Math.abs(newDateTime.getTime() - existingDateTime.getTime());
    return timeDiff < thirtyMinutes;
  });
};

/*const logValidationError = (error: string) => {
  metrics.validationErrors.push(`${new Date().toISOString()}: ${error}`);
  console.error('Validation Error:', error);
};*/

// Batch processing function
const processBatchUpdates = async () => {
  if (updateQueue.length === 0) return;

  const batch = updateQueue.splice(0, BATCH_SIZE);
  const startTime = performance.now();

  try {
    await Promise.all(batch.map(async ({ id, data }) => {
      const { error } = await supabase
        .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
        .update(data)
        .eq('id', id);

      if (error) throw error;
    }));

    metrics.appointmentUpdateTime = performance.now() - startTime;
  } catch (error) {
    console.error('Batch update error:', error);
    // Re-queue failed updates
    updateQueue.push(...batch);
  }

  if (updateQueue.length > 0) {
    batchUpdateTimeout = setTimeout(processBatchUpdates, 1000);
  }
};

// Get user's business unit ID
const getUserBusinessUnit = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('No authenticated user found');
  }

  const { data: userData, error } = await supabase.rpc('get_user_idbu', {
    user_id: session.user.id
  });

  if (error) {
    console.error('Error fetching user business unit:', error);
    throw new Error('Could not determine user business unit');
  }

  if (!userData?.idbu) {
    throw new Error('User has no assigned business unit');
  }

  return userData.idbu;
};

export const api = {
  files: {
    async getByPatientId(patientId: string) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated user found');
        }

        const folderPath = `pacientes/${session.user.id}`;
        
        const { data, error } = await supabase.storage
          .from('00000000-default-bucket')
          .list(folderPath, {
            limit: 100,
            offset: 0,
          });

        if (error) {
          console.error('Error fetching patient files:', error);
          return [];
        }

        // Filter files that might be related to the patient
        // Since we don't have a direct patient-file relationship in storage,
        // we'll return all user files for now
        const files = (data || []).map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('00000000-default-bucket')
            .getPublicUrl(`${folderPath}/${file.name}`);

          return {
            id: file.id || file.name,
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'application/octet-stream',
            url: publicUrl,
            path: `${folderPath}/${file.name}`
          };
        });

        return files;
      } catch (error) {
        console.error('Error in getByPatientId:', error);
        return [];
      }
    }
  },

  patients: {
    async getAll() {
      const cacheKey = 'patients:all';
      const cached = cacheUtils.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tcPacientes')
        .select(`
          id,
          created_at,
          updated_at,
          Nombre,
          Paterno,
          Materno,
          FechaNacimiento,
          CURP,
          RFC,
          Sexo,
          EstadoCivil,
          Email,
          Telefono,
          Calle,
          Colonia,
          Asentamiento,
          CodigoPostal,
          Poblacion,
          Municipio,
          EntidadFederativa,
          Ocupacion,
          TipoSangre,
          Alergias,
          ContactoEmergencia,
          Aseguradora,
          Responsable,
          Refiere,
          Observaciones,
          TipoPaciente,
          EstadoNacimiento,
          Nacionalidad,
          Folio,
          Religion,
          LenguaIndigena,
          GrupoEtnico,
          Discapacidad,
          deleted_at,
          user_id,
          idbu
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients:', error);
        return [];
      }

      cacheUtils.set(cacheKey, data || []);
      return data || [];
    },

    async getById(id: string) {
      const cacheKey = `patient:${id}`;
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tcPacientes')
        .select(`
          id,
          created_at,
          updated_at,
          Nombre,
          Paterno,
          Materno,
          FechaNacimiento,
          CURP,
          RFC,
          Sexo,
          EstadoCivil,
          Email,
          Telefono,
          Calle,
          Colonia,
          Asentamiento,
          CodigoPostal,
          Poblacion,
          Municipio,
          EntidadFederativa,
          Ocupacion,
          TipoSangre,
          Alergias,
          ContactoEmergencia,
          Aseguradora,
          Responsable,
          Refiere,
          Observaciones,
          TipoPaciente,
          EstadoNacimiento,
          Nacionalidad,
          Folio,
          Religion,
          LenguaIndigena,
          GrupoEtnico,
          Discapacidad,
          deleted_at,
          user_id,
          idbu
      `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching patient:', error);
        return null;
      }

      cacheUtils.set(cacheKey, data);
      return data;
    },

    async create(patient: Tables['tcPacientes']['Insert']) {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      // Get the user's business unit
      const { data: userData, error: userError } = await supabase.rpc('get_user_idbu', {
        user_id: session.user.id
      });

      if (userError) {
        console.error('Error getting user business unit:', userError);
        throw new Error('Could not determine user business unit');
      }
      
      if (!userData?.idbu) {
        throw new Error('User has no assigned business unit');
      }

      // Ensure user_id is set
      const patientWithUser = {
        ...patient,
        user_id: session.user.id,
        idbu: userData.idbu
      };

      console.log('Creating patient with data:', patientWithUser);

      const { data, error } = await supabase
        .from('tcPacientes')
        .insert(patientWithUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        throw error;
      }

      // Invalidate cache
      cacheUtils.delete('patients:all');
      return data;
    },

    async update(id: string, patient: Tables['tcPacientes']['Update']) {
      // Get current user session to verify ownership
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      // Get the user's business unit
      const { data: userData, error: userError } = await supabase.rpc('get_user_idbu', {
        user_id: session.user.id
      });

      if (userError || !userData?.idbu) {
        throw new Error('Could not determine user business unit');
      }

      // Ensure user_id and idbu are set
      const patientWithUser = {
        ...patient,
        user_id: session.user.id,
        idbu: userData.idbu
      };

      const { data, error } = await supabase
        .from('tcPacientes')
        .update(patientWithUser)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        throw error;
      }

      // Invalidate cache
      cacheUtils.invalidatePattern('patients');
      return data;
    },
  },

  appointments: {
    async getAll() {
      const cacheKey = 'appointments:all';
      const cached = cacheUtils.get(cacheKey);
      const startTime = performance.now();
      
      if (cached) {
        return cached;
      }

      // Calculate date 7 days ago from the start of today
      const sevenDaysAgo = subDays(startOfDay(new Date()), 7); 

      const { data, error } = await supabase
        .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
        .select(`
          id,
          created_at,
          updated_at,
          id_paciente,
          fecha_cita,
          hora_cita,
          motivo,
          estado,
          notas,
          urgente,
          consultorio,
          sintomas,
          documentos,
          tipo_consulta,
          tiempo_evolucion,
          unidad_tiempo,
          sintomas_asociados,
          campos_adicionales,
          id_user,
          hora_fin,
          duracion_minutos,
          patients:id_paciente (
            id,
            Nombre,
            Paterno,
            Materno,
            FechaNacimiento,
            Sexo,
            Email,
            Telefono
          )
        `)
        .gte('fecha_cita', format(sevenDaysAgo, 'yyyy-MM-dd')) // Filter from 7 days ago
        .order('fecha_cita', { ascending: true })
        .order('hora_cita', { ascending: true });

      metrics.appointmentFetchTime = performance.now() - startTime;

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      cacheUtils.set(cacheKey, data || []);
      return data || [];
    },

    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
        .select(`
          id,
          created_at,
          updated_at,
          id_paciente,
          fecha_cita,
          hora_cita,
          motivo,
          estado,
          notas,
          urgente,
          consultorio,
          sintomas,
          documentos,
          tipo_consulta,
          tiempo_evolucion,
          unidad_tiempo,
          sintomas_asociados,
          campos_adicionales,
          id_user,
          hora_fin,
          duracion_minutos, 
          patients:id_paciente (     
            id,
            Nombre,
            Paterno,
            Materno,
            FechaNacimiento,
            Sexo,
            Email,
            Telefono
          )
        `)
        .eq('id_paciente', patientId) // Changed from 'patient_id' to 'id_paciente'
        .order('fecha_cita', { ascending: false }) // Changed from 'appointment_date' to 'fecha_cita'
        .order('hora_cita', { ascending: false });

      if (error) {
        console.error('Error fetching patient appointments:', error);
        return [];
      }

      return data || [];
    },
    async getUpcoming() {
      const { data, error } = await supabase
        .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
        .select(`
          id,
          created_at,
          updated_at,
          id_paciente,
          fecha_cita,
          hora_cita,
          motivo,
          estado,
          notas,
          urgente,
          consultorio,
          sintomas,
          documentos,
          tipo_consulta,
          tiempo_evolucion,
          unidad_tiempo,
          sintomas_asociados,
          campos_adicionales,
          id_user,
          hora_fin,
          duracion_minutos, 
          patients:id_paciente (
            id,
            Nombre,
            Paterno,
            Materno,
            FechaNacimiento,
            Sexo,
            Email,
            Telefono
          )
        `)
        .gte('fecha_cita', format(startOfDay(new Date()), 'yyyy-MM-dd')) // Filter by date only
        .eq('estado', 'programada') // Changed from 'status' to 'estado' and 'scheduled' to 'programada'
        .order('fecha_cita', { ascending: true })
        .order('hora_cita', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        return [];
      }

      return data || [];
    },

    async getById(id: string) {
      console.log('api.appointments.getById called with ID:', id);
      const { data, error } = await supabase
        .from('tcCitas')
        .select(`
          id,
          created_at,
          updated_at,
          id_paciente,
          fecha_cita,
          hora_cita,
          motivo,
          estado,
          notas,
          urgente,
          consultorio,
          sintomas,
          documentos,
          tipo_consulta,
          tiempo_evolucion,
          unidad_tiempo,
          sintomas_asociados,
          campos_adicionales,
          id_user,
          hora_fin,
          duracion_minutos,
          patients:id_paciente (
            id,
            Nombre,
            Paterno,
            Materno,
            FechaNacimiento,
            Sexo,
            Email,
            Telefono
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('api.appointments.getById: Error fetching appointment by ID:', error);
        console.error('Error fetching appointment by ID:', error);
        throw error;
      }

      console.log('api.appointments.getById: Supabase response data:', data);
      return data;
    },

    async create(appointment: Tables['tcCitas']['Insert']) { // Changed from 'appointments' to 'tcCitas'
      if (!validateAppointmentDateTime(appointment.fecha_cita as string, appointment.hora_cita as string)) {
        throw new Error('Cannot create appointments in the past');
      }

      const existingAppointments = await this.getAll();
      if (!validateAppointmentOverlap(existingAppointments, { fecha_cita: appointment.fecha_cita as string, hora_cita: appointment.hora_cita as string })) { // Changed to use fecha_cita and hora_cita
        throw new Error('Appointment time slot is already taken');
      }

      const startTime = performance.now();
      const { data, error } = await supabase
        .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
        .insert(appointment)
        .select()
        .single();

      metrics.appointmentUpdateTime = performance.now() - startTime;

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      // Invalidate cache
      cacheUtils.delete('appointments:all');
      return data;
    },

    async update(id: string, appointment: Tables['tcCitas']['Update']) { // Changed from 'appointments' to 'tcCitas'
      if (appointment.fecha_cita && appointment.hora_cita && !validateAppointmentDateTime(appointment.fecha_cita as string, appointment.hora_cita as string)) {
        throw new Error('Cannot update to a past date');
      }

      // Add to batch update queue
      updateQueue.push({ id, data: appointment });

      // Start batch processing if not already started
      if (!batchUpdateTimeout) {
        batchUpdateTimeout = setTimeout(processBatchUpdates, 1000);
      }

      // Invalidate cache
      cacheUtils.delete('appointments:all');
      
      // Return immediately for better UI responsiveness
      return { id, ...appointment };
    },

    getMetrics() {
      return {
        fetchTime: `${metrics.appointmentFetchTime.toFixed(2)}ms`,
        updateTime: `${metrics.appointmentUpdateTime.toFixed(2)}ms`,
        cacheEfficiency: {
          hits: metrics.cacheHits,
          misses: metrics.cacheMisses,
          ratio: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses),
        },
        validationErrors: metrics.validationErrors,
        batchProcessing: {
          queueSize: updateQueue.length,
          batchSize: BATCH_SIZE,
        },
      };
    },
  },

  clinicalHistories: {
    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('clinical_histories')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinical histories:', error);
        return [];
      }

      return data || [];
    },

    async create(clinicalHistory: Tables['clinical_histories']['Insert']) {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      // Get the user's business unit
      const { data: userData, error: userError } = await supabase.rpc('get_user_idbu', {
        user_id: session.user.id
      });

      if (userError) {
        console.error('Error getting user business unit:', userError);
        throw new Error('Could not determine user business unit');
      }
      
      if (!userData?.idbu) {
        throw new Error('User has no assigned business unit');
      }

      // Ensure user_id and idbu are set
      const historyWithUser = {
        ...clinicalHistory,
        user_id: session.user.id
        };

      const { data, error } = await supabase
        .from('clinical_histories')
        .insert(historyWithUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating clinical history:', error);
        throw error;
      }

      return data;
    }
  },

  clinicalEvolution: {
    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('clinical_evolution')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinical evolution:', error);
        return [];
      }

      return data || [];
    },

    async create(clinicalEvolution: Tables['clinical_evolution']['Insert']) {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      // Get the user's business unit
      const { data: userData, error: userError } = await supabase.rpc('get_user_idbu', {
        user_id: session.user.id
      });

      if (userError) {
        console.error('Error getting user business unit:', userError);
        throw new Error('Could not determine user business unit');
      }
      
      if (!userData?.idbu) {
        throw new Error('User has no assigned business unit');
      }

      // Ensure user_id and idbu are set
      const evolutionWithUser = {
        ...clinicalEvolution,
        user_id: session.user.id
      };

      const { data, error } = await supabase
        .from('clinical_evolution')
        .insert(evolutionWithUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating clinical evolution:', error);
        throw error;
      }

      return data;
    }
  },

  stats: {
    async getDashboardStats() {
      const cacheKey = 'stats:dashboard';
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        return cached;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        const [
          { count: totalPatients },
          { data: todayAppointments },
          { data: upcomingAppointments }
        ] = await Promise.all([
          supabase
            .from('tcPacientes')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
            .select('id')
            .gte('fecha_cita', today.toISOString().split('T')[0]) // Changed from 'appointment_date' to 'fecha_cita'
            .lt('fecha_cita', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]), // Changed from 'appointment_date' to 'fecha_cita'
          supabase
            .from('tcCitas') // Changed from 'appointments' to 'tcCitas'
            .select('id')
            .gt('fecha_cita', format(startOfDay(new Date()), 'yyyy-MM-dd')) // Changed from 'appointment_date' to 'fecha_cita'
            .eq('estado', 'programada') // Changed from 'status' to 'estado' and 'scheduled' to 'programada'
        ]);

        const stats = {
          totalPatients: totalPatients || 0,
          todayAppointments: todayAppointments?.length || 0,
          upcomingAppointments: upcomingAppointments?.length || 0,
        };

        cacheUtils.set(cacheKey, stats);
        return stats;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          totalPatients: 0,
          todayAppointments: 0,
          upcomingAppointments: 0,
        };
      }
    },
  },

  prescriptions: {
    async getAll() {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patient_id (
            Nombre,
            Paterno,
            Materno
          ),
          prescription_medications (
            *,
            medications (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        throw error;
      }

      return data;
    },

    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (
            *,
            medications (*)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient prescriptions:', error);
        throw error;
      }

      return data;
    },

    async create(prescription: {
      prescription_number: string;
      patient_id: string;
      special_instructions?: string;
      diagnosis?: string;
      medications: Array<{
        name: string;
        concentration: string;
        presentation: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: string;
        instructions?: string;
      }>;
    }) {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error('Error al obtener la sesión del usuario');
      if (!session) throw new Error('Debe iniciar sesión para crear recetas');

      // Start a transaction
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          prescription_number: prescription.prescription_number,
          patient_id: prescription.patient_id,
          special_instructions: prescription.special_instructions,
          diagnosis: prescription.diagnosis,
          status: 'active',
          user_id: session.user.id
        })
        .select()
        .single();

      if (prescriptionError) {
        console.error('Error creating prescription:', prescriptionError);
        throw prescriptionError;
      }

      // Create medications and prescription medications
      for (const med of prescription.medications) {
        // First create or find the medication
        const { data: medicationData, error: medicationError } = await supabase
          .from('medications')
          .insert({
            name: med.name,
            presentation: med.presentation,
            concentration: med.concentration,
            active_compound: med.name, // Simplified for now
            user_id: session.user.id
          })
          .select()
          .single();

        if (medicationError) {
          console.error('Error creating medication:', medicationError);
          throw medicationError;
        }

        // Create prescription medication entry
        const { error: prescMedError } = await supabase
          .from('prescription_medications')
          .insert({
            prescription_id: prescriptionData.id,
            medication_id: medicationData.id,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            total_quantity: med.quantity,
            administration_route: 'Oral', // Default for now
            special_instructions: med.instructions,
            user_id: session.user.id
          });

        if (prescMedError) {
          console.error('Error creating prescription medication:', prescMedError);
          throw prescMedError;
        }
      }

      return prescriptionData;
    }
  },
  businessUnits: {
    async getById(idBu: string) {
      try {
        const { data, error } = await supabase
          .from('tcBu')
          .select('Especialidad')
          .eq('idBu', idBu)
          .single();

        if (error) {
          console.error('Error fetching business unit specialty:', error);
          throw error;
        }
        return data?.Especialidad || null;
      } catch (error) {
        console.error('Error in getBusinessUnitSpecialty:', error);
        throw error;
      }
    }
  }
};