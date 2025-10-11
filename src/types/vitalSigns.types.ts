export interface VitalSignCatalog {
  id: string;
  created_at: string;
  updated_at: string;
  idbu: string;
  Descripcion: string;
  Unidad: string;
  sexo: 'M' | 'F' | 'AMBOS';
  edad_minima: number;
  edad_maxima: number;
  valor_minimo_normal: number;
  valor_maximo_normal: number;
  valor_critico_bajo: number | null;
  valor_critico_alto: number | null;
  frecuencia_registro: string | null;
  metodo_medicion: string | null;
  activo: boolean;
  id_usuario: string | null;
}

export interface VitalSignRecord {
  id: string;
  created_at: string;
  updated_at: string;
  paciente_id: string;
  user_id: string;
  idbu: string;
  id_cita: string | null;
  id_signo_vital: string;
  valor_medido: number;
  fecha_hora: string;
  metodo_usado: string | null;
  notas: string | null;
  es_critico: boolean;
  deleted_at: string | null;
  tcSignosVitales?: VitalSignCatalog;
}

export interface VitalSignFormData {
  id_signo_vital: string;
  valor_medido: number;
  fecha_hora: string;
  metodo_usado?: string;
  notas?: string;
  id_cita?: string;
}

export interface VitalSignTrend {
  fecha_hora: string;
  valor_medido: number;
  es_critico: boolean;
  descripcion: string;
  unidad: string;
}
