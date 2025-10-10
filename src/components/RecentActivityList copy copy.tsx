import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { ActivityItem } from './ActivityItem';
import type { Activity as ActivityType, ActivityListProps } from '../types/activity.types';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

export function RecentActivityList({
  limit = 10,
  showFilters = false,
  compact = false,
  onActivityClick,
}: ActivityListProps) {
  const { currentTheme } = useTheme();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.activities.getRecentActivities(limit);
      setActivities(data);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  const renderSkeleton = () => {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 animate-pulse"
            style={{ backgroundColor: currentTheme.colors.surface }}
          >
            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: currentTheme.colors.border }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded w-3/4"
                style={{ backgroundColor: currentTheme.colors.border }}
              />
              <div
                className="h-3 rounded w-1/2"
                style={{ backgroundColor: currentTheme.colors.border }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Estado vacío
  const renderEmpty = () => {
    return (
      <div
        className="flex flex-col items-center justify-center py-12"
        style={{ color: currentTheme.colors.textSecondary }}
      >
        <Activity className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-center">No hay actividad reciente</p>
        <p className="text-sm text-center mt-1">
          Las actividades aparecerán aquí cuando ocurran eventos en el sistema
        </p>
      </div>
    );
  };

  // Estado de error
  const renderError = () => {
    return (
      <div
        className="flex flex-col items-center justify-center py-8"
        style={{ color: currentTheme.colors.error }}
      >
        <AlertCircle className="w-10 h-10 mb-2" />
        <p className="text-center font-medium">Error al cargar actividades</p>
        <p className="text-sm text-center mt-1">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-4 px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: currentTheme.colors.primary,
            color: '#FFFFFF',
          }}
        >
          Reintentar
        </button>
      </div>
    );
  };

  return (
    <div
      className={clsx(
        'rounded-lg overflow-hidden',
        currentTheme.buttons?.shadow && 'shadow-md'
      )}
      style={{
        backgroundColor: currentTheme.colors.surface,
        border: `1px solid ${currentTheme.colors.border}`,
      }}
    >
      {loading && renderSkeleton()}
      {!loading && error && renderError()}
      {!loading && !error && activities.length === 0 && renderEmpty()}
      {!loading && !error && activities.length > 0 && (
        <div className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onClick={onActivityClick}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
