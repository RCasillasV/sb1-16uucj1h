import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, User, Calendar, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getStatusBadgeInfo } from '../utils/appointmentStatuses';
import clsx from 'clsx';

interface HistoryEntry {
  id: string;
  created_at: string;
  estado_anterior: number;
  estado_nuevo: number;
  estado_anterior_nombre: string;
  estado_nuevo_nombre: string;
  fecha_anterior: string;
  hora_anterior: string;
  fecha_nueva: string;
  hora_nueva: string;
  usuario_nombre: string;
  notas?: string;
}

interface AppointmentHistoryTimelineProps {
  history: HistoryEntry[];
  isLoading?: boolean;
}

export function AppointmentHistoryTimeline({ history, isLoading }: AppointmentHistoryTimelineProps) {
  const { currentTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="px-6 py-4" style={{ color: currentTheme.colors.textSecondary }}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent" style={{ borderColor: currentTheme.colors.primary }} />
          <span>Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="px-6 py-4 text-center" style={{ color: currentTheme.colors.textSecondary }}>
        <p className="text-sm">No hay cambios registrados en el historial</p>
      </div>
    );
  }

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const dateTime = parseISO(`${dateStr}T${timeStr}`);
      return format(dateTime, "d 'de' MMMM yyyy, HH:mm", { locale: es });
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, "d 'de' MMMM yyyy, HH:mm", { locale: es });
    } catch {
      return timestamp;
    }
  };

  const hasDateChange = (entry: HistoryEntry) => {
    return entry.fecha_anterior !== entry.fecha_nueva || entry.hora_anterior !== entry.hora_nueva;
  };

  return (
    <div className="px-6 py-4">
      <h4 className="text-sm font-semibold mb-4" style={{ color: currentTheme.colors.text }}>
        Historial de Cambios
      </h4>

      <div className="relative">
        {/* Timeline vertical line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-0.5"
          style={{ background: currentTheme.colors.border }}
        />

        <div className="space-y-4">
          {history.map((entry, index) => {
            const isFirst = index === 0;
            const isLast = index === history.length - 1;
            const estadoAnteriorInfo = getStatusBadgeInfo(entry.estado_anterior);
            const estadoNuevoInfo = getStatusBadgeInfo(entry.estado_nuevo);
            const dateChanged = hasDateChange(entry);

            return (
              <div key={entry.id} className="relative pl-6">
                {/* Timeline dot */}
                <div
                  className={clsx(
                    'absolute left-0 top-1 w-4 h-4 rounded-full border-2',
                    isFirst ? 'animate-pulse' : ''
                  )}
                  style={{
                    background: currentTheme.colors.surface,
                    borderColor: isFirst ? estadoNuevoInfo.color : currentTheme.colors.border,
                  }}
                />

                <div
                  className={clsx(
                    'rounded-lg p-3 border',
                    isFirst && 'ring-1'
                  )}
                  style={{
                    background: isFirst ? `${estadoNuevoInfo.color}08` : currentTheme.colors.surface,
                    borderColor: isFirst ? estadoNuevoInfo.color : currentTheme.colors.border,
                    ringColor: isFirst ? `${estadoNuevoInfo.color}40` : undefined,
                  }}
                >
                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3 w-3" style={{ color: currentTheme.colors.textSecondary }} />
                    <span className="text-xs font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                      {formatTimestamp(entry.created_at)}
                    </span>
                  </div>

                  {/* Status change */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                      style={{ background: `${estadoAnteriorInfo.color}20`, color: estadoAnteriorInfo.color }}
                    >
                      <estadoAnteriorInfo.icon className="h-3 w-3" />
                      <span>{entry.estado_anterior_nombre}</span>
                    </div>
                    <ArrowRight className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                      style={{ background: `${estadoNuevoInfo.color}20`, color: estadoNuevoInfo.color }}
                    >
                      <estadoNuevoInfo.icon className="h-3 w-3" />
                      <span>{entry.estado_nuevo_nombre}</span>
                    </div>
                  </div>

                  {/* Date/Time change if applicable */}
                  {dateChanged && (
                    <div className="mb-2 p-2 rounded text-xs" style={{ background: `${currentTheme.colors.primary}10` }}>
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" style={{ color: currentTheme.colors.primary }} />
                        <span className="font-medium" style={{ color: currentTheme.colors.primary }}>
                          Reprogramación
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: currentTheme.colors.text }}>
                        <div>
                          <div className="font-medium opacity-70">Anterior:</div>
                          <div>{formatDateTime(entry.fecha_anterior, entry.hora_anterior)}</div>
                        </div>
                        <div>
                          <div className="font-medium opacity-70">Nueva:</div>
                          <div>{formatDateTime(entry.fecha_nueva, entry.hora_nueva)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User who made the change */}
                  <div className="flex items-center gap-2 text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                    <User className="h-3 w-3" />
                    <span>Por: <span className="font-medium">{entry.usuario_nombre}</span></span>
                  </div>

                  {/* Notes if available */}
                  {entry.notas && (
                    <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: currentTheme.colors.border, color: currentTheme.colors.text }}>
                      <span className="font-medium">Notas:</span> {entry.notas}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
