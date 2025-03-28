import React, { useState, useEffect } from 'react';
import { CalendarPlus, Search, Mail, Phone, MessageCircle, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { format, startOfDay, endOfDay, isEqual } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Database } from '../types/database.types';
import { AppointmentForm } from '../components/AppointmentForm';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

type AppointmentWithPatient = Database['public']['Tables']['appointments']['Row'] & {
  patients: {
    first_name: string;
    last_name: string;
    paternal_surname: string;
    email: string | null;
    phone: string | null;
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
          isEqual(startOfDay(new Date(appointment.appointment_date)), today)
        );
      } else if (filter === 'upcoming') {
        const now = new Date();
        filteredData = data.filter(appointment => 
          new Date(appointment.appointment_date) > now
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
    appointment.patients?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.patients?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.patients?.paternal_surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!appointment.patients?.phone) return;
    
    const dateTime = format(new Date(appointment.appointment_date), "PPp", { locale: es });
    const message = `Recordatorio: Su cita está programada para ${dateTime}`;
    const url = `https://api.whatsapp.com/send?phone=52${appointment.patients.phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleEmailReminder = (appointment: AppointmentWithPatient) => {
    if (!appointment.patients?.email) return;
    
    const dateTime = format(new Date(appointment.appointment_date), "PPp", { locale: es });
    const subject = `Recordatorio de Cita Médica`;
    const body = `Recordatorio: Su cita está programada para ${dateTime}`;
    const mailtoUrl = `mailto:${appointment.patients.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handlePhoneCall = (appointment: AppointmentWithPatient) => {
    if (!appointment.patients?.phone) return;
    window.location.href = `tel:${appointment.patients.phone}`;
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

  const buttonStyle = {
    base: clsx(
      'flex items-center px-4 py-2 transition-all duration-200',
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
          className={buttonStyle.base}
          style={buttonStyle.primary}
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
              filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  style={{ color: currentTheme.colors.text }}
                >
                  <td 
                    className="px-6 py-2 whitespace-nowrap"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    {format(new Date(appointment.appointment_date), "PPp", { locale: es })}
                  </td>
                  <td 
                    className="px-6 py-2 whitespace-nowrap"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    {appointment.patients?.first_name} {appointment.patients?.paternal_surname} {appointment.patients?.last_name}
                  </td>
                  <td 
                    className="px-6 py-2 whitespace-nowrap"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    {appointment.reason}
                  </td>
                  <td 
                    className="px-6 py-2 whitespace-nowrap"
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <span className={clsx(
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      appointment.status === 'scheduled' && 'bg-green-100 text-green-800',
                      appointment.status === 'cancelled' && 'bg-red-100 text-red-800',
                      appointment.status === 'completed' && 'bg-yellow-100 text-yellow-800'
                    )}>
                      {appointment.status === 'scheduled' ? 'Programada' :
                       appointment.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                    </span>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-center">
                    {appointment.status === 'scheduled' ? (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsAppReminder(appointment);
                          }}
                          disabled={!isValidPhone(appointment.patients?.phone)}
                          className={clsx(
                            'p-2 rounded-full transition-all',
                            isValidPhone(appointment.patients?.phone)
                              ? 'hover:bg-green-100 text-green-600 cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed'
                          )}
                          title={isValidPhone(appointment.patients?.phone) ? 'Enviar recordatorio por WhatsApp' : 'Teléfono no disponible'}
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmailReminder(appointment);
                          }}
                          disabled={!isValidEmail(appointment.patients?.email)}
                          className={clsx(
                            'p-2 rounded-full transition-all',
                            isValidEmail(appointment.patients?.email)
                              ? 'hover:bg-blue-100 text-blue-600 cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed'
                          )}
                          title={isValidEmail(appointment.patients?.email) ? 'Enviar recordatorio por email' : 'Email no disponible'}
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhoneCall(appointment);
                          }}
                          disabled={!isValidPhone(appointment.patients?.phone)}
                          className={clsx(
                            'p-2 rounded-full transition-all',
                            isValidPhone(appointment.patients?.phone)
                              ? 'hover:bg-purple-100 text-purple-600 cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed'
                          )}
                          title={isValidPhone(appointment.patients?.phone) ? 'Llamar al paciente' : 'Teléfono no disponible'}
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
              ))
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
            className={buttonStyle.base}
            style={buttonStyle.primary}
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