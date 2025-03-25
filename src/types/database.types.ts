export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          paternal_surname: string
          curp: string | null
          postal_code: string | null
          date_of_birth: string
          gender: string
          email: string | null
          phone: string | null
          address: string | null
          emergency_contact: string | null
          blood_type: string | null
          allergies: string[] | null
          user_id: string | null
          occupation: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          paternal_surname: string
          curp?: string | null
          postal_code?: string | null
          date_of_birth: string
          gender: string
          email?: string | null
          phone?: string | null
          address?: string | null
          emergency_contact?: string | null
          blood_type?: string | null
          allergies?: string[] | null
          user_id?: string | null
          occupation?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          paternal_surname?: string
          curp?: string | null
          postal_code?: string | null
          date_of_birth?: string
          gender?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          emergency_contact?: string | null
          blood_type?: string | null
          allergies?: string[] | null
          user_id?: string | null
          occupation?: string | null
        }
      }
      clinical_histories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string | null
          history_text: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          history_text: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          history_text?: string
          user_id?: string | null
        }
      }
      clinical_evolution: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string | null
          evolution_text: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          evolution_text: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          evolution_text?: string
          user_id?: string | null
        }
      }
      medical_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string | null
          visit_date: string
          diagnosis: string
          treatment: string | null
          prescription: string | null
          notes: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          visit_date: string
          diagnosis: string
          treatment?: string | null
          prescription?: string | null
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          visit_date?: string
          diagnosis?: string
          treatment?: string | null
          prescription?: string | null
          notes?: string | null
          user_id?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string | null
          appointment_date: string
          status: string
          reason: string
          notes: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          appointment_date: string
          status?: string
          reason: string
          notes?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string | null
          appointment_date?: string
          status?: string
          reason?: string
          notes?: string | null
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}