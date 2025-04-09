import { supabase } from './supabase';
import type { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type Patient = Tables['patients']['Row'];
type MedicalRecord = Tables['medical_records']['Row'];
type Appointment = Tables['appointments']['Row'];
type ClinicalHistory = Tables['clinical_histories']['Row'];
type ClinicalEvolution = Tables['clinical_evolution']['Row'];
type Prescription = Tables['prescriptions']['Row'];
type PrescriptionMedication = Tables['prescription_medications']['Row'];
type Medication = Tables['medications']['Row'];

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

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
const validateAppointmentDate = (date: string): boolean => {
  const appointmentDate = new Date(date);
  const now = new Date();
  return appointmentDate >= now;
};

const validateAppointmentOverlap = (appointments: Appointment[], newAppointment: { appointment_date: string }): boolean => {
  const newDate = new Date(newAppointment.appointment_date);
  const thirtyMinutes = 30 * 60 * 1000;
  
  return !appointments.some(existing => {
    const existingDate = new Date(existing.appointment_date);
    const timeDiff = Math.abs(newDate.getTime() - existingDate.getTime());
    return timeDiff < thirtyMinutes;
  });
};

const logValidationError = (error: string) => {
  metrics.validationErrors.push(`${new Date().toISOString()}: ${error}`);
  console.error('Validation Error:', error);
};

// Batch processing function
const processBatchUpdates = async () => {
  if (updateQueue.length === 0) return;

  const batch = updateQueue.splice(0, BATCH_SIZE);
  const startTime = performance.now();

  try {
    await Promise.all(batch.map(async ({ id, data }) => {
      const { error } = await supabase
        .from('appointments')
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

export const api = {
  patients: {
    async getAll() {
      const cacheKey = 'patients:all';
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        metrics.cacheHits++;
        return cached.data;
      }

      metrics.cacheMisses++;
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients:', error);
        return [];
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data || [];
    },

    async getById(id: string) {
      const cacheKey = `patient:${id}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching patient:', error);
        return null;
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    },

    async create(patient: Tables['patients']['Insert']) {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete('patients:all');
      return data;
    },

    async update(id: string, patient: Tables['patients']['Update']) {
      const { data, error } = await supabase
        .from('patients')
        .update(patient)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete('patients:all');
      cache.delete(`patient:${id}`);
      return data;
    },
  },

  clinicalHistories: {
    async getByPatientId(patientId: string) {
      const cacheKey = `histories:${patientId}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('clinical_histories')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinical history:', error);
        throw error;
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data || [];
    },

    async create(history: Tables['clinical_histories']['Insert']) {
      const { data, error } = await supabase
        .from('clinical_histories')
        .insert(history)
        .select()
        .single();

      if (error) {
        console.error('Error creating clinical history:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete(`histories:${history.patient_id}`);
      return data;
    },

    async update(id: string, history: Tables['clinical_histories']['Update']) {
      const { data, error } = await supabase
        .from('clinical_histories')
        .update(history)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating clinical history:', error);
        throw error;
      }

      // Invalidate cache
      if (history.patient_id) {
        cache.delete(`histories:${history.patient_id}`);
      }
      return data;
    },
  },

  clinicalEvolution: {
    async getByPatientId(patientId: string) {
      const cacheKey = `evolution:${patientId}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('clinical_evolution')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinical evolution:', error);
        throw error;
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data || [];
    },

    async create(evolution: Tables['clinical_evolution']['Insert']) {
      const { data, error } = await supabase
        .from('clinical_evolution')
        .insert(evolution)
        .select()
        .single();

      if (error) {
        console.error('Error creating clinical evolution:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete(`evolution:${evolution.patient_id}`);
      return data;
    },

    async update(id: string, evolution: Tables['clinical_evolution']['Update']) {
      const { data, error } = await supabase
        .from('clinical_evolution')
        .update(evolution)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating clinical evolution:', error);
        throw error;
      }

      // Invalidate cache
      if (evolution.patient_id) {
        cache.delete(`evolution:${evolution.patient_id}`);
      }
      return data;
    },
  },

  appointments: {
    async getAll() {
      const cacheKey = 'appointments:all';
      const cached = cache.get(cacheKey);
      const startTime = performance.now();
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        metrics.cacheHits++;
        return cached.data;
      }

      metrics.cacheMisses++;
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            paternal_surname
          )
        `)
        .gte('appointment_date', new Date().toISOString()) // Only fetch current and future appointments
        .order('appointment_date', { ascending: true });

      metrics.appointmentFetchTime = performance.now() - startTime;

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data || [];
    },

    async getUpcoming() {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (
            first_name,
            last_name,
            paternal_surname
          )
        `)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        return [];
      }

      return data || [];
    },

    async create(appointment: Tables['appointments']['Insert']) {
      if (!validateAppointmentDate(appointment.appointment_date)) {
        throw new Error('Cannot create appointments in the past');
      }

      const existingAppointments = await this.getAll();
      if (!validateAppointmentOverlap(existingAppointments, appointment)) {
        throw new Error('Appointment time slot is already taken');
      }

      const startTime = performance.now();
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

      metrics.appointmentUpdateTime = performance.now() - startTime;

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete('appointments:all');
      return data;
    },

    async update(id: string, appointment: Tables['appointments']['Update']) {
      if (appointment.appointment_date && !validateAppointmentDate(appointment.appointment_date)) {
        throw new Error('Cannot update to a past date');
      }

      // Add to batch update queue
      updateQueue.push({ id, data: appointment });

      // Start batch processing if not already started
      if (!batchUpdateTimeout) {
        batchUpdateTimeout = setTimeout(processBatchUpdates, 1000);
      }

      // Invalidate cache
      cache.delete('appointments:all');
      
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

  stats: {
    async getDashboardStats() {
      const cacheKey = 'stats:dashboard';
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
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
            .from('patients')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('appointments')
            .select('id')
            .gte('appointment_date', today.toISOString())
            .lt('appointment_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from('appointments')
            .select('id')
            .gt('appointment_date', new Date().toISOString())
            .eq('status', 'scheduled')
        ]);

        const stats = {
          totalPatients: totalPatients || 0,
          todayAppointments: todayAppointments?.length || 0,
          upcomingAppointments: upcomingAppointments?.length || 0,
        };

        cache.set(cacheKey, { data: stats, timestamp: Date.now() });
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
          patients (
            first_name,
            last_name,
            paternal_surname
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
        presentation: string;
        concentration: string;
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
  }
};