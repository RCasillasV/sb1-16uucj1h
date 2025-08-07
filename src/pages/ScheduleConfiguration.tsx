import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, X, Plus, Save, AlertCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAgenda } from '../contexts/AgendaContext';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { Modal } from '../components/Modal';

interface Consultorio {
  id: number;
  consultorio: string;
  activo: boolean;
}

interface BloqueoFecha {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  block_type: 'vacation' | 'congress' | 'legal' | 'other';
}

interface TcAgendaSettings {
  start_time: string;
  end_time: string;
  consultation_days: string[];
  slot_interval: number;
}

const WORK_DAYS = [
  { key: 'Lunes', label: 'Lunes' },
  { key: 'Martes', label: 'Martes' },
  { key: 'Miércoles', label: 'Miércoles' },
  { key: 'Jueves', label: 'Jueves' },
  { key: 'Viernes', label: 'Viernes' },
  { key: 'Sábado', label: 'Sábado' },
  { key: 'Domingo', label: 'Domingo' }
];

const BLOCK_TYPES = [
  { value: 'vacation', label: 'Vacaciones', color: 'bg-blue-100 text-blue-800' },
  { value: 'congress', label: 'Congreso', color: 'bg-purple-100 text-purple-800' },
  { value: 'legal', label: 'Descanso Legal', color: 'bg-green-100 text-green-800' },
  { value: 'other', label: 'Otro', color: 'bg-gray-100 text-gray-800' }
];

export function ScheduleConfiguration() {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const { agendaSettings, blockedDates, loadConfiguration } = useAgenda();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'horarios' | 'bloqueos'>('general');

  // Agenda settings state
  const [slotDuration, setSlotDuration] = useState('15');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [workDays, setWorkDays] = useState<Record<string, boolean>>({
    Lunes: true,
    Martes: true,
    Miércoles: true,
    Jueves: true,
    Viernes: true,
    Sábado: false,
    Domingo: false
  });

  // Consultorios state
  const [consultorios, setConsultorios] = useState<Consultorio[]>([
    { id: 1, consultorio: 'Consultorio 1', activo: true },
    { id: 2, consultorio: 'Consultorio 2', activo: false },
    { id: 3, consultorio: 'Consultorio 3', activo: false }
  ]);

  // Blocked dates state
  const [bloqueos, setBloqueos] = useState<BloqueoFecha[]>(blockedDates || []);
  const [newBloqueo, setNewBloqueo] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    block_type: 'vacation' as const
  });

  // Estados para el modal de confirmación de eliminación
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [bloqueoToDeleteId, setBloqueoToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConfiguration();
    }
  }, [user, loadConfiguration]);

  // Sincronizar con el contexto de agenda
  useEffect(() => {
    if (agendaSettings) {
      setSlotDuration((agendaSettings.slot_interval ?? 15).toString());
      setStartTime((agendaSettings.start_time ?? '08:00').substring(0, 5));
      setEndTime((agendaSettings.end_time ?? '20:00').substring(0, 5));
      
      const days: Record<string, boolean> = {};
      WORK_DAYS.forEach(day => {
        days[day.key] = (agendaSettings.consultation_days ?? []).includes(day.key);
      });
      setWorkDays(days);
    }
    
    if (blockedDates) {
      setBloqueos(blockedDates);
    }
    
    setLoading(false);
  }, [agendaSettings, blockedDates]);

  // Cargar consultorios separadamente ya que no están en el contexto
  useEffect(() => {
    const loadConsultorios = async () => {
      try {
        const consultoriosData = await api.consultorios.getAll();
        if (consultoriosData) {
          setConsultorios(consultoriosData);
        }
      } catch (err) {
        console.error('Error loading consultorios:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar consultorios');
      }
    };
    
    if (user) {
      loadConsultorios();
    }
  }, [user]);

  const handleSaveConfiguration = async () => {
    setSaving(true);
    setError(null);

    try {
      const selectedDays = Object.entries(workDays)
        .filter(([_, enabled]) => enabled)
        .map(([day, _]) => day);

      const agendaSettingsToSave: TcAgendaSettings = {
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        consultation_days: selectedDays,
        slot_interval: parseInt(slotDuration)
      };

      await Promise.all([
        api.agendaSettings.update(agendaSettingsToSave),
        api.consultorios.updateBatch(consultorios)
      ]);

      // Recargar configuración en el contexto
      await loadConfiguration();
      
      setError(null);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateConsultorioName = (id: number, consultorio: string) => {
    setConsultorios(prev => 
      prev.map(c => c.id === id ? { ...c, consultorio } : c)
    );
  };

  const toggleConsultorio = (id: number) => {
    setConsultorios(prev => 
      prev.map(c => c.id === id ? { ...c, activo: !c.activo } : c)
    );
  };

  const addBloqueo = async () => {
    if (!newBloqueo.start_date || !newBloqueo.end_date || !newBloqueo.reason.trim()) {
      setError('Todos los campos del bloqueo son requeridos');
      return;
    }

    try {
      const bloqueo = await api.blockedDates.create({
        start_date: newBloqueo.start_date,
        end_date: newBloqueo.end_date,
        reason: newBloqueo.reason,
        block_type: newBloqueo.block_type
      });

      setBloqueos(prev => [...prev, bloqueo]);
      setNewBloqueo({
        start_date: '',
        end_date: '',
        reason: '',
        block_type: 'vacation'
      });
    } catch (err) {
      console.error('Error adding blocked date:', err);
      setError(err instanceof Error ? err.message : 'Error al agregar bloqueo');
    }
  };

  const removeBloqueo = async (id: string) => {
    try {
      await api.blockedDates.delete(id);
      await loadConfiguration(); // Recargar los datos para reflejar el cambio
      setShowDeleteConfirmModal(false); // Cerrar el modal después de la eliminación
      setBloqueoToDeleteId(null); // Limpiar el ID del bloqueo a eliminar
    } catch (err) {
      console.error('Error removing blocked date:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar bloqueo');
    }
  };

  const handleOpenDeleteConfirmModal = (id: string) => {
    setBloqueoToDeleteId(id);
    setShowDeleteConfirmModal(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false);
    setBloqueoToDeleteId(null);
  };

  const getBloqueoTypeData = (type: string) => {
    return BLOCK_TYPES.find(bt => bt.value === type) || BLOCK_TYPES[3];
  };

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${currentTheme.colors.border}`,
      color: currentTheme.colors.text,
    },
  };

  const inputStyle = {
    backgroundColor: currentTheme.colors.surface,
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          Cargando configuración...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Configuración de Agenda
          </h1>
        </div>
        <button
          onClick={handleSaveConfiguration}
          disabled={saving}
          className={clsx(buttonStyle.base, 'disabled:opacity-50')}
          style={buttonStyle.primary}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <p 
        className="text-sm -mt-4"
        style={{ color: currentTheme.colors.textSecondary }}
      >
        Configure los parámetros básicos de su agenda médica
      </p>

      {error && (
        <div 
          className="flex items-center gap-2 p-4 rounded-md"
          style={{
            background: '#FEE2E2',
            color: '#DC2626',
          }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Custom Tab Navigation */}
      <div 
        className="flex border-b"
        style={{ borderColor: currentTheme.colors.border }}
      >
        {[
          { id: 'general', label: 'General', icon: Clock },
          { id: 'horarios', label: 'Horarios', icon: Calendar },
          { id: 'bloqueos', label: 'Bloqueos', icon: X }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 border-b-2 transition-colors',
                activeTab === tab.id ? 'border-current' : 'border-transparent hover:bg-black/5'
              )}
              style={{
                color: activeTab === tab.id ? currentTheme.colors.primary : currentTheme.colors.text,
                borderColor: activeTab === tab.id ? currentTheme.colors.primary : 'transparent',
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Slot Duration Card */}
          <div 
            className="rounded-lg shadow-lg p-6"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Configuración de Citas
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Configure la duración de cada slot de cita
            </p>
            
            <div className="space-y-2">
              <label 
                htmlFor="slot-duration"
                className="block text-sm font-medium"
                style={{ color: currentTheme.colors.text }}
              >
                Duración de cada cita (minutos)
              </label>
              <select
                id="slot-duration"
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-48 p-2 rounded-md border"
                style={inputStyle}
              >
                <option value="15">15 minutos</option>
                <option value="20">20 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </div>
          </div>

          {/* Consultorios Card */}
          <div 
            className="rounded-lg shadow-lg p-6"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Consultorios
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Configure sus consultorios disponibles
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {consultorios.map((consultorio) => (
                <div 
                  key={consultorio.id} 
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  style={{ borderColor: currentTheme.colors.border }}
                >
                  <MapPin className="h-5 w-5" style={{ color: currentTheme.colors.textSecondary }} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      {/* Custom Switch */}
                      <button
                        onClick={() => toggleConsultorio(consultorio.id)}
                        className={clsx(
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                          consultorio.activo ? 'bg-green-500' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={clsx(
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                            consultorio.activo ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                      <label 
                        className="text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {consultorio.activo ? "Habilitado" : "Deshabilitado"}
                      </label>
                    </div>
                    <input
                      value={consultorio.consultorio}
                      onChange={(e) => updateConsultorioName(consultorio.id, e.target.value)}
                      disabled={!consultorio.activo}
                      className={clsx(
                        'max-w-xs p-2 rounded-md border',
                        !consultorio.activo && 'opacity-50'
                      )}
                      style={inputStyle}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'horarios' && (
        <div className="space-y-6">
          {/* Work Days Card */}
          <div 
            className="rounded-lg shadow-lg p-6"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Días de Atención
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Seleccione los días de la semana que atenderá
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {WORK_DAYS.map((day) => (
                <div key={day.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={day.key}
                    checked={workDays[day.key]}
                    onChange={(e) =>
                      setWorkDays(prev => ({ ...prev, [day.key]: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <label 
                    htmlFor={day.key}
                    className="text-sm"
                    style={{ color: currentTheme.colors.text }}
                  >
                    {day.label} 
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Work Hours Card */}
          <div 
            className="rounded-lg shadow-lg p-6"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Horario de Trabajo
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Configure su horario de inicio y fin de jornada
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="start-time"
                  className="block text-sm font-medium"
                  style={{ color: currentTheme.colors.text }}
                >
                  Hora de inicio
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 rounded-md border"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="end-time"
                  className="block text-sm font-medium"
                  style={{ color: currentTheme.colors.text }}
                >
                  Hora de fin
                </label>
                <input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 rounded-md border"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bloqueos' && (
        <div className="space-y-6">
          {/* Add Block Card */}
          <div 
            className="rounded-lg shadow-lg p-6"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Agregar Bloqueo
            </h3>
            <p 
              className="text-sm mb-4"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Configure períodos de no disponibilidad
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={newBloqueo.start_date}
                    onChange={(e) => setNewBloqueo(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full p-2 rounded-md border"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={newBloqueo.end_date}
                    onChange={(e) => setNewBloqueo(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full p-2 rounded-md border"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Tipo de bloqueo
                  </label>
                  <select
                    value={newBloqueo.block_type}
                    onChange={(e) => setNewBloqueo(prev => ({ ...prev, block_type: e.target.value as any }))}
                    className="w-full p-2 rounded-md border"
                    style={inputStyle}
                  >
                    {BLOCK_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label 
                  className="block text-sm font-medium"
                  style={{ color: currentTheme.colors.text }}
                >
                  Motivo
                </label>
                <textarea
                  placeholder="Describa el motivo del bloqueo..."
                  value={newBloqueo.reason}
                  onChange={(e) => setNewBloqueo(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full p-2 rounded-md border"
                  style={inputStyle}
                />
              </div>
              
              <button
                onClick={addBloqueo}
                className={buttonStyle.base}
                style={buttonStyle.primary}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Bloqueo
              </button>
            </div>
          </div>

          {/* Existing Blocks Card */}
          {bloqueos.length > 0 && (
            <div 
              className="rounded-lg shadow-lg p-6"
              style={{ 
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              }}
            >
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: currentTheme.colors.text }}
              >
                Bloqueos Configurados
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Lista de períodos bloqueados
              </p>
              
              <div className="space-y-3">
                {bloqueos.map((bloqueo) => {
                  const typeData = getBloqueoTypeData(bloqueo.block_type);
                  return (
                    <div 
                      key={bloqueo.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{ borderColor: currentTheme.colors.border }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={clsx('px-2 py-1 text-xs rounded-full', typeData.color)}>
                            {typeData.label}
                          </span>
                          <span 
                            className="text-sm font-medium"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {bloqueo.reason}
                          </span>
                        </div>
                        <p 
                          className="text-sm"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          {format(new Date(bloqueo.start_date), "d 'de' MMMM 'de' yyyy", { locale: es })} - {' '}
                          {format(new Date(bloqueo.end_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenDeleteConfirmModal(bloqueo.id)}
                        className="p-2 rounded-full hover:bg-black/5 transition-colors"
                        title="Eliminar bloqueo"
                      >
                        <Trash2 className="h-4 w-4" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={handleCloseDeleteConfirmModal}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCloseDeleteConfirmModal}
              className={clsx(buttonStyle.base, 'border')}
              style={{
                background: 'transparent',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => bloqueoToDeleteId && removeBloqueo(bloqueoToDeleteId)}
              className={buttonStyle.base}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
              }}
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p>¿Está seguro de que desea eliminar este bloqueo de fecha? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}