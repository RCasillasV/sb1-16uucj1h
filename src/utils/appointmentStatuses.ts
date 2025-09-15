// src/utils/appointmentStatuses.ts   Bolt

import { CheckCircle, XCircle, Clock, RefreshCw, PauseCircle, AlertTriangle, UserX, UserCheck } from 'lucide-react';
import React from 'react'; // Importar React para los iconos

// Define los estados detallados de la aplicación, que ahora coinciden con los de la base de datos
export const DETAILED_APPOINTMENT_STATUSES = {
  Programada: { display: 'Programada', color: '#3B82F6', icon: Clock },
  Confirmada: { display: 'Confirmada', color: '#22C55E', icon: CheckCircle },
  'En Progreso': { display: 'En Progreso', color: '#F59E0B', icon: RefreshCw },
  Atendida: { display: 'Atendida', color: '#10B981', icon: CheckCircle },
  'No se Presentó': { display: 'No se Presentó', color: '#EF4444', icon: UserX },
  'Cancelada x Paciente': { display: 'Cancelada x Paciente', color: '#EF4444', icon: XCircle },
  'Cancelada x Médico': { display: 'Cancelada x Médico', color: '#EF4444', icon: XCircle },
  'Reprogramada x Paciente': { display: 'Reprogramada x Paciente', color: '#6366F1', icon: RefreshCw },
  'Reprogramada x Médico': { display: 'Reprogramada x Médico', color: '#6366F1', icon: RefreshCw },
  'En Espera': { display: 'En Espera', color: '#9CA3AF', icon: PauseCircle },
  Urgencia: { display: 'Urgencia', color: '#DC2626', icon: AlertTriangle },
};

// Tipo para los valores detallados de la aplicación (y ahora de la base de datos)
export type DetailedAppointmentStatus = keyof typeof DETAILED_APPOINTMENT_STATUSES;

// Función para obtener el color basado en el estado detallado
export function getStatusColor(status: DetailedAppointmentStatus): string {
  return DETAILED_APPOINTMENT_STATUSES[status]?.color || '#9CA3AF'; // Color por defecto si no se encuentra
}

// Función para obtener la información completa del badge (texto, color, icono)
export function getStatusBadgeInfo(status: DetailedAppointmentStatus): { text: string; color: string; icon: React.ElementType } {
  const info = DETAILED_APPOINTMENT_STATUSES[status];
  if (info) {
    return { text: info.display, color: info.color, icon: info.icon };
  }
  // Fallback para estados no definidos (aunque con el enum de DB no debería pasar)
  return { text: status, color: '#9CA3AF', icon: Clock };
}
