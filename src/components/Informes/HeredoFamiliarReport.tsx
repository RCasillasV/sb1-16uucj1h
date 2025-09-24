import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, User, X, Contact } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { calculateAge } from '../../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Database } from '../../types/database.types';
import { FIXED_FAMILY_MEMBERS } from '../../pages/HeredoFamHistory';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];
type HeredoFamilialRecord = Database['public']['Tables']['tpFcHeredoFamiliar']['Row'];

interface HeredoFamilialReportProps {
  patientId: string;
  isModalView?: boolean;
  onClose?: () => void;
  patientData?: Patient | null; // Optional: pass patient data to avoid refetching
  isSubReport?: boolean;
}

export function HeredoFamiliarReport({
  patientId,
  isModalView = false,
  onClose,
  patientData,
  isSubReport = false,
}: HeredoFamilialReportProps) {
  const { currentTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(patientData || null);
  const [heredoFamilialRecords, setHeredoFamilialRecords] = useState<HeredoFamilialRecord[]>([]);
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

      const records = await api.heredoFamilialHistory.getAllByPatientId(patientId);
      
      // Filter records: only show if patologias, estado_vital, edad, or notas are present
      const filteredRecords = records.filter(record =>
        (record.patologias && (record.patologias as any[]).length > 0) ||
        record.estado_vital ||
        record.edad !== null ||
        record.notas
      );
      setHeredoFamilialRecords(filteredRecords);

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del informe');
    } finally {
      setLoading(false);
    }
  };

  // Ordenar registros según el orden definido en FIXED_FAMILY_MEMBERS
  const familyMemberOrder = React.useMemo(() => {
    const orderMap = new Map<string, number>();
    FIXED_FAMILY_MEMBERS.forEach((member, index) => {
      orderMap.set(member.key, index);
    });
    return orderMap;
  }, []);

  const sortedHeredoFamilialRecords = React.useMemo(() => {
    return [...heredoFamilialRecords].sort((a, b) => {
      const orderA = familyMemberOrder.get(a.miembro_fam || '') ?? Infinity;
      const orderB = familyMemberOrder.get(b.miembro_fam || '') ?? Infinity;
      return orderA - orderB;
    });
  }, [heredoFamilialRecords, familyMemberOrder]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:!grid print:!grid-cols-2 print:!gap-4">
        {children}
      </div>
    </div>
  );

  const InfoField = ({ label, value, fullWidth = false }: {
    label: string;
    value: string | null | undefined;
    fullWidth?: boolean;
  }) => (
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ color: currentTheme.colors.primary }} />
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
            <Contact className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              Informe de Antecedentes Heredo-Familiares
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
                Informe de Antecedentes Heredo-Familiares
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
          </>
        )}

        {/* Heredo Familial Records */}
        <InfoSection title="Antecedentes Heredo-Familiares">
          {sortedHeredoFamilialRecords.length === 0 ? (
            <div className="col-span-full text-center py-4">
              <p className="text-base print:text-black" style={{ color: currentTheme.colors.textSecondary }}>
                No hay antecedentes heredo-familiares registrados con patologías o datos relevantes.
              </p>
            </div>
          ) : (
            <div className="col-span-full">
              <table className="min-w-full divide-y print:text-black" style={{ borderColor: currentTheme.colors.border }}>
                <thead>
                  <tr style={{ background: currentTheme.colors.background }}>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>Parentesco</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>Estado Vital</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>Edad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>Patologías</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
                  {sortedHeredoFamilialRecords.map((record) => (
                    <tr key={record.id} style={{ color: currentTheme.colors.text }}>
                      <td className="px-4 py-2 whitespace-nowrap">{record.miembro_fam}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{record.estado_vital || 'No especificado'}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{record.edad !== null ? `${record.edad} años` : 'No especificado'}</td>
                      <td className="px-4 py-2">
                        {(record.patologias as any[]).length > 0 ? (
                          <ul className="list-disc list-inside">
                            {(record.patologias as any[]).map((p: any, idx: number) => (
                              <li key={idx}>{p.nPatologia}</li>
                            ))}
                          </ul>
                        ) : 'No especificado'}
                      </td>
                      <td className="px-4 py-2">{record.notas || 'No especificado'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </InfoSection>

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