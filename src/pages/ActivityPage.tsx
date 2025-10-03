import React, { useState, useEffect } from 'react';
import {
  Activity,
  Filter,
  RefreshCw,
  Download,
  Search,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { ActivityItem } from '../components/ActivityItem';
import { useTheme } from '../contexts/ThemeContext';
import type {
  Activity as ActivityType,
  ActivityFilters,
  ActivityType as ActType,
} from '../types/activity.types';
import { ACTIVITY_CONFIG } from '../types/activity.types';
import clsx from 'clsx';

export function ActivityPage() {
  const { currentTheme } = useTheme();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState<ActivityFilters>({
    tipos: [],
    esCritico: undefined,
    busqueda: '',
  });

  useEffect(() => {
    fetchActivities();
  }, [filters, currentPage]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * itemsPerPage;
      const data = await api.activities.getFilteredActivities(
        filters,
        itemsPerPage,
        offset
      );
      setActivities(data);

      // Obtener conteo total
      const count = await api.activities.countActivities(filters);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message || 'Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchActivities();
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, busqueda: searchQuery }));
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters((prev) => ({ ...prev, busqueda: '' }));
    setCurrentPage(1);
  };

  const handleTypeToggle = (type: ActType) => {
    setFilters((prev) => {
      const tipos = prev.tipos || [];
      const newTipos = tipos.includes(type)
        ? tipos.filter((t) => t !== type)
        : [...tipos, type];
      return { ...prev, tipos: newTipos };
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      tipos: [],
      esCritico: undefined,
      busqueda: '',
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity
            className="h-6 w-6"
            style={{ color: currentTheme.colors.primary }}
          />
          <h1
            className="text-3xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Actividad Reciente
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              border: `1px solid ${currentTheme.colors.border}`,
            }}
            disabled={loading}
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div
        className="p-4 rounded-lg space-y-4"
        style={{
          backgroundColor: currentTheme.colors.surface,
          border: `1px solid ${currentTheme.colors.border}`,
        }}
      >
        {/* Barra de búsqueda */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: currentTheme.colors.textSecondary }}
            />
            <input
              type="text"
              placeholder="Buscar en descripciones, pacientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-10 py-2 rounded-lg"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                border: `1px solid ${currentTheme.colors.border}`,
              }}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X
                  className="w-5 h-5"
                  style={{ color: currentTheme.colors.textSecondary }}
                />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: '#FFFFFF',
            }}
          >
            Buscar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: showFilters
                ? currentTheme.colors.primary
                : currentTheme.colors.background,
              color: showFilters ? '#FFFFFF' : currentTheme.colors.text,
              border: `1px solid ${currentTheme.colors.border}`,
            }}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="space-y-3 pt-3 border-t" style={{ borderColor: currentTheme.colors.border }}>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: currentTheme.colors.text }}
              >
                Tipo de Actividad
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACTIVITY_CONFIG).map(([type, config]) => {
                  const isSelected = filters.tipos?.includes(type as ActType);
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type as ActType)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? config.color
                          : currentTheme.colors.background,
                        color: isSelected ? '#FFFFFF' : currentTheme.colors.text,
                        border: `1px solid ${isSelected ? config.color : currentTheme.colors.border}`,
                      }}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.esCritico === true}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      esCritico: e.target.checked ? true : undefined,
                    }))
                  }
                  className="rounded"
                />
                <span
                  className="text-sm"
                  style={{ color: currentTheme.colors.text }}
                >
                  Solo actividades críticas
                </span>
              </label>

              <button
                onClick={handleClearFilters}
                className="text-sm font-medium transition-colors hover:underline ml-auto"
                style={{ color: currentTheme.colors.primary }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          {loading ? (
            'Cargando...'
          ) : (
            `Mostrando ${activities.length} de ${totalCount} actividades`
          )}
        </div>
      </div>

      {/* Lista de actividades */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: currentTheme.colors.surface,
          border: `1px solid ${currentTheme.colors.border}`,
        }}
      >
        {loading && (
          <div className="p-12 flex items-center justify-center">
            <RefreshCw
              className="w-8 h-8 animate-spin"
              style={{ color: currentTheme.colors.primary }}
            />
          </div>
        )}

        {!loading && error && (
          <div className="p-12 text-center" style={{ color: currentTheme.colors.error }}>
            <p className="font-medium">Error al cargar actividades</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="p-12 text-center" style={{ color: currentTheme.colors.textSecondary }}>
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron actividades</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} showDate={true} />
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              border: `1px solid ${currentTheme.colors.border}`,
            }}
          >
            Anterior
          </button>
          <span style={{ color: currentTheme.colors.text }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              border: `1px solid ${currentTheme.colors.border}`,
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
