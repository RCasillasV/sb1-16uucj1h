// Tipos para el sistema de actividades recientes

export type ActivityType =
  | 'cita_nueva'
  | 'cita_actualizada'
  | 'cita_cancelada'
  | 'cita_completada'
  | 'paciente_nuevo'
  | 'paciente_actualizado'
  | 'receta'
  | 'historia_clinica'
  | 'evolucion'
  | 'documento'
  | 'sistema';

export interface Activity {
  id: string;
  created_at: string;
  tipo_actividad: ActivityType;
  descripcion: string;
  descripcion_detalle?: string | null;
  id_usuario: string | null;
  nombre_usuario: string | null;
  id_paciente?: string | null;
  nombre_paciente?: string | null;
  id_entidad?: string | null;
  tipo_entidad?: string | null;
  idbu: string | null;
  metadatos: Record<string, any>;
  es_critico: boolean;
  icono: string;
  color: string;
}

export interface ActivityFilters {
  tipos?: ActivityType[];
  fechaInicio?: string;
  fechaFin?: string;
  idUsuario?: string;
  idPaciente?: string;
  esCritico?: boolean;
  busqueda?: string;
}

export interface ActivityStats {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  porTipo: Record<ActivityType, number>;
  usuarioMasActivo?: {
    id: string;
    nombre: string;
    cantidad: number;
  };
}

export interface BuActivityConfig {
  diasRetencion: number;
  notificacionesRealtime: boolean;
  exportarActividades: boolean;
}

export interface CreateActivityPayload {
  tipo_actividad: ActivityType;
  descripcion: string;
  descripcion_detalle?: string;
  id_paciente?: string;
  id_entidad?: string;
  tipo_entidad?: string;
  metadatos?: Record<string, any>;
  es_critico?: boolean;
  icono?: string;
  color?: string;
}

export interface ActivityListProps {
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
  onActivityClick?: (activity: Activity) => void;
}

export interface ActivityItemProps {
  activity: Activity;
  onClick?: (activity: Activity) => void;
  showDate?: boolean;
  compact?: boolean;
}

// Configuración de iconos y colores por tipo de actividad
export const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: string; color: string; label: string }
> = {
  cita_nueva: {
    icon: 'Calendar',
    color: '#3B82F6',
    label: 'Nueva cita',
  },
  cita_actualizada: {
    icon: 'CalendarCheck',
    color: '#10B981',
    label: 'Cita actualizada',
  },
  cita_cancelada: {
    icon: 'XCircle',
    color: '#EF4444',
    label: 'Cita cancelada',
  },
  cita_completada: {
    icon: 'CheckCircle',
    color: '#10B981',
    label: 'Cita completada',
  },
  paciente_nuevo: {
    icon: 'UserPlus',
    color: '#8B5CF6',
    label: 'Nuevo paciente',
  },
  paciente_actualizado: {
    icon: 'UserCog',
    color: '#F59E0B',
    label: 'Paciente actualizado',
  },
  receta: {
    icon: 'FileText',
    color: '#EF4444',
    label: 'Receta emitida',
  },
  historia_clinica: {
    icon: 'FileHeart',
    color: '#EC4899',
    label: 'Historia clínica',
  },
  evolucion: {
    icon: 'TrendingUp',
    color: '#06B6D4',
    label: 'Evolución clínica',
  },
  documento: {
    icon: 'Upload',
    color: '#6366F1',
    label: 'Documento subido',
  },
  sistema: {
    icon: 'Settings',
    color: '#6B7280',
    label: 'Sistema',
  },
};
