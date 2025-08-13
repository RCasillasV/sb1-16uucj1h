import { supabase } from './supabase';
import { format, startOfDay, subDays } from 'date-fns';
import type { Database } from '../types/database.types';

// Bucket configuration
const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME || 'default-bucket';

if (!BUCKET_NAME) {
  throw new Error('VITE_BUCKET_NAME environment variable is required');
}

// Add a sleep utility function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Tables = Database['public']['Tables'];
type Appointment = Tables['tcCitas']['Row'];
type Patient = Tables['tcPacientes']['Row'];
type MedicalRecord = Tables['medical_records']['Row'];
type ClinicalHistory = Tables['clinical_histories']['Row'];
type ClinicalEvolution = Tables['clinical_evolution']['Row'];
type Prescription = Tables['prescriptions']['Row'];
type PrescriptionMedication = Tables['prescription_medications']['Row'];
type Medication = Tables['medications']['Row'];
type Patologia = Tables['tcPatologias']['Row'];
type PacienteHistPatologica = Tables['tpPacienteHistPatologica']['Row'];

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

// Batch processing function
const processBatchUpdates = async () => {
  if (updateQueue.length === 0) return;

  const batch = updateQueue.splice(0, BATCH_SIZE);
  const startTime = performance.now();

  try {
    await Promise.all(batch.map(async ({ id, data }) => {
      const { error } = await supabase
        .from('tcCitas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    }));

    metrics.appointmentUpdateTime = performance.now() - startTime;
  } catch (error) {
    console.error('Batch update error:', error);
    updateQueue.push(...batch);
  }

  if (updateQueue.length > 0) {
    batchUpdateTimeout = setTimeout(processBatchUpdates, 1000);
  }

  cacheUtils.delete('appointments:all');
};

type UserAttributes = {
  idbu: string | null;
  nombre: string | null;
  rol: string | null;
  estado: string | null;
  deleted_at: string | null;
};

export const api = {
  insurances: {
    async getAllActive() {
      const cacheKey = 'insurances:active';
      const cached = cacheUtils.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tcAseguradora')
        .select('idAs, Aseguradora, Contacto, URL, Notas')
        .eq('Activo', true)
        .order('Aseguradora', { ascending: true });

      if (error) {
        console.error('Error fetching active insurances:', error);
        return [];
      }

      cacheUtils.set(cacheKey, data || []);
      return data || [];
    }
  },

  files: {
    async getByPatientId(patientId: string) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated user found');
        }

        const folderPath = `patients/${patientId}`;
        
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list(folderPath, {
            limit: 100,
            offset: 0,
          });

        if (error) {
          console.error('Error fetching patient files:', error);
          return [];
        }

        const files = (data || []).map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const patientWithUser = {
        ...patient,
        user_id: session.user.id,
        idbu: currentUserAttributes.idbu
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

      cacheUtils.delete('patients:all');
      return data;
    },

    async update(id: string, patient: Tables['tcPacientes']['Update']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const patientWithUser = {
        ...patient,
        user_id: session.user.id,
        idbu: currentUserAttributes.idbu
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

      const sevenDaysAgo = subDays(startOfDay(new Date()), 7);

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
        .gte('fecha_cita', format(sevenDaysAgo, 'yyyy-MM-dd'))
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
        .eq('id_paciente', patientId)
        .order('fecha_cita', { ascending: false })
        .order('hora_cita', { ascending: false });

      if (error) {
        console.error('Error fetching patient appointments:', error);
        return [];
      }

      return data || [];
    },

    async getUpcoming() {
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
        .gte('fecha_cita', format(startOfDay(new Date()), 'yyyy-MM-dd'))
        .eq('estado', 'programada')
        .order('fecha_cita', { ascending: true })
        .order('hora_cita', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        return [];
      }

      return data || [];
    },

    async getById(id: string) {
      if (import.meta.env.DEV) {
        console.log('api.appointments.getById called with ID:', id);
      }
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
        if (import.meta.env.DEV) {
          console.error('api.appointments.getById: Error fetching appointment by ID:', error);
        }
        throw error;
      }

      if (import.meta.env.DEV) {
        console.log('api.appointments.getById: Supabase response data:', data);
      }
      return data;
    },

    async getByDateAndConsultorio(fecha: string, consultorio: number) {
      const { data, error } = await supabase
        .from('tcCitas')
        .select(`
          id,
          fecha_cita,
          hora_cita,
          hora_fin,
          duracion_minutos,
          consultorio,
          estado
        `)
        .eq('fecha_cita', fecha)
        .eq('consultorio', consultorio)
        .neq('estado', 'cancelada')
        .order('hora_cita', { ascending: true });

      if (error) {
        console.error('Error fetching appointments by date and consultorio:', error);
        return [];
      }

      return data || [];
    },

    async create(appointment: Tables['tcCitas']['Insert']) {
      const startTime = performance.now();
      const { data, error } = await supabase
        .from('tcCitas')
        .insert(appointment)
        .select()
        .single();

      metrics.appointmentUpdateTime = performance.now() - startTime;

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      cacheUtils.delete('appointments:all');
      return data;
    },

    // Nueva función para agendar citas con validación completa en el backend
    async createSecure(appointmentData: {
      id_paciente: string;
      fecha_cita: string;
      hora_cita: string;
      motivo: string;
      consultorio: number;
      duracion_minutos: number;
      tipo_consulta: string;
      tiempo_evolucion?: number | null;
      unidad_tiempo?: string | null;
      sintomas_asociados?: string[] | null;
      urgente?: boolean;
      notas?: string | null;
    }) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      // Llamar a la función RPC que realizará todas las validaciones
      const { data, error } = await supabase.rpc('agendar_cita', {
        p_id_paciente: appointmentData.id_paciente,
        p_fecha_cita: appointmentData.fecha_cita,
        p_hora_cita: appointmentData.hora_cita,
        p_motivo: appointmentData.motivo,
        p_consultorio: appointmentData.consultorio,
        p_duracion_minutos: appointmentData.duracion_minutos,
        p_tipo_consulta: appointmentData.tipo_consulta,
        p_tiempo_evolucion: appointmentData.tiempo_evolucion,
        p_unidad_tiempo: appointmentData.unidad_tiempo,
        p_sintomas_asociados: appointmentData.sintomas_asociados,
        p_urgente: appointmentData.urgente || false,
        p_notas: appointmentData.notas,
        p_id_user: session.user.id,
        p_idbu: currentUserAttributes.idbu
      });

      if (error) {
        console.error('Error creating secure appointment:', error);
        throw new Error(error.message || 'Error al agendar la cita');
      }

      // Invalidar cache de citas
      cacheUtils.delete('appointments:all');
      
      return data;
    },

    // Función para verificar disponibilidad de slots sin crear la cita
    async checkSlotAvailability(fecha: string, hora_inicio: string, duracion_minutos: number, consultorio: number) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      // Usar RPC para verificar disponibilidad (función más liviana que solo valida)
      const { data, error } = await supabase.rpc('verificar_slot', {
        p_fecha: fecha,
        p_hora_inicio: hora_inicio,
        p_duracion_minutos: duracion_minutos,
        p_consultorio: consultorio,
        p_idbu: currentUserAttributes.idbu
      });

      if (error) {
        console.error('Error checking slot availability:', error);
        return { available: false, reason: 'Error al verificar disponibilidad' };
      }

      return data;
    },

    async update(id: string, appointment: Tables['tcCitas']['Update']) {
      if (appointment.fecha_cita && appointment.hora_cita && !validateAppointmentDateTime(appointment.fecha_cita as string, appointment.hora_cita as string)) {
        throw new Error('Cannot update to a past date');
      }

      updateQueue.push({ id, data: appointment });

      if (!batchUpdateTimeout) {
        batchUpdateTimeout = setTimeout(processBatchUpdates, 1000);
      }

      cacheUtils.delete('appointments:all');
      
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

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
            .from('tcCitas')
            .select('id')
            .gte('fecha_cita', today.toISOString().split('T')[0])
            .lt('fecha_cita', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
          supabase
            .from('tcCitas')
            .select('id')
            .gt('fecha_cita', format(startOfDay(new Date()), 'yyyy-MM-dd'))
            .eq('estado', 'programada')
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
      diagnosis: string;
      special_instructions?: string | null;
      medications: Array<{
        name: string;
        concentration: string;
        presentation: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: string;
        administration_route: string;
        instructions?: string;
      }>;
    }) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error('Error al obtener la sesión del usuario');
      if (!session) throw new Error('Debe iniciar sesión para crear recetas');

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

      for (const med of prescription.medications) {
        // Buscar medicamento existente
        let medicationId: string;
        const { data: existingMedication } = await supabase
          .from('medications')
          .select('id')
          .eq('name', med.name)
          .eq('concentration', med.concentration)
          .eq('presentation', med.presentation)
          .single();

        if (existingMedication) {
          medicationId = existingMedication.id;
        } else {
          // Crear nuevo medicamento
          const { data: medicationData, error: medicationError } = await supabase
            .from('medications')
            .insert({
              name: med.name,
              presentation: med.presentation,
              concentration: med.concentration,
              active_compound: med.name,
              user_id: session.user.id
            })
            .select('id')
            .single();

          if (medicationError) {
            console.error('Error creating medication:', medicationError);
            throw medicationError;
          }

          medicationId = medicationData.id;
        }

        const { error: prescMedError } = await supabase
          .from('prescription_medications')
          .insert({
            prescription_id: prescriptionData.id,
            medication_id: medicationId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            total_quantity: med.quantity,
            administration_route: med.administration_route,
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

  medications: {
    async search(searchTerm: string) {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('medications')
        .select('id, name, concentration, presentation')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching medications:', error);
        return [];
      }

      // Mapear a los nombres en español para el frontend
      return (data || []).map(med => ({
        id: med.id,
        nombreComercial: med.name,
        concentracion: med.concentration,
        presentacion: med.presentation,
      }));
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
    },
  },

  users: {
    async getCurrentUserAttributes(userId: string): Promise<UserAttributes | null> {
      const cacheKey = `user_attributes:${userId}`;
      const cached = cacheUtils.get(cacheKey);

      if (cached) {
        return cached;
      }

      const maxRetries = 3; // Número de intentos de reintento
      const initialDelay = 500; // Retraso inicial en ms (0.5 segundos)

      for (let i = 0; i <= maxRetries; i++) {
        try {
          if (import.meta.env.DEV) {
            console.log(`API: Calling supabase.rpc("get_userdata", {}). Attempt ${i + 1}/${maxRetries + 1}`);
          }
          const rpcPromise = supabase.rpc('get_userdata', {});
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('RPC call timed out')), 10000) // Mantener el timeout original de 10 segundos
          );

          // Usar Promise.race para manejar tanto la respuesta RPC como el timeout del lado del cliente
          const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

          if (error) {
            if (import.meta.env.DEV) {
              console.error('Error fetching user attributes via RPC:', error);
              console.log('API: RPC call returned an error.');
            }
            throw new Error(`Supabase RPC error: ${error.message || 'Unknown RPC error'}`);
          }

          if (import.meta.env.DEV) {
            console.log('Datos de usuario recibidos:', data);
          }
          const userAttributes = data && data.length > 0 ? data[0] : null;

          if (userAttributes) {
            if (import.meta.env.DEV) {
              console.log('Nombre del usuario:', userAttributes.nombre);
              console.log('Rol del usuario:', userAttributes.rol);
            }
            cacheUtils.set(cacheKey, userAttributes);
            return userAttributes;
          }

          if (import.meta.env.DEV) {
            console.log('API: No user attributes found or data is empty.');
          }
          return null; // No se encontraron atributos de usuario, no es necesario reintentar
        } catch (error: any) {
          const errorMessage = error.message || 'Unknown error';
          if (import.meta.env.DEV) {
            console.error(`Attempt ${i + 1} failed: ${errorMessage}`);
          }

          // Verificar si es un error reintentable (timeout, error de red o error de RPC)
          const isRetryable = errorMessage.includes('RPC call timed out') || 
                              errorMessage.includes('Failed to fetch') || 
                              errorMessage.includes('NetworkError') ||
                              errorMessage.includes('fetch') ||
                              errorMessage.includes('network') ||
                              errorMessage.includes('timeout');

          if (isRetryable && i < maxRetries) {
            const delay = initialDelay * (2 ** i); // Retraso exponencial: 500ms, 1s, 2s
            if (import.meta.env.DEV) {
              console.log(`Retrying in ${delay}ms...`);
            }
            await sleep(delay);
          } else {
            // Si no es reintentable, o se alcanzó el número máximo de reintentos, relanzar el error
            if (import.meta.env.DEV) {
              console.error(`Max retries reached or non-retryable error. Throwing error.`);
            }
            if (i === maxRetries) {
              if (import.meta.env.DEV) {
                console.error(`Error in getCurrentUserAttributes after ${i + 1} attempts:`, error);
              }
            }
            return null; // Devolver null en lugar de lanzar el error para evitar crashes
          }
        }
      }
      return null; // Esto no debería ser alcanzado en un flujo normal
    }
  },

  patologias: {
    async getAll() {
      const cacheKey = 'patologias:all';
      const cached = cacheUtils.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tcPatologias')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching pathologies:', error);
        return [];
      }

      cacheUtils.set(cacheKey, data || []);
      return data || [];
    },

    async getById(id: string) {
      const cacheKey = `patologia:${id}`;
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tcPatologias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching pathology:', error);
        return null;
      }

      cacheUtils.set(cacheKey, data);
      return data;
    },

    async getByIds(ids: string[]): Promise<Patologia[]> {
      if (!ids || ids.length === 0) return [];

      const cacheKey = `patologias:${ids.sort().join(',')}`;
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('tcPatologias')
        .select('*')
        .in('id', ids)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching pathologies by IDs:', error);
        return [];
      }

      cacheUtils.set(cacheKey, data || []);
      return data || [];
    },

    async create(patologia: Tables['tcPatologias']['Insert']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const patologiaWithUser = {
        ...patologia,
        idUsuario: session.user.id,
        idbu: currentUserAttributes.idbu
      };

      const { data, error } = await supabase
        .from('tcPatologias')
        .insert(patologiaWithUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating pathology:', error);
        throw error;
      }

      cacheUtils.invalidatePattern('patologias');
      return data;
    },

    async update(id: string, patologia: Tables['tcPatologias']['Update']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('tcPatologias')
        .update({
          ...patologia,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pathology:', error);
        throw error;
      }

      cacheUtils.invalidatePattern('patologias');
      return data;
    }
  },

  agendaSettings: {
    async get() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const { data, error } = await supabase
        .from('tcAgendaSettings')
        .select('*')
        .eq('idbu', currentUserAttributes.idbu)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching agenda settings:', error);
        throw error;
      }

      return data;
    },

    async update(settings: {
      start_time: string;
      end_time: string;
      consultation_days: string[];
      slot_interval: number;
    }) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      // Try to update first, if no record exists, insert
      const { data: existingSettings } = await supabase
        .from('tcAgendaSettings')
        .select('id')
        .eq('idbu', currentUserAttributes.idbu)
        .single();

      const settingsData = {
        ...settings,
        idbu: currentUserAttributes.idbu,
        user_id: session.user.id,
        updated_at: new Date().toISOString()
      };

      if (existingSettings) {
        const { data, error } = await supabase
          .from('tcAgendaSettings')
          .update(settingsData)
          .eq('idbu', currentUserAttributes.idbu)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('tcAgendaSettings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    }
  },

  blockedDates: {
    async getAll() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const { data, error } = await supabase
        .from('tcAgendaBloqueada')
        .select('*')
        .eq('idbu', currentUserAttributes.idbu)
        .is('deleted_at', null)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching blocked dates:', error);
        throw error;
      }

      return data || [];
    },

    async create(blockData: {
      start_date: string;
      end_date: string;
      reason: string;
      block_type: string;
    }) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const { data, error } = await supabase
        .from('tcAgendaBloqueada')
        .insert({
          ...blockData,
          idbu: currentUserAttributes.idbu,
          user_id: session.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating blocked date:', error);
        throw error;
      }

      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('tcAgendaBloqueada')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting blocked date:', error);
        throw error;
      }

      return true;
    }
  },

  consultorios: {
    async getAll() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const { data, error } = await supabase
        .from('tcConsultorios')
        .select('id, consultorio, activo')
        .eq('idBu', currentUserAttributes.idbu)
        .order('id');

      if (error) {
        console.error('Error fetching consultorios:', error);
        throw error;
      }

      return data || [];
    },

    async updateBatch(consultorios: Array<{ id: number; consultorio: string; activo: boolean }>) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const currentUserAttributes = await api.users.getCurrentUserAttributes(session.user.id);
      if (!currentUserAttributes?.idbu) {
        throw new Error('User has no assigned business unit (idbu).');
      }

      const updates = consultorios.map(consultorio => 
        supabase
          .from('tcConsultorios')
          .update({
            consultorio: consultorio.consultorio,
            activo: consultorio.activo,
            updated_at: new Date().toISOString()
          })
          .eq('id', consultorio.id)
          .eq('idBu', currentUserAttributes.idbu)
      );

      const results = await Promise.all(updates);
      
      for (const result of results) {
        if (result.error) {
          console.error('Error updating consultorio:', result.error);
          throw result.error;
        }
      }

      return true;
    }
  },

  pathologicalHistory: {
    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .select('*')
        .eq('id_paciente', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pathological history:', error);
        return [];
      }

      // Para cada registro, resolver los IDs de enfermedades_cronicas a nombres
      const resolvedHistories = await Promise.all(
        (data || []).map(async (history) => {
          let resolvedEnfermedadesCronicas: Patologia[] = [];
          
          if (history.enfermedades_cronicas && Array.isArray(history.enfermedades_cronicas)) {
            const patologiaIds = history.enfermedades_cronicas as string[];
            resolvedEnfermedadesCronicas = await api.patologias.getByIds(patologiaIds);
          }

          return {
            ...history,
            enfermedades_cronicas_resolved: resolvedEnfermedadesCronicas
          };
        })
      );

      return resolvedHistories;
    },

    async create(historialData: Tables['tpPacienteHistPatologica']['Insert']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const historialWithUser = {
        ...historialData,
        id_usuario: session.user.id
      };

      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .insert(historialWithUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating pathological history:', error);
        throw error;
      }

      return data;
    },

    async update(id: string, historialData: Tables['tpPacienteHistPatologica']['Update']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('tpPacienteHistPatologica')
        .update({
          ...historialData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pathological history:', error);
        throw error;
      }

      return data;
    },

    async getOrCreate(patientId: string) {
      // Primero intentar obtener el historial existente
      const existingHistory = await this.getByPatientId(patientId);
      
      if (existingHistory && existingHistory.length > 0) {
        return existingHistory[0]; // Retornar el más reciente
      }

      // Si no existe, crear uno nuevo
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const newHistory = await this.create({
        id_paciente: patientId,
        id_usuario: session.user.id,
        enfermedades_cronicas: [],
        cirugias: [],
        hospitalizaciones: [],
        habitos_toxicos: []
      });

      return {
        ...newHistory,
        enfermedades_cronicas_resolved: []
      };
    }
  },

  antecedentesNoPatologicos: {
    async getByPatientId(patientId: string) {
      const { data, error } = await supabase
        .from('tpPacienteHistNoPatologica')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching non-pathological history:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    },

    async create(historialData: Tables['tpPacienteHistNoPatologica']['Insert']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const historialWithUser = {
        ...historialData,
        user_id: session.user.id
      };

      const { data, error } = await supabase
        .from('tpPacienteHistNoPatologica')
        .insert(historialWithUser)
        .select()
        .single();

      if (error) {
        console.error('Error creating non-pathological history:', error);
        throw error;
      }

      return data;
    },

    async update(id: string, historialData: Tables['tpPacienteHistNoPatologica']['Update']) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('tpPacienteHistNoPatologica')
        .update({
          ...historialData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating non-pathological history:', error);
        throw error;
      }

      return data;
    },

    async getOrCreate(patientId: string) {
      // Intentar obtener el historial existente
      const existingHistory = await this.getByPatientId(patientId);
      
      if (existingHistory) {
        return existingHistory;
      }

      // Si no existe, crear uno nuevo
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        throw new Error('No authenticated user found');
      }

      const newHistory = await this.create({
        patient_id: patientId,
        user_id: session.user.id,
        habitos_estilo_vida: {},
        entorno_social: {},
        historial_adicional: {},
        notas_generales: null
      });

      return newHistory;
    }
  },

  federalEntities: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('sires.tcEntidadFed') // Nombre de la tabla
        .select('Entidad_Federativa') // ¡Ajustado a Entidad_Federativa!
        .order('id', { ascending: true }); // Ordenar por id

      if (error) throw error;
      // Mapear para devolver solo los valores de la columna
      return data.map(item => item.Entidad_Federativa);
    },
  },
};