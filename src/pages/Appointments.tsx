import React, { useState, useEffect } from 'react';
import { Calendar, Search, Plus, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { AppointmentForm } from '../components/AppointmentForm';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

type AppointmentWithPatient = {
  id: string;
  fecha_cita: string;
  hora_cita: string;
  motivo: string;
  estado: 'programada' | 'completada' | 'cancelada';
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

export function Appointments() {
  const { currentTheme } = useTheme();
  const { selectedPatient, setSelectedPatient } = useSelectedPatient();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [selectedPatient, filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let data = await api.appointments.getAll();
      
      // Filter by patient if one is selected
      if (selectedPatient) {
        data = data.filter(app => app.id_paciente === selectedPatient.id);
      }
      
      // Apply additional filters
      if (filter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd');
        data = data.filter(app => app.fecha_cita === today);
      } else if (filter === 'upcoming') {
        const now = new Date();
        data = data.filter(app => {
          const appDate = parseISO(`${app.fecha_cita}T${app.hora_cita}`);
          return !isBefore(appDate, now) && app.estado === 'programada';
        });
      }
      
      setAppointments(data as AppointmentWithPatient[]);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentClick = (appointment: AppointmentWithPatient) => {
    // Verificar si la cita ya ha pasado
    const appointmentDateTime = parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`);
    const now = new Date();
    
    // Si la cita no ha pasado, seleccionar el paciente y mostrar el formulario de edición
    if (!isBefore(appointmentDateTime, now)) {
      // Seleccionar el paciente asociado a la cita
      if (appointment.patients) {
        setSelectedPatient(appointment.patients);
      }
      
      setSelectedAppointment(appointment);
      setShowForm(true);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      // Implementar la lógica para eliminar la cita
      // Por ejemplo: await api.appointments.delete(selectedAppointment.id);
      
      setShowDeleteModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Error al eliminar la cita');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedAppointment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programada':
        return (
          <span className="flex items-center gap-1 text-blue-600">
            <Clock className="h-4 w-4" />
            <span>Programada</span>
          </span>
        );
      case 'completada':
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Completada</span>
          </span>
        );
      case 'cancelada':
        return (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Cancelada</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const searchString = `${appointment.patients?.Nombre || ''} ${appointment.patients?.Paterno || ''} ${appointment.motivo || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

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

  if (showForm) {
    return (
      <AppointmentForm
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        appointment={selectedAppointment}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Citas
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Cita
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" 
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Buscar citas..."
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
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={clsx(
              'px-4 py-2 rounded-md transition-colors',
              filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('today')}
            className={clsx(
              'px-4 py-2 rounded-md transition-colors',
              filter === 'today' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            )}
          >
            Hoy
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={clsx(
              'px-4 py-2 rounded-md transition-colors',
              filter === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            )}
          >
            Próximas
          </button>
        </div>
      </div>

      {error && (
        <div 
          className="mb-4 p-4 rounded-md"
          style={{
            background: '#FEE2E2',
            color: '#DC2626',
          }}
        >
          {error}
        </div>
      )}

      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: currentTheme.colors.border }}>
            <thead>
              <tr style={{ background: currentTheme.colors.background }}>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Fecha y Hora
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Paciente
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Motivo
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Estado
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
              {loading ? (
                <tr>
                  <td 
                    colSpan={5} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Cargando citas...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td 
                    colSpan={5} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay citas registradas
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => {
                  const appointmentDateTime = parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`);
                  const isPast = isBefore(appointmentDateTime, new Date());
                  
                  return (
                    <tr 
                      key={appointment.id}
                      onClick={() => handleAppointmentClick(appointment)}
                      className={clsx(
                        'transition-colors',
                        !isPast && 'cursor-pointer hover:bg-gray-50',
                        isPast && 'opacity-70'
                      )}
                      style={{ color: currentTheme.colors.text }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.patients ? `${appointment.patients.Nombre} ${appointment.patients.Paterno}` : 'Paciente no encontrado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.motivo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          {!isPast && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(appointment);
                                  setShowForm(true);
                                }}
                                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                              >
                                <Edit className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointment(appointment);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" style={{ color: '#EF4444' }} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAppointment(null);
        }}
        title="Confirmar Eliminación"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedAppointment(null);
              }}
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
              onClick={handleDeleteAppointment}
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
        <p>¿Está seguro de que desea eliminar esta cita? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}