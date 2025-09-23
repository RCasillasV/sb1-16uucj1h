type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
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
          estado: 'Programada' | 'Confirmada' | 'En Progreso' | 'Atendida' | 'No se Presentó' | 'Cancelada x Paciente' | 'Cancelada x Médico' | 'Reprogramada x Paciente' | 'Reprogramada x Médico' | 'En Espera' | 'Urgencia'
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
          estado?: 'Programada' | 'Confirmada' | 'En Progreso' | 'Atendida' | 'No se Presentó' | 'Cancelada x Paciente' | 'Cancelada x Médico' | 'Reprogramada x Paciente' | 'Reprogramada x Médico' | 'En Espera' | 'Urgencia'
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
          estado?: 'Programada' | 'Confirmada' | 'En Progreso' | 'Atendida' | 'No se Presentó' | 'Cancelada x Paciente' | 'Cancelada x Médico' | 'Reprogramada x Paciente' | 'Reprogramada x Médico' | 'En Espera' | 'Urgencia'
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
      tcAgendaSettings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          idbu: string
          start_time: string
          end_time: string
          consultation_days: string[]
          slot_interval: number
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu: string
          start_time: string
          end_time: string
          consultation_days: string[]
          slot_interval: number
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu?: string
          start_time?: string
          end_time?: string
          consultation_days?: string[]
          slot_interval?: number
          user_id?: string | null
        }
      }
      tcAgendaBloqueada: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          idbu: string
          start_date: string
          end_date: string
          reason: string
          block_type: string
          user_id: string | null
          deleted_at: string | null 
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu: string
          start_date: string
          end_date: string
          reason: string
          block_type: string
          user_id?: string | null
          deleted_at?: string | null 
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu?: string
          start_date?: string
          end_date?: string
          reason?: string
          block_type?: string
          user_id?: string | null
          deleted_at?: string | null 
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
      tcPatologias: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          nombre: string
          codcie10: string | null
          especialidad: string | null
          sexo: string | null
          activo: boolean
          idUsuario: string | null
          idbu: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          nombre: string
          codcie10?: string | null
          especialidad?: string | null
          sexo?: string | null
          activo?: boolean
          idUsuario?: string | null
          idbu?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          nombre?: string
          codcie10?: string | null
          especialidad?: string | null
          sexo?: string | null
          activo?: boolean
          idUsuario?: string | null
          idbu?: string | null
        }
      }
      tpPacienteHistPatologica: {
        Row: {
          patient_id: string
          created_at: string
          updated_at: string
          id_usuario: string
          enfermedades_cronicas: Json
          otras_enfermedades_cronicas: string | null
          cirugias: Json
          hospitalizaciones: Json
          alergias: string | null
          transfusiones: string | null
          estado_inmunizacion: string | null
          detalles_inmunizacion: string | null
          medicamentos_actuales: string | null
          habitos_toxicos: Json
          otros_habitos_toxicos: string | null
          notas_generales: string | null
        }
        Insert: {
          patient_id: string
          created_at?: string
          updated_at?: string
          id_usuario: string
          enfermedades_cronicas?: Json
          otras_enfermedades_cronicas?: string | null
          cirugias?: Json
          hospitalizaciones?: Json
          alergias?: string | null
          transfusiones?: string | null
          estado_inmunizacion?: string | null
          detalles_inmunizacion?: string | null
          medicamentos_actuales?: string | null
          habitos_toxicos?: Json
          otros_habitos_toxicos?: string | null
          notas_generales?: string | null
        }
        Update: {
          created_at?: string
          updated_at?: string
          patient_id?: string
          id_usuario?: string
          enfermedades_cronicas?: Json
          otras_enfermedades_cronicas?: string | null
          cirugias?: Json
          hospitalizaciones?: Json
          alergias?: string | null
          transfusiones?: string | null
          estado_inmunizacion?: string | null
          detalles_inmunizacion?: string | null
          medicamentos_actuales?: string | null
          habitos_toxicos?: Json
          otros_habitos_toxicos?: string | null
          notas_generales?: string | null
        }
      }
      tpPacienteHistNoPatol: {
        Row: {
          created_at: string
          updated_at: string
          patient_id: string
          user_id: string
          habitos_estilo_vida: Json
          entorno_social: Json
          historial_adicional: Json
          notas_generales: string | null
        }
        Insert: {
          created_at?: string
          updated_at?: string
          patient_id: string
          user_id: string
          habitos_estilo_vida?: Json
          entorno_social?: Json
          historial_adicional?: Json
          notas_generales?: string | null
        }
        Update: {
          created_at?: string
          updated_at?: string
          patient_id?: string
          user_id?: string
          habitos_estilo_vida?: Json
          entorno_social?: Json
          historial_adicional?: Json
          notas_generales?: string | null
        }
      }
      tpDocPaciente: {
        Row: {
          id: string
          patient_id: string
          created_at: string
          updated_at: string
          user_id: string
          idbu: string
          description: string
          file_path: string
          mime_type: string
          thumbnail_url: string | null
          fecha_creacion: string
          fecha_ultima_consulta: string | null
          numero_consultas: number
          deleted_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          created_at?: string
          updated_at?: string
          user_id?: string
          idbu?: string
          description: string
          file_path: string
          mime_type: string
          thumbnail_url?: string | null
          fecha_creacion?: string
          fecha_ultima_consulta?: string | null
          numero_consultas?: number
          deleted_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          idbu?: string
          description?: string
          file_path?: string
          mime_type?: string
          thumbnail_url?: string | null
          fecha_creacion?: string
          fecha_ultima_consulta?: string | null
          numero_consultas?: number
          deleted_at?: string | null
        }
      }
      // Nueva tabla tpFcHeredoFamiliar
      tpFcHeredoFamiliar: {
        Row: {
          id: string // bigint en SQL returned as string
          created_at: string
          updated_at: string // timestamp without time zone
          patient_id: string // uuid
          id_usuario: string // uuid
          idbu: string // uuid
          miembro_fam: string | null // text
          estado_vital: string | null // text
          patologias: Json | null // json (JSONB)
          notas: string | null // text
          edad: number | null // integer
        }
        Insert: {
          id?: string // bigint en SQL returned as string, opcional si es generated by default
          created_at?: string
          updated_at?: string // timestamp without time zone
          patient_id: string // uuid
          id_usuario?: string // uuid, default auth.uid()
          idbu: string // uuid
          miembro_fam?: string | null // text
          estado_vital?: string | null // text
          patologias?: Json | null // json (JSONB)
          notas?: string | null // text
          edad?: number | null // integer
        }
        Update: {
          id?: string // bigint en SQL returned as string
          created_at?: string
          updated_at?: string // timestamp without time zone
          patient_id?: string // uuid
          id_usuario?: string // uuid
          idbu?: string // uuid
          miembro_fam?: string | null // text
          estado_vital?: string | null // text
          patologias?: Json | null // json (JSONB)
          notas?: string | null // text
          edad?: number | null // integer
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
  public: {
    Tables: {
      tcAgendaSettings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          idbu: string
          start_time: string
          end_time: string
          consultation_days: string[]
          slot_interval: number
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu: string
          start_time: string
          end_time: string
          consultation_days: string[]
          slot_interval: number
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu?: string
          start_time?: string
          end_time?: string
          consultation_days?: string[]
          slot_interval?: number
          user_id?: string | null
        }
      }
      tcAgendaBloqueada: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          idbu: string
          start_date: string  // Será date en Supabase, representado como string YYYY-MM-DD
          end_date: string    // Será date en Supabase, representado como string YYYY-MM-DD
          reason: string
          block_type: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu: string
          start_date: string  // Formato YYYY-MM-DD
          end_date: string    // Formato YYYY-MM-DD
          reason: string
          block_type: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          idbu?: string
          start_date?: string  // Formato YYYY-MM-DD
          end_date?: string    // Formato YYYY-MM-DD
          reason?: string
          block_type?: string
          user_id?: string | null
        }
      }
      tcConsultorios: { 
        Row: {
          id: number
          created_at: string
          idBu: string | null
          consultorio: string
          activo: boolean
          updated_at: string | null
        }
        Insert: {
          id: number
          created_at?: string
          idBu?: string | null
          consultorio: string
          activo?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          idBu?: string | null
          consultorio?: string
          activo?: boolean
          updated_at?: string | null
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