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

// Cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const api = {
  patients: {
    async getAll() {
      const cacheKey = 'patients:all';
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

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
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

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
        .order('appointment_date', { ascending: true });

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
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete('appointments:all');
      return data;
    },

    async update(id: string, appointment: Tables['appointments']['Update']) {
      const { data, error } = await supabase
        .from('appointments')
        .update(appointment)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }

      // Invalidate cache
      cache.delete('appointments:all');
      return data;
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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Start a transaction
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          prescription_number: prescription.prescription_number,
          patient_id: prescription.patient_id,
          special_instructions: prescription.special_instructions,
          diagnosis: prescription.diagnosis,
          status: 'active',
          user_id: user?.id
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
            user_id: user?.id // Add user_id to comply with RLS
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
            user_id: user?.id // Add user_id to comply with RLS
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