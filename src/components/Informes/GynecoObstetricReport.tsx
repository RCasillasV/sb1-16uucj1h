import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, User, X, Heart } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { calculateAge } from '../../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Database } from '../../types/database.types';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];
type GynecoObstetricRecord = Database['public']['Tables']['tpPacienteHistGineObst']['Row'];

interface GynecoObstetricReportProps {
  patientId: string;
  isModalView?: boolean;
  onClose?: () => void;
  patientData?: Patient | null;
  isSubReport?: boolean;
}

export function GynecoObstetricReport({
  patientId,
  isModalView = false,
  onClose,
  patientData,
  isSubReport = false,
}: GynecoObstetricReportProps) {
  const { currentTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(patientData || null);
  const [gynecoObstetricRecord, setGynecoObstetricRecord] = useState<GynecoObstetricRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && patientId) {
      fetchReportData();
    } else if (!authLoading && !user) {
      setError('Usuario no autenticado para ver el informe.');
      setLoading(false);
    } else if (!patientId) {
      setError('ID de paciente no proporcionado.');
      setLoading(false);
    }
  }, [user, authLoading, patientId, patientData]);

  // Manejar eventos de impresión para aplicar estilos solo cuando sea necesario
  useEffect(() => {
    if (!isModalView) return;

    const handleBeforePrint = () => {
      document.body.classList.add('is-printing-modal');
    };

    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-modal');
    };

    // Registrar event listeners
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    // Cleanup
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      // Asegurar que la clase se elimine si el componente se desmonta
      document.body.classList.remove('is-printing-modal');
    };
  }, [isModalView]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetchedPatient: Patient | null = patientData || null;
      if (!fetchedPatient) {
        fetchedPatient = await api.patients.getById(patientId);
        if (!fetchedPatient) throw new Error('Paciente no encontrado');
        setPatient(fetchedPatient);
      }

      const record = await api.gynecoObstetricHistory.getByPatientId(patientId);
      setGynecoObstetricRecord(record);

    } catch (err) {
      console.error('Error fetching gyneco-obstetric report data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del informe');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Add a small delay to ensure DOM is ready for print
    setTimeout(() => {
      window.print();
    }, 500); // Increased delay for better rendering
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const InfoSection = ({ title, children, className = '' }: {
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => (
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
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const InfoField = ({ label, value, type = 'text' }: {
    label: string;
    value: string | number | null | undefined;
    type?: 'text' | 'number' | 'date';
  }) => (
    <div className="grid grid-cols-3 gap-4">
      <dt
        className="text-sm font-medium print:text-black"
        style={{ color: currentTheme.colors.textSecondary }}
      >
        {label}:
      </dt>
      <dd
        className="col-span-2 text-base print:text-black"
        style={{ color: currentTheme.colors.text }}
      >
        {type === 'date' && value ? (
          formatDate(value as string)
        ) : type === 'number' && value !== null && value !== undefined ? (
          value
        ) : value ? (
          value
        ) : (
          <span style={{ color: currentTheme.colors.textSecondary }}>No registrado</span>
        )}
      </dd>
    </div>
  );

  const buttonStyle = {
    base: clsx(
      'flex items-center px-4 py-2 transition-colors print:hidden',
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

  if (loading || authLoading) {
    return (
      <div className={clsx(
        "flex items-center justify-center",
        isModalView ? "min-h-[400px]" : "min-h-screen"
      )}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          {authLoading ? 'Autenticando...' : 'Cargando datos del informe...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(
        isModalView ? "p-4" : "max-w-4xl mx-auto p-6"
      )}>
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
        {!isModalView && (
          <button
            onClick={() => window.history.back()}
            className={clsx(buttonStyle.base, 'mt-4')}
            style={buttonStyle.secondary}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
        )}
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={clsx(
        isModalView ? "p-4 text-center" : "max-w-4xl mx-auto p-6"
      )}>
        <p style={{ color: currentTheme.colors.text }}>Paciente no encontrado</p>
        {!isModalView && (
          <button
            onClick={() => window.history.back()}
            className={clsx(buttonStyle.base, 'mt-4')}
            style={buttonStyle.secondary}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
        )}
      </div>
    );
  }

  const age = patient.FechaNacimiento ? calculateAge(patient.FechaNacimiento) : null;

  return (
    <div className={clsx(
      isModalView
        ? "w-full print:p-0 print:max-w-none"
        : "max-w-4xl mx-auto p-6 print:p-0 print:max-w-none"
    )}>
      {/* Header with actions - hidden in print */}
      {!isModalView && !isSubReport && (
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              Informe de Antecedentes Gineco-Obstétricos
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.history.back()}
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
      )}

      {/* Actions for modal view */}

      {/* Report content */}
      <div
        className={clsx(
          "rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none print:p-0",
          isModalView && "shadow-none p-4 print:p-0"
        )}
        style={{
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {/* Report Header - for print */}
        {!isSubReport && (
          <>
            <div className="text-center mb-8 print:mb-6">
              <h1 className="text-3xl font-bold mb-2 print:text-black" style={{ color: currentTheme.colors.text }}>
                Informe de Antecedentes Gineco-Obstétricos
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
                  <span>• Nacida el {formatDate(patient.FechaNacimiento)}</span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Gyneco-Obstetric History Sections */}
        {gynecoObstetricRecord ? (
          <>
            {/* Historial Obstétrico */}
            <InfoSection title="Historial Obstétrico">
              <InfoField
                label="Gestas (Total de embarazos)"
                value={gynecoObstetricRecord.gestas}
                type="number"
              />
              <InfoField
                label="Paras (Partos)"
                value={gynecoObstetricRecord.paras}
                type="number"
              />
              <InfoField
                label="Abortos"
                value={gynecoObstetricRecord.abortos}
                type="number"
              />
              <InfoField
                label="Cesáreas"
                value={gynecoObstetricRecord.cesareas}
                type="number"
              />
            </InfoSection>

            {/* Historial Menstrual */}
            <InfoSection title="Historial Menstrual">
              <InfoField
                label="Fecha Última Menstruación (FUM)"
                value={gynecoObstetricRecord.fum}
                type="date"
              />
              <InfoField
                label="Edad de Menarquia"
                value={gynecoObstetricRecord.menarquia ? `${gynecoObstetricRecord.menarquia} años` : null}
              />
              <InfoField
                label="Ritmo Menstrual"
                value={gynecoObstetricRecord.ritmo_menstrual}
              />
              <InfoField
                label="Método Anticonceptivo Actual"
                value={gynecoObstetricRecord.metodo_anticonceptivo}
              />
            </InfoSection>

            {/* Estudios Ginecológicos */}
            <InfoSection title="Estudios Ginecológicos">
              <InfoField
                label="Fecha Último Papanicolau"
                value={gynecoObstetricRecord.fecha_ultimo_papanicolau}
                type="date"
              />
              <InfoField
                label="Resultado Último Papanicolau"
                value={gynecoObstetricRecord.resultado_ultimo_papanicolau}
              />
              <InfoField
                label="Fecha Última Mamografía"
                value={gynecoObstetricRecord.mamografia}
                type="date"
              />
              <InfoField
                label="Resultado Última Mamografía"
                value={gynecoObstetricRecord.resultado_mamografia}
              />
            </InfoSection>

            {/* Notas Adicionales */}
            {gynecoObstetricRecord.notas_adicionales && (
              <InfoSection title="Notas Adicionales">
                <div className="col-span-full">
                  <div
                    className="p-4 rounded-lg print:bg-gray-50 print:rounded-none"
                    style={{ background: currentTheme.colors.background }}
                  >
                    <p className="text-base print:text-black" style={{ color: currentTheme.colors.text }}>
                      {gynecoObstetricRecord.notas_adicionales}
                    </p>
                  </div>
                </div>
              </InfoSection>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Heart
              className="h-16 w-16 mx-auto mb-4 opacity-50"
              style={{ color: currentTheme.colors.textSecondary }}
            />
            <h3
              className="text-lg font-medium mb-2 print:text-black"
              style={{ color: currentTheme.colors.text }}
            >
              Sin Antecedentes Gineco-Obstétricos Registrados
            </h3>
            <p
              className="text-sm print:text-black"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              No se han registrado antecedentes gineco-obstétricos para esta paciente.
            </p>
          </div>
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
  );
}