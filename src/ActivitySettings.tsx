import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

export function ActivitySettings() {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [config, setConfig] = useState({
    diasRetencion: 90,
    notificacionesRealtime: false,
    exportarActividades: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.activities.getActivityConfig();
      setConfig(data);
    } catch (error: any) {
      console.error('Error fetching activity config:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await api.activities.updateActivityConfig(config);
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
    } catch (error: any) {
      console.error('Error saving activity config:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: currentTheme.colors.text }}>
          Configuración de Actividades
        </h2>
        <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          Administra cómo se registran y almacenan las actividades del sistema
        </p>
      </div>

      {message && (
        <div
          className={clsx(
            'p-4 rounded-lg flex items-center gap-2',
            message.type === 'success' && 'bg-green-50 text-green-800',
            message.type === 'error' && 'bg-red-50 text-red-800'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div
        className="p-6 rounded-lg space-y-6"
        style={{
          backgroundColor: currentTheme.colors.surface,
          border: `1px solid ${currentTheme.colors.border}`,
        }}
      >
        {/* Días de retención */}
        <div>
          <label
            htmlFor="diasRetencion"
            className="block text-sm font-medium mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            Días de retención de actividades
          </label>
          <input
            type="number"
            id="diasRetencion"
            min="30"
            max="365"
            value={config.diasRetencion}
            onChange={(e) =>
              setConfig({ ...config, diasRetencion: parseInt(e.target.value) || 90 })
            }
            className="w-full px-4 py-2 rounded-lg"
            style={{
              backgroundColor: currentTheme.colors.background,
              color: currentTheme.colors.text,
              border: `1px solid ${currentTheme.colors.border}`,
            }}
          />
          <p className="text-sm mt-1" style={{ color: currentTheme.colors.textSecondary }}>
            Las actividades se eliminarán automáticamente después de este período (30-365 días)
          </p>
        </div>

        {/* Notificaciones en tiempo real */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.notificacionesRealtime}
              onChange={(e) =>
                setConfig({ ...config, notificacionesRealtime: e.target.checked })
              }
              className="w-5 h-5 rounded"
            />
            <div>
              <p className="font-medium" style={{ color: currentTheme.colors.text }}>
                Notificaciones en tiempo real
              </p>
              <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                Recibir notificaciones cuando ocurren nuevas actividades (experimental)
              </p>
            </div>
          </label>
        </div>

        {/* Exportar actividades */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.exportarActividades}
              onChange={(e) =>
                setConfig({ ...config, exportarActividades: e.target.checked })
              }
              className="w-5 h-5 rounded"
            />
            <div>
              <p className="font-medium" style={{ color: currentTheme.colors.text }}>
                Permitir exportación de actividades
              </p>
              <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                Habilitar la exportación de reportes de actividades a CSV/PDF
              </p>
            </div>
          </label>
        </div>

        {/* Botón guardar */}
        <div className="pt-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: '#FFFFFF',
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
