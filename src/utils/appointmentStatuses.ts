// src/utils/appointmentStatuses.ts   Bolt

import { CheckCircle, XCircle, Clock, RefreshCw, PauseCircle, AlertTriangle, UserX, UserCheck } from 'lucide-react';
import React from 'react'; // Importar React para los iconos

// Mapeo de IDs numéricos a información de estados
export const DETAILED_APPOINTMENT_STATUSES = {
  1: { display: 'Programada', color: '#3B82F6', icon: Clock, name: 'Programada' },
  2: { display: 'Confirmada', color: '#22C55E', icon: CheckCircle, name: 'Confirmada' },
  3: { display: 'En Progreso', color: '#F59E0B', icon: RefreshCw, name: 'En Progreso' },
  4: { display: 'Atendida', color: '#10B981', icon: CheckCircle, name: 'Atendida' },
  5: { display: 'No se Presentó', color: '#EF4444', icon: UserX, name: 'No se Presentó' },
  6: { display: 'Cancelada x Paciente', color: '#EF4444', icon: XCircle, name: 'Cancelada x Paciente' },
  7: { display: 'Cancelada x Médico', color: '#EF4444', icon: XCircle, name: 'Cancelada x Médico' },
  8: { display: 'Reprogramada x Paciente', color: '#6366F1', icon: RefreshCw, name: 'Reprogramada x Paciente' },
  9: { display: 'Reprogramada x Médico', color: '#6366F1', icon: RefreshCw, name: 'Reprogramada x Médico' },
  10: { display: 'En Espera', color: '#9CA3AF', icon: PauseCircle, name: 'En Espera' },
  11: { display: 'Urgencia', color: '#DC2626', icon: AlertTriangle, name: 'Urgencia' },
};

// Tipo para los IDs numéricos de estados
export type DetailedAppointmentStatus = keyof typeof DETAILED_APPOINTMENT_STATUSES;

// Función para obtener el color basado en el ID de estado
export function getStatusColor(statusId: number): string {
  return DETAILED_APPOINTMENT_STATUSES[statusId as DetailedAppointmentStatus]?.color || '#9CA3AF';
}

// Función para obtener la información completa del badge (texto, color, icono)
export function getStatusBadgeInfo(statusId: number): { text: string; color: string; icon: React.ElementType } {
  const info = DETAILED_APPOINTMENT_STATUSES[statusId as DetailedAppointmentStatus];
  if (info) {
    return { text: info.display, color: info.color, icon: info.icon };
  }
  // Fallback para estados no definidos
  return { text: `Estado ${statusId}`, color: '#9CA3AF', icon: Clock };
}

// Función para obtener el nombre del estado por ID
export function getStatusName(statusId: number): string {
  return DETAILED_APPOINTMENT_STATUSES[statusId as DetailedAppointmentStatus]?.name || `Estado ${statusId}`;
}

// Función para obtener el ID por nombre de estado
export function getStatusIdByName(statusName: string): number {
  const entry = Object.entries(DETAILED_APPOINTMENT_STATUSES).find(
    ([_, info]) => info.name === statusName
  );
  return entry ? parseInt(entry[0]) : 1; // Default a 'Programada'
}
