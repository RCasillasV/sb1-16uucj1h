import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, FileText, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { calculateAge } from '../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Database } from '../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

// Componente InfoSection
const InfoSection = ({ title, children, className = '' }: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
}) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className={clsx('mb-6', className)}>
      <h3 
        className="text-lg font-semibold mb-3 pb-2 border-b-2 print:text-black print:border-black"
        style={{ 
          color: currentTheme.colors.primary,
          borderColor: currentTheme.colors.primary,
        }}
      >
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:!grid print:!grid-cols-2 print:!gap-4">
        {children}
      </div>
    </div>
  );
};

// Componente InfoField
const InfoField = ({ label, value, fullWidth = false }: { 
  label: string; 
  value: string | null | undefined; 
  fullWidth?: boolean;
}) => {
  const { currentTheme } = useTheme();
  
  return (
    <div className={clsx('space-y-1', fullWidth && 'md:col-span-2 lg:col-span-3 print:!col-span-2')}>
      <dt 
        className="text-xs font-normal print:text-black"
        style={{ color: currentTheme.colors.textSecondary }}
      >
        {label}
      </dt>
      <dd 
        className="text-lg font-semibold print:text-black"
        style={{ color: currentTheme.colors.text }}
      >
        {value || 'No especificado'}
      </dd>
    </div>
  );
};

export function PatientReportPage() {
  const { currentTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);

  console.log('PatientReportPage: Componente montado.'); // Log al montar

  useEffect(() => {
    console.log('PatientReportPage: useEffect disparado.');
    console.log('PatientReportPage: authLoading =', authLoading, 'user =', user ? 'presente' : 'nulo', 'id =', id);
    if (!authLoading && user && id) {
      fetchPatient();
    } else if (!authLoading && !user) {
      console.log('PatientReportPage: Usuario no autenticado después de cargar auth.');
      setError('Usuario no autenticado para ver el informe.');
      setLoading(false);
    } else if (!id) {
      console.log('PatientReportPage: ID de paciente no proporcionado.');
      setError('ID de paciente no proporcionado.');
      setLoading(false);
    }
  }, [user, authLoading, id]);

  // Auto-print when data is loaded and URL has print parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutoPrint = urlParams.get('print') === 'true';
    
    console.log('PatientReportPage: useEffect auto-print disparado.');
    console.log('PatientReportPage: shouldAutoPrint =', shouldAutoPrint, 'patient =', patient ? 'presente' : 'nulo', 'loading (interno) =', loading, 'autoPrintTriggered =', autoPrintTriggered);

    if (shouldAutoPrint && patient && !loading && !autoPrintTriggered) {
      setAutoPrintTriggered(true);
      // Small delay to ensure content is fully rendered
      setTimeout(() => {
        console.log('PatientReportPage: Disparando window.print()');
        window.print();
      }, 500);
    }
  }, [patient, loading, autoPrintTriggered]);

  const fetchPatient = async () => {
    console.log('PatientReportPage: fetchPatient() llamado.');
    setLoading(true);
    setError(null);
    try {
      const data = await api.patients.getById(id as string);
      console.log('PatientReportPage: Datos del paciente recibidos:', data);
      if (!data) {
        setError('Paciente no encontrado');
        console.log('PatientReportPage: Error - Paciente no encontrado.');
        return;
      }
      setPatient(data);
    } catch (err) {
      console.error('PatientReportPage: Error al cargar paciente:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del paciente');
    } finally {
      setLoading(false);
      console.log('PatientReportPage: fetchPatient() finalizado. loading (interno) = false.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
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

  console.log('PatientReportPage: Renderizando. loading (interno) =', loading, 'authLoading =', authLoading, 'error =', error, 'patient =', patient ? 'presente' : 'nulo');

  if (loading || authLoading) {
    console.log('PatientReportPage: Mostrando cargador.');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          {authLoading ? 'Autenticando...' : 'Cargando datos del paciente...'}
        </span>
      </div>
    );
  }

  if (error) {
    console.log('PatientReportPage: Mostrando mensaje de error:', error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div 
          className="p-4 rounded-md border-l-4"
          style={{
            background: '#FEE2E2',
            borderLeftColor: '#DC2626',
            color: '#DC2626',
          }}
        >
          <p className="font-medium">{error}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className={clsx(buttonStyle.base, 'mt-4')}
          style={buttonStyle.secondary}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>
      </div>
    );
  }

  if (!patient) {
    console.log('PatientReportPage: Mostrando "Paciente no encontrado".');
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p style={{ color: currentTheme.colors.text }}>Paciente no encontrado</p>
        <button
          onClick={() => navigate(-1)}
          className={clsx(buttonStyle.base, 'mt-4')}
          style={buttonStyle.secondary}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </button>
      </div>
    );
  }

  const age = patient.FechaNacimiento ? calculateAge(patient.FechaNacimiento) : null;

  return (
    <div className="min-h-screen print:min-h-0 report-page" style={{ background: currentTheme.colors.background }}>
      {/* Header with actions - hidden in print */}
      <div className="bg-white shadow-sm border-b p-4 print:hidden" style={{ background: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
            <h1 
              className="text-2xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              Informe del Paciente
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            <button
              onClick={handlePrint}
              className={buttonStyle.base}
              style={buttonStyle.primary}
            >
              <Printer className="h-5 w-5 mr-2" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-6xl mx-auto p-6 print:p-8 print:max-w-none report-content">
        <div 
          className="rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none print:p-0"
          style={{ 
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          {/* Report Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold mb-2 print:text-black" style={{ color: currentTheme.colors.text }}>
              Informe del Paciente
            </h1>
            <p className="text-sm print:text-black" style={{ color: currentTheme.colors.textSecondary }}>
              Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
            </p>
          </div>

          {/* Patient identification */}
          <div className="text-center mb-8 p-6 rounded-lg print:bg-gray-100 print:rounded-none" 
               style={{ background: `${currentTheme.colors.primary}10` }}>
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 print:bg-gray-400"
              style={{ background: currentTheme.colors.primary }}
            >
              <User className="w-8 h-8 print:text-white" style={{ color: currentTheme.colors.buttonText }} />
            </div>
            <h2 className="text-2xl font-bold mb-2 print:text-black" style={{ color: currentTheme.colors.text }}>
              {patient.Nombre} {patient.Paterno} {patient.Materno}
            </h2>
            <div className="flex justify-center items-center gap-4 text-sm print:text-black" 
                 style={{ color: currentTheme.colors.textSecondary }}>
              <span>Folio: {patient.Folio || 'No asignado'}</span>
              {age && <span>• {age.formatted}</span>}
              <span>• {patient.Sexo}</span>
              {patient.FechaNacimiento && (
                <span>• Nacido el {formatDate(patient.FechaNacimiento)}</span>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <InfoSection title="Información Personal">
            <InfoField 
              label="Nombre completo" 
              value={`${patient.Nombre} ${patient.Paterno} ${patient.Materno || ''}`.trim()} 
              fullWidth 
            />
            <InfoField label="Fecha de nacimiento" value={patient.FechaNacimiento ? formatDate(patient.FechaNacimiento) : null} />
            <InfoField label="Edad" value={age?.formatted} />
            <InfoField label="Sexo" value={patient.Sexo} />
            <InfoField label="Estado civil" value={patient.EstadoCivil} />
            <InfoField label="CURP" value={patient.CURP} />
            <InfoField label="RFC" value={patient.RFC} />
            <InfoField label="Nacionalidad" value={patient.Nacionalidad} />
            <InfoField label="Estado de nacimiento" value={patient.EstadoNacimiento} />
          </InfoSection>

          {/* Contact Information */}
          <InfoSection title="Información de Contacto">
            <InfoField label="Teléfono" value={patient.Telefono} />
            <InfoField label="Email" value={patient.Email} />
            <InfoField label="Contacto de emergencia" value={patient.ContactoEmergencia} />
            <InfoField label="Dirección" value={patient.Calle} />
            <InfoField label="Colonia/Asentamiento" value={patient.Colonia || patient.Asentamiento} />
            <InfoField label="Código postal" value={patient.CodigoPostal} />
            <InfoField label="Población" value={patient.Poblacion} />
            <InfoField label="Municipio" value={patient.Municipio} />
            <InfoField label="Entidad federativa" value={patient.EntidadFederativa} />
          </InfoSection>

          {/* Medical Information */}
          <InfoSection title="Información Médica">
            <InfoField label="Tipo de sangre" value={patient.TipoSangre} />
            <InfoField 
              label="Alergias" 
              value={patient.Alergias ? patient.Alergias.join(', ') : null} 
              fullWidth 
            />
            <InfoField label="Ocupación" value={patient.Ocupacion} />
            <InfoField label="Aseguradora" value={patient.Aseguradora} />
            <InfoField label="Tipo de paciente" value={patient.TipoPaciente?.toString()} />
            <InfoField label="Médico que refiere" value={patient.Refiere} />
            <InfoField label="Responsable" value={patient.Responsable} />
          </InfoSection>

          {/* Cultural and Social Information */}
          <InfoSection title="Información Cultural y Social">
            <InfoField label="Religión" value={patient.Religion} />
            <InfoField label="Lengua indígena" value={patient.LenguaIndigena} />
            <InfoField label="Grupo étnico" value={patient.GrupoEtnico} />
            <InfoField label="Discapacidad" value={patient.Discapacidad} />
          </InfoSection>

          {/* Additional Notes */}
          {patient.Observaciones && (
            <InfoSection title="Observaciones Adicionales">
              <div className="col-span-full">
                <div 
                  className="p-4 rounded-lg print:bg-gray-50 print:rounded-none"
                  style={{ background: currentTheme.colors.background }}
                >
                  <p className="text-base print:text-black" style={{ color: currentTheme.colors.text }}>
                    {patient.Observaciones}
                  </p>
                </div>
              </div>
            </InfoSection>
          )}

          {/* Footer for print */}
          <div className="hidden print:block mt-12 pt-6 border-t border-gray-300">
            <div className="text-center text-sm text-gray-600">
              <p>DoctorSoft+ - Sistema de Gestión Médica</p>
              <p>Informe generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}