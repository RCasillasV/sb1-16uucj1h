type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  sires: {
    Tables: {
      tcCodigosPostales: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          d_codigo: string
          d_asenta: string
          d_tipo_asenta: string | null
          d_mnpio: string
          d_estado: string
          d_ciudad: string | null
          d_CP: string | null
          c_estado: string | null
          c_oficina: string | null
          c_CP: string | null
          c_tipo_asenta: string | null
          c_mnpio: string | null
          id_asenta_cpcons: string | null
          d_zona: string | null
          c_cve_ciudad: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          d_codigo: string
          d_asenta: string
          d_tipo_asenta?: string | null
          d_mnpio: string
          d_estado: string
          d_ciudad?: string | null
          d_CP?: string | null
          c_estado?: string | null
          c_oficina?: string | null
          c_CP?: string | null
          c_tipo_asenta?: string | null
          c_mnpio?: string | null
          id_asenta_cpcons?: string | null
          d_zona?: string | null
          c_cve_ciudad?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          d_codigo?: string
          d_asenta?: string
          d_tipo_asenta?: string | null
          d_mnpio?: string
          d_estado?: string
          d_ciudad?: string | null
          d_CP?: string | null
          c_estado?: string | null
          c_oficina?: string | null
          c_CP?: string | null
          c_tipo_asenta?: string | null
          c_mnpio?: string | null
          id_asenta_cpcons?: string | null
          d_zona?: string | null
          c_cve_ciudad?: string | null
        }
      }
      tcPacientes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          Nombre: string
          Paterno: string
          Materno: string
          FechaNacimiento: string
          CURP: string | null
          RFC: string | null
          Sexo: string
          EstadoCivil: string
          Email: string | null
          Telefono: string | null
          Calle: string | null
          Colonia: string | null
          CodigoPostal: string | null
          Poblacion: string | null
          Municipio: string | null
          EntidadFederativa: string | null
          Ocupacion: string | null
          TipoSangre: string | null
          Alergias: string[] | null
          ContactoEmergencia: string | null
          Aseguradora: string | null
          Responsable: string | null
          Refiere: string| null
          Observaciones: string | null
          TipoPaciente: string | null
          EstadoNacimiento: string | null
          Nacionalidad: string | null
          Folio: string | null
          Religion: string | null
          LenguaIndigena: string | null
          GrupoEtnico: string | null
          Discapacidad: string | null
          deleted_at : string | null
          user_id: string | null
          idbu: string

        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          Nombre: string
          Paterno: string
          Materno?: string
          CURP?: string | null
           RFC?: string | null
          CodigoPostal?: string | null
          FechaNacimiento: string
          Sexo: string
          EstadoCivil?: string
          Email?: string | null
          Telefono?: string | null
          Calle?: string | null
          Colonia?: string | null
          CodigoPostal?: string | null
          Poblacion?: string | null
          Municipio?: string | null
          EntidadFederativa?: string | null
          Ocupacion?: string | null
          TipoSangre?: string | null
          Alergias?: string[] | null
          ContactoEmergencia?: string | null
          Aseguradora?: string | null
          Responsable?: string | null
          Refiere?: string| null
          Observaciones?: string | null
          TipoPaciente?: string | null
          EstadoNacimiento?: string | null
          Nacionalidad?: string | null
          Folio?: string | null
          Religion?: string | null
          LenguaIndigena?: string | null
          GrupoEtnico?: string | null
          Discapacidad?: string | null
          user_id: string | null
          idbu: string

        }
        Update: {
          updated_at?: string
          Nombre: string
          Paterno: string
          Materno?: string
          CURP?: string | null
           RFC?: string | null
          CodigoPostal?: string | null
          FechaNacimiento: string
          Sexo: string
          EstadoCivil?: string
          Email?: string | null
          Telefono?: string | null
          Calle?: string | null
          Colonia?: string | null
          CodigoPostal?: string | null
          Poblacion?: string | null
          Municipio?: string | null
          EntidadFederativa?: string | null
          Ocupacion?: string | null
          TipoSangre?: string | null
          Alergias?: string[] | null
          ContactoEmergencia?: string | null
          Aseguradora?: string | null
          Responsable?: string | null
          Refiere?: string| null
          Observaciones?: string | null
          TipoPaciente?: string | null
          EstadoNacimiento?: string | null
          Nacionalidad?: string | null
          Folio?: string | null
          Religion?: string | null
          LenguaIndigena?: string | null
          GrupoEtnico?: string | null
          Discapacidad?: string | null
          deleted_at? : string | null
        }
      }
      tcCitas: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          id_paciente: string
          id_user: string | null
          fecha_cita: string
          hora_cita: string
          motivo: string
          estado: 'programada' | 'completada' | 'cancelada'
          notas: string | null
          urgente: boolean
          consultorio: number
          sintomas: string[] | null
          documentos: Json | null
          tipo_consulta: 'primera' | 'seguimiento' | 'urgencia' | 'revision' | 'control'
          tiempo_evolucion: number | null
          unidad_tiempo: 'horas' | 'dias' | 'semanas' | 'meses' | null
          sintomas_asociados: string[] | null
          campos_adicionales: Json | null
          hora_fin: string
           duracion_minutos: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          id_paciente: string
          id_user?: string | null
          fecha_cita: string
          hora_cita: string
          motivo: string
          estado?: 'programada' | 'completada' | 'cancelada'
          notas?: string | null
          urgente?: boolean
          consultorio: number
          sintomas?: string[] | null
          documentos?: Json | null
          tipo_consulta: 'primera' | 'seguimiento' | 'urgencia' | 'revision' | 'control'
          tiempo_evolucion?: number | null
          unidad_tiempo?: 'horas' | 'dias' | 'semanas' | 'meses' | null
          sintomas_asociados?: string[] | null
          campos_adicionales?: Json | null
          hora_fin?: string
           duracion_minutos: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          id_paciente?: string
          id_user?: string | null
          fecha_cita?: string
          hora_cita?: string
          motivo?: string
          estado?: 'programada' | 'completada' | 'cancelada'
          notas?: string | null
          urgente?: boolean
          consultorio?: number
          sintomas?: string[] | null
          documentos?: Json | null
          tipo_consulta: 'primera' | 'seguimiento' | 'urgencia' | 'revision' | 'control'
          tiempo_evolucion?: number | null
          unidad_tiempo?: 'horas' | 'dias' | 'semanas' | 'meses' | null
          sintomas_asociados?: string[] | null
          campos_adicionales?: Json | null
          hora_fin?: string
           duracion_minutos: number | null
        }
      }
      clinical_histories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string 
          history_text: string
          user_id: string   
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string 
          history_text: string
          user_id?: string 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string 
          history_text?: string
          user_id?: string 
        }
      }
      clinical_evolution: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string 
          evolution_text: string
          user_id: string 
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string 
          evolution_text: string
          user_id?: string 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string 
          evolution_text?: string
          user_id?: string 
        }
      }
      medical_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          patient_id: string 
          visit_date: string
          diagnosis: string
          treatment: string | null
          prescription: string | null
          notes: string | null
          user_id: string 
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string 
          visit_date: string
          diagnosis: string
          treatment?: string | null
          prescription?: string | null
          notes?: string | null
          user_id?: string 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          patient_id?: string 
          visit_date?: string
          diagnosis?: string
          treatment?: string | null
          prescription?: string | null
          notes?: string | null
          user_id?: string 
        }
      }
      prescriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          prescription_number: string
          patient_id: string | null
          issue_date: string
          expiry_date: string | null
          status: string
          special_instructions: string | null
          diagnosis: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          prescription_number: string
          patient_id?: string 
          issue_date?: string
          expiry_date?: string | null
          status?: string
          special_instructions?: string | null
          diagnosis?: string | null
          user_id?: string 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          prescription_number?: string
          patient_id?: string 
          issue_date?: string
          expiry_date?: string | null
          status?: string
          special_instructions?: string | null
          diagnosis?: string | null
          user_id?: string 
        }
      }
      prescription_medications: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          prescription_id: string | null
          medication_id: string | null
          dosage: string
          frequency: string
          duration: string
          total_quantity: string
          administration_route: string
          special_instructions: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          prescription_id?: string | null
          medication_id?: string | null
          dosage: string
          frequency: string
          duration: string
          total_quantity: string
          administration_route: string
          special_instructions?: string | null
          user_id?: string 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          prescription_id?: string | null
          medication_id?: string | null
          dosage?: string
          frequency?: string
          duration?: string
          total_quantity?: string
          administration_route?: string
          special_instructions?: string | null
          user_id?: string 
        }
      }
      medications: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          concentration: string
          presentation: string
          active_compound: string
          contraindications: string | null
          side_effects: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          concentration: string
          presentation: string
          active_compound: string
          contraindications?: string | null
          side_effects?: string | null
          user_id?: string 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          concentration?: string
          presentation?: string
          active_compound?: string
          contraindications?: string | null
          side_effects?: string | null
          user_id?: string 
        }
      }
      somatometry_records: {
        Row: {
          id: string
          measurement_date: string
          weight: number
          height: number
          head_circumference: number | null
          bmi: number | null
          age_months: number
          notes: string | null
          patient_id: string
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          measurement_date: string
          weight: number
          height: number
          head_circumference?: number | null
          bmi?: number | null
          age_months: number
          notes?: string | null
          patient_id: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          measurement_date?: string
          weight?: number
          height?: number
          head_circumference?: number | null
          bmi?: number | null
          age_months?: number
          notes?: string | null
          patient_id?: string
          created_at?: string
          updated_at?: string
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
