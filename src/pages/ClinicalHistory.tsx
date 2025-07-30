import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({ title, children, defaultExpanded = false }: CollapsibleSectionProps) {
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={clsx(
        'border rounded-lg overflow-hidden transition-all duration-200',
        isExpanded ? 'shadow-md' : 'hover:shadow-sm'
      )}
      style={{
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
      }}
    >
      <button
        onClick={toggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-black/5"
        style={{
          background: isExpanded ? `${currentTheme.colors.primary}10` : 'transparent',
          color: currentTheme.colors.text,
        }}
        aria-expanded={isExpanded}
      >
        <h3 className="text-lg font-medium text-left">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
        )}
      </button>
      
      <div
        className={clsx(
          'transition-all duration-200 origin-top',
          isExpanded ? 'opacity-100' : 'opacity-0 h-0'
        )}
      >
        {isExpanded && (
          <div className="px-6 py-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function ClinicalHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
  }, [selectedPatient, user, authLoading]);

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

  if (!selectedPatient) {
    return (
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
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 shrink-0" style={{ color: currentTheme.colors.primary }} />
        <h1 
          className="text-xl sm:text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Ficha Clínica
        </h1>
      </div>

      <div 
        className="rounded-lg shadow-lg p-4 sm:p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="space-y-4">
          {/* Antecedentes Heredo-Familiares */}
          <CollapsibleSection title="1. Antecedentes Heredo-Familiares">
            <div 
              className="p-4 rounded-md text-center"
              style={{ 
                background: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary 
              }}
            >
              <p>Sección en desarrollo - Antecedentes Heredo-Familiares</p>
              <p className="text-sm mt-2">Aquí se registrarán los antecedentes familiares del paciente</p>
            </div>
          </CollapsibleSection>

          {/* Antecedentes Patológicos */}
          <CollapsibleSection title="2. Antecedentes Patológicos">
            <div 
              className="p-4 rounded-md text-center"
              style={{ 
                background: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary 
              }}
            >
              <p>Sección en desarrollo - Antecedentes Patológicos</p>
              <p className="text-sm mt-2">Aquí se registrarán los antecedentes patológicos del paciente</p>
            </div>
          </CollapsibleSection>

          {/* Antecedentes No Patológicos */}
          <CollapsibleSection title="3. Antecedentes No Patológicos">
            <div 
              className="p-4 rounded-md text-center"
              style={{ 
                background: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary 
              }}
            >
              <p>Sección en desarrollo - Antecedentes No Patológicos</p>
              <p className="text-sm mt-2">Aquí se registrarán los antecedentes no patológicos del paciente</p>
            </div>
          </CollapsibleSection>

          {/* Antecedentes Gineco-Obstétricos (solo para mujeres) */}
          {selectedPatient.Sexo === 'Femenino' && (
            <CollapsibleSection title="4. Antecedentes Gineco-Obstétricos">
              <div 
                className="p-4 rounded-md text-center"
                style={{ 
                  background: currentTheme.colors.background,
                  color: currentTheme.colors.textSecondary 
                }}
              >
                <p>Sección en desarrollo - Antecedentes Gineco-Obstétricos</p>
                <p className="text-sm mt-2">Aquí se registrarán los antecedentes gineco-obstétricos de la paciente</p>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}