import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, User, X, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { calculateAge } from '../../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Database } from '../../types/database.types';

// Import individual report components
import { NonPathologicalHistoryReport } from './NonPathologicalHistoryReport';
import { PathologicalHistoryReport } from './PathologicalHistoryReport';
import { HeredoFamiliarReport } from './HeredoFamiliarReport';
import { GynecoObstetricReport } from './GynecoObstetricReport';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface ComprehensiveClinicalHistoryReportProps {
  patientId: string;
  isModalView?: boolean;
  onClose?: () => void;
  patientData?: Patient | null;
}

export function ComprehensiveClinicalHistoryReport({
  patientId,
  isModalView = false,
  onClose,
  patientData,
}: ComprehensiveClinicalHistoryReportProps) {
  const { currentTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(patientData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If patientData is provided, use it directly and stop loading
    if (patientData) {
      setPatient(patientData);
      setLoading(false);
      return;
    }

    // Otherwise, fetch patient data if user is authenticated and patientId is available
    if (!authLoading && user && patientId) {
      fetchPatient();
    } else if (!authLoading && !user) {
      // If not authenticated after auth loading, set error
      setError('Usuario no autenticado para ver el informe.');
      setLoading(false);
    } else if (!patientId) {
      // If patientId is missing, set error
      setError('ID de paciente no proporcionado.');
      setLoading(false);
    }
  }, [user, authLoading, patientId, patientData]);

  // Handle print events for modal view to apply specific print styles
  useEffect(() => {
    if (!isModalView) return;

    const handleBeforePrint = () => {
      document.body.classList.add('is-printing-modal');
    };

    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-modal');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    // Cleanup event listeners when component unmounts
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-modal'); // Ensure class is removed
    };
  }, [isModalView]);

  // Function to fetch patient details
  const fetchPatient = async () => {
    if (!patientId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.patients.getById(patientId);
      if (!data) {
        setError('Paciente no encontrado');
        return;
      }
      setPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del paciente');
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger browser print dialog
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 500); // Increased delay to ensure complete rendering
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Common button styles
  const buttonStyle = {
    base: clsx(
      'flex items-center px-4 py-2 transition-colors print:hidden', // Hide buttons when printing
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons?.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors?.buttonPrimary || currentTheme.colors.primary,
      color: currentTheme.colors.buttonText,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${currentTheme.colors.border}`,
      color: currentTheme.colors.text,
    },
  };

  // Render loading state
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

  // Render error state
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
        {!isModalView && ( // Only show "Volver" button if not in modal view
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

  // Render patient not found state
  if (!patient) {
    return (
      <div className={clsx(
        isModalView ? "p-4 text-center" : "max-w-4xl mx-auto p-6"
      )}>
        <p style={{ color: currentTheme.colors.text }}>Paciente no encontrado</p>
        {!isModalView && ( // Only show "Volver" button if not in modal view
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

  // Calculate patient's age
  const age = patient.FechaNacimiento ? calculateAge(patient.FechaNacimiento) : null;

  return (
    <div className={clsx(
      isModalView
        ? "w-full print:p-0 print:max-w-none" // Full width and no padding/margins in print for modal
        : "max-w-4xl mx-auto p-6 print:p-0 print:max-w-none" // Centered and with padding normally
    )}>
      {/* Header with actions - hidden in print when not in modal view */}
      {!isModalView && (
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              Informe Clínico Integral
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

      {/* Actions for modal view (always visible in modal, hidden in print) */}
      {isModalView && (
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h2
            className="text-lg font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Informe Clínico Integral
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className={buttonStyle.base}
              style={buttonStyle.primary}
            >
              <Printer className="h-5 w-5 mr-2" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
            >
              <X className="h-5 w-5 mr-2" />
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Report content container */}
      <div
        className={clsx(
          "rounded-lg shadow-lg p-8 print:shadow-none print:rounded-none print:p-0",
          isModalView && "shadow-none p-4 print:p-0" // Remove shadow and reduce padding for modal content
        )}
        style={{
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {/* Report Header - for print (always visible in print) */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold mb-2 print:text-black" style={{ color: currentTheme.colors.text }}>
            Informe Clínico Integral
          </h1>
          <p className="text-sm print:text-black" style={{ color: currentTheme.colors.textSecondary }}>
            Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>

        {/* Patient identification section */}
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

        {/* Individual Reports Section */}
        <div className="space-y-8">
          {/* Antecedentes Heredo-Familiares */}
          <section className="break-after-page"> {/* Forces a page break after this section in print */}
            <h3 className="text-xl font-bold mb-4 print:text-black" style={{ color: currentTheme.colors.text }}>
              Antecedentes Heredo-Familiares
            </h3>
            <HeredoFamiliarReport
              patientId={patientId}
              isModalView={true} // Pass true to hide its own header/buttons
              patientData={patient} // Pass patient data to avoid re-fetching
              isSubReport={true}
            />
          </section>

          {/* Antecedentes Patológicos */}
          <section className="break-after-page">
            <h3 className="text-xl font-bold mb-4 print:text-black" style={{ color: currentTheme.colors.text }}>
              Antecedentes Patológicos
            </h3>
            <PathologicalHistoryReport
              patientId={patientId}
              isModalView={true}
              patientData={patient}
              isSubReport={true}
            />
          </section>

          {/* Antecedentes No Patológicos */}
          <section className="break-after-page">
            <h3 className="text-xl font-bold mb-4 print:text-black" style={{ color: currentTheme.colors.text }}>
              Antecedentes No Patológicos
            </h3>
            <NonPathologicalHistoryReport
              patientId={patientId}
              isModalView={true}
              patientData={patient}
              isSubReport={true}
            />
          </section>

          {/* Antecedentes Gineco-Obstétricos (conditionally rendered for female patients) */}
          {patient.Sexo?.toLowerCase() === 'femenino' && (
            <section className="break-after-page">
              <h3 className="text-xl font-bold mb-4 print:text-black" style={{ color: currentTheme.colors.text }}>
                Antecedentes Gineco-Obstétricos
              </h3>
              <GynecoObstetricReport
                patientId={patientId}
                isModalView={true}
                patientData={patient}
                isSubReport={true}
              />
            </section>
          )}
        </div>

        {/* Footer for print (hidden normally, visible in print) */}
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