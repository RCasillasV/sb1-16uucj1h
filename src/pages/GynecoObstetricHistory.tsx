import React, { useState, useEffect } from 'react';
import { Heart, Save, AlertCircle, Baby } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export function GynecoObstetricHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  const [showGenderWarningModal, setShowGenderWarningModal] = useState(false);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    
    // Check if patient is female
    if (selectedPatient.Sexo?.toLowerCase() !== 'femenino') {
      setShowGenderWarningModal(true);
      return;
    }
    
    if (!authLoading && user) {
      // TODO: Fetch gyneco-obstetric history data
      setLoading(false);
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

  if (selectedPatient.Sexo?.toLowerCase() !== 'femenino') {
    return (
      <Modal
        isOpen={showGenderWarningModal}
        onClose={() => setShowGenderWarningModal(false)}
        title="Sección No Aplicable"
        actions={
          <button
            className={buttonStyle.base}
            style={buttonStyle.primary}
            onClick={() => {
              setShowGenderWarningModal(false);
              navigate('/patients');
            }}
          >
            Entendido
          </button>
        }
      >
        <div className="text-center">
          <Baby className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: currentTheme.colors.textSecondary }} />
          <p>Los antecedentes gineco-obstétricos solo aplican para pacientes de sexo femenino.</p>
          <p className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
            Paciente actual: {selectedPatient.Sexo}
          </p>
        </div>
      </Modal>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          {authLoading ? 'Autenticando...' : 'Cargando antecedentes gineco-obstétricos...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes Gineco-Obstétricos
          </h1>
        </div>
        <button
          onClick={() => {/* TODO: Implement save logic */}}
          disabled={saving}
          className={clsx(buttonStyle.base, 'disabled:opacity-50', 'flex items-center gap-2')}
          style={buttonStyle.primary}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div 
          className="p-4 rounded-md border-l-4"
          style={{
            background: '#FEE2E2',
            borderLeftColor: '#DC2626',
            color: '#DC2626',
          }}
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5" />
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        className="rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="text-center py-12">
          <Heart 
            className="h-16 w-16 mx-auto mb-4 opacity-50" 
            style={{ color: currentTheme.colors.textSecondary }} 
          />
          <h3 
            className="text-lg font-medium mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes Gineco-Obstétricos
          </h3>
          <p 
            className="text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Esta sección está en desarrollo. Aquí se registrará el historial ginecológico y obstétrico de la paciente.
          </p>
          <div className="mt-4 text-xs" style={{ color: currentTheme.colors.textSecondary }}>
            <p>Información a incluir:</p>
            <ul className="mt-2 space-y-1">
              <li>• Historial menstrual</li>
              <li>• Embarazos y partos</li>
              <li>• Métodos anticonceptivos</li>
              <li>• Procedimientos ginecológicos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}