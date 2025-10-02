import React, { useState, useEffect } from 'react';
import { Calendar, Search, Plus, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { format, parseISO, isBefore, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { AppointmentActionMenu } from '../components/AppointmentActionMenu';
import { AppointmentHistoryTimeline } from '../components/AppointmentHistoryTimeline';
import { AppointmentStatusChangeModal } from '../components/AppointmentStatusChangeModal';
import clsx from 'clsx';
import { getStatusBadgeInfo } from '../utils/appointmentStatuses';

type AppointmentWithPatient = {
  id: string;
  fecha_cita: string;
  hora_cita: string;
  motivo: string;
  estado: number;
  estado_nombre?: string;
  tipo_consulta: string;
  duracion_minutos: number;
  consultorio: number;
  urgente: boolean;
  patients: {
    id: string;
    Nombre: string;
    Paterno: string;
    Materno: string;
    FechaNacimiento: string;
    Sexo: string;
    Email: string;
    Telefono: string;
  } | null;
  [key: string]: any;
};

const TERMINAL_STATUSES = [6, 7, 8, 15]; // No se presentó, Canceladas, Cerrada

export function AppointmentsNew() {
  const { currentTheme } = useTheme();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'lastMonth' | 'custom'>('month');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [appointmentHistories, setAppointmentHistories] = useState<Record<string, any[]>>({});
  const [loadingHistories, setLoadingHistories] = useState<Set<string>>(new Set());

  // Status change modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointmentForStatus, setSelectedAppointmentForStatus] = useState<AppointmentWithPatient | null>(null);
  const [newStatusId, setNewStatusId] = useState<number | null>(null);
  const [allowedTransitions, setAllowedTransitions] = useState<Array<{ id: number; estado: string }>>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    confirmed: 0,
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [selectedPatient, dateRange, user, authLoading]);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = addMonths(now, 3); // 3 months ahead

    switch (dateRange) {
      case 'today':
        startDate = now;
        endDate = now;
        break;
      case 'week':
        startDate = now;
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        endDate = addMonths(now, 1);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(now);
        break;
      default:
        startDate = subMonths(now, 1);
        endDate = addMonths(now, 1);
    }

    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const fetchAppointments = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { start, end } = getDateRangeFilter();
      let data = await api.appointments.getByDateRange(start, end);

      // Filter by patient if one is selected
      if (selectedPatient) {
        data = data.filter(app => app.patients?.id === selectedPatient.id);
      }

      setAppointments(data as AppointmentWithPatient[]);

      // Calculate statistics
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayCount = data.filter(app => app.fecha_cita === today).length;
      const pendingCount = data.filter(app => app.estado === 1).length; // Programada
      const confirmedCount = data.filter(app => app.estado === 2).length; // Confirmada

      setStats({
        total: data.length,
        today: todayCount,
        pending: pendingCount,
        confirmed: confirmedCount,
      });
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = async (appointmentId: string) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId);
    } else {
      newExpanded.add(appointmentId);

      // Load history if not already loaded
      if (!appointmentHistories[appointmentId]) {
        setLoadingHistories(prev => new Set(prev).add(appointmentId));
        try {
          const history = await api.appointments.getAppointmentHistory(appointmentId);
          setAppointmentHistories(prev => ({ ...prev, [appointmentId]: history }));
        } catch (err) {
          console.error('Error loading appointment history:', err);
        } finally {
          setLoadingHistories(prev => {
            const next = new Set(prev);
            next.delete(appointmentId);
            return next;
          });
        }
      }
    }

    setExpandedRows(newExpanded);
  };

  const handleChangeStatus = async (appointment: AppointmentWithPatient, statusId: number) => {
    try {
      const transitions = await api.appointments.getFilteredStatusOptions(appointment.estado);
      setAllowedTransitions(transitions);
      setSelectedAppointmentForStatus(appointment);
      setNewStatusId(statusId);
      setShowStatusModal(true);
    } catch (err) {
      console.error('Error loading status transitions:', err);
    }
  };

  const confirmStatusChange = async (notes: string) => {
    if (!selectedAppointmentForStatus || newStatusId === null) return;

    try {
      await api.appointments.changeStatus(selectedAppointmentForStatus.id, newStatusId, notes);

      // Refresh appointments and history
      await fetchAppointments();
      if (expandedRows.has(selectedAppointmentForStatus.id)) {
        const history = await api.appointments.getAppointmentHistory(selectedAppointmentForStatus.id);
        setAppointmentHistories(prev => ({ ...prev, [selectedAppointmentForStatus.id]: history }));
      }

      setShowStatusModal(false);
      setSelectedAppointmentForStatus(null);
      setNewStatusId(null);
    } catch (err) {
      throw err;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const searchString = `${appointment.patients?.Nombre || ''} ${appointment.patients?.Paterno || ''} ${appointment.motivo || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const formatAppointmentDate = (dateString: string, timeString: string) => {
    try {
      const appointmentDateTime = parseISO(`${dateString}T${timeString}`);
      return format(appointmentDateTime, "d MMM yyyy, HH:mm", { locale: es });
    } catch {
      return `${dateString} ${timeString}`;
    }
  };

  const getTipoConsultaBadge = (tipo: string) => {
    const badges = {
      primera: { label: 'Primera', color: '#8B5CF6' },
      seguimiento: { label: 'Seg', color: '#3B82F6' },
      urgencia: { label: 'Urg', color: '#EF4444' },
      control: { label: 'Control', color: '#10B981' },
      revision: { label: 'Rev', color: '#F59E0B' },
    };

    const badge = badges[tipo as keyof typeof badges] || { label: tipo, color: '#6B7280' };

    return (
      <span
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: `${badge.color}20`, color: badge.color }}
      >
        {badge.label}
      </span>
    );
  };

  const isTerminalStatus = (statusId: number) => TERMINAL_STATUSES.includes(statusId);

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
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>
            Gestión de Citas
          </h1>
        </div>
        <button
          onClick={() => navigate('/citas')}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Cita
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className="p-4 rounded-lg border"
          style={{ background: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}
        >
          <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Total</div>
          <div className="text-2xl font-bold" style={{ color: currentTheme.colors.text }}>{stats.total}</div>
        </div>
        <div
          className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
          style={{ background: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}
          onClick={() => setDateRange('today')}
        >
          <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Hoy</div>
          <div className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{stats.today}</div>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{ background: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}
        >
          <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Pendientes</div>
          <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{stats.pending}</div>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{ background: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}
        >
          <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>Confirmadas</div>
          <div className="text-2xl font-bold" style={{ color: '#10B981' }}>{stats.confirmed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Buscar por paciente o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border"
            style={{
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 rounded-md border"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        >
          <option value="today">Hoy</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
          <option value="lastMonth">Mes Anterior</option>
        </select>
      </div>

      {/* Results counter */}
      <div className="mb-4">
        <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          Mostrando {filteredAppointments.length} de {appointments.length} citas
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="mb-4 p-4 rounded-md border-l-4"
          style={{ background: '#FEE2E2', borderLeftColor: '#DC2626' }}
        >
          <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      {/* Table */}
      <div
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ background: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ background: currentTheme.colors.background }}>
                <th className="px-4 py-3 text-left w-8"></th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Fecha y Hora
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Paciente
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Tipo
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Duración
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Motivo
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Estado
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Consultorio
                </th>
                <th className="px-4 py-3 text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              {(loading || authLoading) ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center" style={{ color: currentTheme.colors.textSecondary }}>
                    Cargando citas...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center" style={{ color: currentTheme.colors.textSecondary }}>
                    No hay citas registradas
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => {
                  const isExpanded = expandedRows.has(appointment.id);
                  const appointmentDateTime = parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`);
                  const isPast = isBefore(appointmentDateTime, new Date());
                  const statusInfo = getStatusBadgeInfo(appointment.estado);
                  const isTerminal = isTerminalStatus(appointment.estado);

                  return (
                    <React.Fragment key={appointment.id}>
                      <tr
                        className={clsx(
                          'border-t transition-colors',
                          isExpanded && 'bg-black/[0.02]'
                        )}
                        style={{ borderColor: currentTheme.colors.border }}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRow(appointment.id)}
                            className="p-1 rounded hover:bg-black/5 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                            ) : (
                              <ChevronDown className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
                          {formatAppointmentDate(appointment.fecha_cita, appointment.hora_cita)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
                          {appointment.patients
                            ? `${appointment.patients.Nombre} ${appointment.patients.Paterno}`
                            : 'Sin paciente'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getTipoConsultaBadge(appointment.tipo_consulta)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: currentTheme.colors.text }}>
                          {appointment.duracion_minutos} min
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" style={{ color: currentTheme.colors.text }}>
                          {appointment.motivo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <statusInfo.icon className="h-4 w-4" style={{ color: statusInfo.color }} />
                            <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center" style={{ color: currentTheme.colors.text }}>
                          {appointment.consultorio}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AppointmentActionMenu
                            appointmentId={appointment.id}
                            currentStatus={appointment.estado}
                            isPast={isPast}
                            isTerminal={isTerminal}
                            allowedStatusTransitions={allowedTransitions}
                            onViewDetails={() => console.log('View details')}
                            onEdit={() => navigate('/citas', { state: { editMode: true, appointmentId: appointment.id, selectedPatient: appointment.patients } })}
                            onReschedule={() => console.log('Reschedule')}
                            onChangeStatus={(statusId) => handleChangeStatus(appointment, statusId)}
                            onAddNote={() => console.log('Add note')}
                            onCancel={() => console.log('Cancel')}
                            onViewHistory={() => toggleRow(appointment.id)}
                            onPrint={() => console.log('Print')}
                          />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ background: `${currentTheme.colors.background}` }}>
                          <td colSpan={9} className="border-t" style={{ borderColor: currentTheme.colors.border }}>
                            <AppointmentHistoryTimeline
                              history={appointmentHistories[appointment.id] || []}
                              isLoading={loadingHistories.has(appointment.id)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedAppointmentForStatus && newStatusId !== null && (
        <AppointmentStatusChangeModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedAppointmentForStatus(null);
            setNewStatusId(null);
          }}
          currentStatusId={selectedAppointmentForStatus.estado}
          currentStatusName={selectedAppointmentForStatus.estado_nombre || 'Desconocido'}
          newStatusId={newStatusId}
          newStatusName={allowedTransitions.find(t => t.id === newStatusId)?.estado || 'Desconocido'}
          isTerminalStatus={isTerminalStatus(newStatusId)}
          onConfirm={confirmStatusChange}
        />
      )}
    </div>
  );
}
