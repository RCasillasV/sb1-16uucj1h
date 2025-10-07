import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Icons from 'lucide-react';
import type { ActivityItemProps } from '../types/activity.types';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

export function ActivityItem({
  activity,
  onClick,
  showDate = true,
  compact = false,
}: ActivityItemProps) {
  const { currentTheme } = useTheme();

  // Obtener el icono dinámicamente
  const IconComponent = (Icons as any)[activity.icono] || Icons.Activity;

  // Formatear fecha relativa
  const formatearFecha = (fecha: string) => {
    try {
      return formatDistanceToNow(new Date(fecha), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return fecha;
    }
  };

  // Generar color de fondo suave basado en el color principal
  const getBackgroundColor = (color: string) => {
    // Convertir hex a RGB y aplicar opacidad
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'flex items-start gap-3 transition-all duration-200',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        currentTheme.buttons.shadow && 'hover:shadow-md'
      )}
      style={{
        backgroundColor: currentTheme.colors.surface,
        borderBottom: `1px solid ${currentTheme.colors.border}`,
      }}
    >
      {/* Icono */}
      <div
        className={clsx(
          'flex-shrink-0 rounded-full flex items-center justify-center',
          compact ? 'w-8 h-8' : 'w-10 h-10'
        )}
        style={{
          backgroundColor: getBackgroundColor(activity.color),
        }}
      >
        <IconComponent
          className={compact ? 'w-4 h-4' : 'w-5 h-5'}
          style={{ color: activity.color }}
        />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={clsx(
                'font-medium',
                compact ? 'text-sm' : 'text-base'
              )}
              style={{ color: currentTheme.colors.text }}
            >
              {activity.descripcion}
            </p>

            {activity.descripcion_detalle && !compact && (
              <p
                className="text-sm mt-1"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {activity.descripcion_detalle}
              </p>
            )}

            {showDate && (
              <p
                className={clsx(
                  'mt-1',
                  compact ? 'text-xs' : 'text-sm'
                )}
                style={{ color: currentTheme.colors.textSecondary }}
              >
                {formatearFecha(activity.created_at)}
                {activity.nombre_usuario && (
                  <span> • {activity.nombre_usuario}</span>
                )}
              </p>
            )}
          </div>

          {/* Badge crítico */}
          {activity.es_critico && (
            <span
              className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
              }}
            >
              Crítico
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
