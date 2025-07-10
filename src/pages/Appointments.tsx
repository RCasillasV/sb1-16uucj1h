// src/pages/Appointments.tsx
import React, { useState, useEffect } from 'react';
import { CalendarPlus, Search, Mail, Phone, MessageCircle, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { format, startOfDay, isEqual, isBefore, parseISO } from 'date-fns'; // Importar isBefore y parseISO
import { es } from 'date-fns/locale';
import type { Database } from '../types/database.types';
import { AppointmentForm } from '../components/AppointmentForm';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import { useStyles } from '../hooks/useStyles'; // Importar useStyles

type AppointmentWithPatient = Database['public']['Tables']['tcCitas']['Row'] & {
  patients: {
    id : string;
    Nombre: string;
    Paterno: string;
    Materno: string;
    FechaNacimiento: string;
    Sexo: string;
    Email: string | null;
    Telefono: string | null;
  } | null;
};

export function Appointments() {
  const { currentTheme } = useTheme();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { selectedPatient } = useSelectedPatient();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const filter = location.state?.filter;
  const { buttonClasses } = useStyles(); // Llamar useStyles aquí

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  async function fetchAppointments() {
    try {
      const data = await api.appointments.getAll();
      let filteredData = data;

      if (filter === 'today') {
        const today = startOfDay(new Date());
        filteredData = data.filter(appointment =>
          isEqual(startOfDay(parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`)), today)
        );
      } else if (filter === 'upcoming') {
        const now = new Date();
        filteredData = data.filter(appointment =>
          parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`) > now
        );
      }

      setAppointments(filteredData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAppointments = appointments.filter(appointment =>
    (appointment.patients?.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.patients?.Paterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.patients?.Materno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.motivo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAppointmentCreated = () => {
    setShowForm(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const handleNewAppointment = () => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    setSelectedAppointment(null);
    setShowForm(true);
  };

  const handleAppointmentClick = (appointment: AppointmentWithPatient) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const isValidPhone = (phone: string | null): boolean => {
    return !!phone && /^\d{10}$/.test(phone);
  };

  const isValidEmail = (email: string | null): boolean => {
    return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleWhatsAppReminder = (appointment: AppointmentWithPatient) => {
    if (!appointment.patients?.Telefono) return;

    const dateTime = format(parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`), "PPp", { locale: es });
    const message = `Recordatorio: Su cita está programada para ${dateTime}`;
    const url = `https://api.whatsapp.com/send?phone=52${appointment.patients.Telefono}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleEmailReminder = (appointment: AppointmentWithPatient) => {
    if (!appointment.patients?.Email) return;

    const dateTime = format(parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`), "PPp", { locale: es });
    const subject = `Recordatorio de Cita Médica`;
    const body = `Recordatorio: Su cita está programada para ${dateTime}`;
    const mailtoUrl = `mailto:${appointment.patients.Email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handlePhoneCall = (appointment: AppointmentWithPatient) => {
    if (!appointment.patients?.Telefono) return;
    window.location.href = `tel:${appointment.patients.Telefono}`;
  };

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <AppointmentForm
          onSuccess={handleAppointmentCreated}
          onCancel={() => {
            setShowForm(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Calendar
            className="h-6 w-6"
            style={{ color: currentTheme.colors.primary }}
          />
          <h1
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            {filter === 'today' ? 'Citas de Hoy' :
             filter === 'upcoming' ? 'Próximas Citas' :
             'Citas'}
          </h1>
        </div>
        <button
          onClick={handleNewAppointment}
          className={clsx(buttonClasses.base, buttonClasses.primary)}
        >
          <CalendarPlus className="h-5 w-5 mr-1" />
          Nueva Cita
        </button>
      </div>

      <div className="mb-5">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Buscar citas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2"
            style={{
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
          />
        </div>
      </div>

      <div
        className="rounded-lg shadow overflow-hidden"
        style={{
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
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
                className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Recordar cita
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-2 text-center"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Cargando citas...
                </td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-2 text-center"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  No hay citas programadas
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appointment) => {
                const appointmentDateTime = parseISO(`${appointment.fecha_cita}T${appointment.hora_cita}`);
                const isPastAppointment = isBefore(appointmentDateTime, new Date());
                const isDisabled = isPastAppointment; // Disable buttons if appointment is in the past

                return (
                  <tr
                    key={appointment.id}
                    className={clsx(
                      "hover:bg-gray-50",
                      isPastAppointment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer' // Apply opacity and change cursor if past
                    )}
                    style={{ color: isPastAppointment ? currentTheme.colors.textSecondary : currentTheme.colors.text }}
                  >
                    <td
                      className="px-6 py-2 whitespace-nowrap"
                      onClick={() => {
                        if (!isPastAppointment) {
                          handleAppointmentClick(appointment);
                        }
                      }}
                    >
                      {format(appointmentDateTime, "PPp", { locale: es })}
                    </td>
                    <td
                      className="px-6 py-2 whitespace-nowrap"
                      onClick={() => {
                        if (!isPastAppointment) {
                          handleAppointmentClick(appointment);
                        }
                      }}
                    >
                      {appointment.patients?.Nombre} {appointment.patients?.Paterno} {appointment.patients?.Materno}
                    </td>
                    <td
                      className="px-6 py-2 whitespace-nowrap"
                      onClick={() => {
                        if (!isPastAppointment) {
                          handleAppointmentClick(appointment);
                        }
                      }}
                    >
                      {appointment.motivo}
                    </td>
                    <td
                      className="px-6 py-2 whitespace-nowrap"
                      onClick={() => {
                        if (!isPastAppointment) {
                          handleAppointmentClick(appointment);
                        }
                      }}
                    >
                      <span className={clsx(
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                        appointment.estado === 'programada' && 'bg-green-100 text-green-800',
                        appointment.estado === 'cancelada' && 'bg-red-100 text-red-800',
                        appointment.estado === 'completada' && 'bg-yellow-100 text-yellow-800'
                      )}>
                        {appointment.estado === 'programada' ? 'Programada' :
                         appointment.estado === 'cancelada' ? 'Cancelada' : 'Completada'}
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      {appointment.estado === 'programada' ? (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsAppReminder(appointment);
                            }}
                            disabled={isDisabled || !isValidPhone(appointment.patients?.Telefono)}
                            className={clsx(
                              'p-2 rounded-full transition-all',
                              (isDisabled || !isValidPhone(appointment.patients?.Telefono))
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'hover:bg-green-100 text-green-600 cursor-pointer'
                            )}
                            title={isValidPhone(appointment.patients?.Telefono) ? 'Enviar recordatorio por WhatsApp' : 'Teléfono no disponible'}
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmailReminder(appointment);
                            }}
                            disabled={isDisabled || !isValidEmail(appointment.patients?.Email)}
                            className={clsx(
                              'p-2 rounded-full transition-all',
                              (isDisabled || !isValidEmail(appointment.patients?.Email))
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'hover:bg-blue-100 text-blue-600 cursor-pointer'
                            )}
                            title={isValidEmail(appointment.patients?.Email) ? 'Enviar recordatorio por email' : 'Email no disponible'}
                          >
                            <Mail className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhoneCall(appointment);
                            }}
                            disabled={isDisabled || !isValidPhone(appointment.patients?.Telefono)}
                            className={clsx(
                              'p-2 rounded-full transition-all',
                              (isDisabled || !isValidPhone(appointment.patients?.Telefono))
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'hover:bg-purple-100 text-purple-600 cursor-pointer'
                            )}
                            title={isValidPhone(appointment.patients?.Telefono) ? 'Llamar al paciente' : 'Teléfono no disponible'}
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="text-sm"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          No aplica
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={clsx(buttonClasses.base, buttonClasses.outline)}
            onClick={() => {
              setShowWarningModal(false);
              navigate('/patients');
            }}
          >
            Entendido
          </button>
        }
      >
        <p>Por favor, seleccione un paciente primero desde la sección de Pacientes.</p>
      </Modal>
    </div>
  );
}
