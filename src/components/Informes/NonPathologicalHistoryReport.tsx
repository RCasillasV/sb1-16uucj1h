//src/components/Informes/NonPathologicalHistoryReport.tsx

import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, User, X, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { calculateAge } from '../../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Database } from '../../types/database.types';
 
type Patient = Database['public']['Tables']['tcPacientes']['Row'];
type NonPathologicalHistoryRecord = Database['public']['Tables']['tpPacienteHistNoPatol']['Row'];

interface NonPathologicalHistoryReportProps {
  patientId: string;
  isModalView?: boolean;
  onClose?: () => void;
  patientData?: Patient | null;
  isSubReport?: boolean;
}

export function NonPathologicalHistoryReport({
  patientId,
  isModalView = false,
  onClose,
  patientData,
  isSubReport = false,
}: NonPathologicalHistoryReportProps) {
  const { currentTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(patientData || null);
  const [nonPathologicalRecord, setNonPathologicalRecord] = useState<NonPathologicalHistoryRecord | null>(null);
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

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      let fetchedPatient: Patient | null = patientData || null;
      if (!fetchedPatient) {
      const modalContent = document.getElementById('modal-content-print-target');
        if (!fetchedPatient) throw new Error('Paciente no encontrado');
        setPatient(fetchedPatient);
      }

      const record = await api.antecedentesNoPatologicos.getByPatientId(patientId);
      setNonPathologicalRecord(record);

    } catch (err) {
      console.error('Error fetching non-pathological history report data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del informe');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 500); // Added delay for consistency
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
    value: string | null | undefined | string[] | boolean;
    type?: 'text' | 'list' | 'boolean';
  }) => (
    <div className="space-y-1">
      <dt
        className="text-sm font-medium print:text-black"
        style={{ color: currentTheme.colors.textSecondary }}
      >
        {label}
      </dt>
      <dd
        className="text-base print:text-black"
        style={{ color: currentTheme.colors.text }}
      >
        {type === 'list' && Array.isArray(value) ? (
          value.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {value.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <span style={{ color: currentTheme.colors.textSecondary }}>No registrado</span>
          )
        ) : type === 'boolean' ? (
          value === true ? 'Sí' : 'No'
        ) : (
          value || <span style={{ color: currentTheme.colors.textSecondary }}>No registrado</span>
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
            <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              Informe de Antecedentes No Patológicos
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
                Informe de Antecedentes No Patológicos
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

        {/* Non-Pathological History Sections */}
        {nonPathologicalRecord ? (
          <>
            {/* Hábitos y Estilo de Vida */}
            <InfoSection title="Hábitos y Estilo de Vida">
              <InfoField label="Consumo de Alcohol" value={nonPathologicalRecord.habitos_estilo_vida?.alcohol as string} />
              <InfoField label="Consumo de Tabaco" value={nonPathologicalRecord.habitos_estilo_vida?.tabaco as string} />
              {nonPathologicalRecord.habitos_estilo_vida?.tabaco_cantidad && (
                <InfoField label="Cantidad de Tabaco" value={nonPathologicalRecord.habitos_estilo_vida?.tabaco_cantidad as string} />
              )}
              <InfoField label="Drogas Ilícitas" value={nonPathologicalRecord.habitos_estilo_vida?.drogas_ilicitas as boolean} type="boolean" />
              <InfoField label="Consumo de Cafeína" value={nonPathologicalRecord.habitos_estilo_vida?.cafeina as string} />
              <InfoField label="Tipo de Dieta" value={nonPathologicalRecord.habitos_estilo_vida?.dieta as string[]} type="list" />
              <InfoField label="Actividad Física" value={nonPathologicalRecord.habitos_estilo_vida?.actividad_fisica as string} />
              <InfoField label="Horas de Sueño" value={nonPathologicalRecord.habitos_estilo_vida?.horas_sueno as string} />
              <InfoField label="Calidad del Sueño" value={nonPathologicalRecord.habitos_estilo_vida?.calidad_sueno as string} />
            </InfoSection>

            {/* Entorno Social y Familiar */}
            <InfoSection title="Entorno Social y Familiar">
              <InfoField label="Tipo de Vivienda" value={nonPathologicalRecord.entorno_social?.tipo_vivienda as string} />
              <InfoField label="Número de Ocupantes" value={nonPathologicalRecord.entorno_social?.numero_ocupantes as string} />
              <InfoField label="Mascotas" value={nonPathologicalRecord.entorno_social?.mascotas as string[]} type="list" />
              <InfoField label="Nivel Educativo" value={nonPathologicalRecord.entorno_social?.nivel_educativo as string} />
              <InfoField label="Ocupación Actual" value={nonPathologicalRecord.entorno_social?.ocupacion_actual as string} />
              <InfoField label="Nivel de Ingresos" value={nonPathologicalRecord.entorno_social?.nivel_ingresos as string} />
            </InfoSection>

            {/* Historial Adicional */}
            <InfoSection title="Historial Adicional">
              <InfoField label="Inmunizaciones" value={nonPathologicalRecord.historial_adicional?.inmunizaciones as string[]} type="list" />
              <InfoField label="Alergias Ambientales" value={nonPathologicalRecord.historial_adicional?.alergias_ambientales as string[]} type="list" />
              <InfoField label="Viajes Recientes" value={nonPathologicalRecord.historial_adicional?.viajes_recientes as boolean} type="boolean" />
              {nonPathologicalRecord.historial_adicional?.detalles_viajes && (
                <InfoField label="Detalles de Viajes" value={nonPathologicalRecord.historial_adicional?.detalles_viajes as string} />
              )}
            </InfoSection>

            {/* Notas Generales */}
            {nonPathologicalRecord.notas_generales && (
              <InfoSection title="Notas Generales">
                <div className="col-span-full">
                  <div
                    className="p-4 rounded-lg print:bg-gray-50 print:rounded-none"
                    style={{ background: currentTheme.colors.background }}
                  >
                    <p className="text-base print:text-black" style={{ color: currentTheme.colors.text }}>
                      {nonPathologicalRecord.notas_generales}
                    </p>
                  </div>
                </div>
              </InfoSection>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileText
              className="h-16 w-16 mx-auto mb-4 opacity-50"
              style={{ color: currentTheme.colors.textSecondary }}
            />
            <h3
              className="text-lg font-medium mb-2 print:text-black"
              style={{ color: currentTheme.colors.text }}
            >
              Sin Antecedentes No Patológicos Registrados
            </h3>
            <p
              className="text-sm print:text-black"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              No se han registrado antecedentes no patológicos para este paciente.
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