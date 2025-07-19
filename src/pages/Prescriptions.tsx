import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { CollapsibleRecord } from '../components/CollapsibleRecord';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface Prescription {
  id: string;
  created_at: string;
  prescription_text: string;
}

export function Prescriptions() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchPrescriptions();
    }
  }, [selectedPatient, user, authLoading]);

  const fetchPrescriptions = async () => {
    if (!selectedPatient) return;
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.prescriptions.getByPatientId(selectedPatient.id);
      const sortedPrescriptions = data
        .map(prescription => ({
          id: prescription.id,
          created_at: prescription.created_at,
          prescription_text: prescription.diagnosis || prescription.special_instructions || ''
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPrescriptions(sortedPrescriptions);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las recetas. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient || !newEntry.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await api.prescriptions.create({
        prescription_number: `RX-${Date.now()}`,
        patient_id: selectedPatient.id,
        diagnosis: newEntry.trim(),
        medications: [],
        special_instructions: ''
      });
      
      await fetchPrescriptions();
      setNewEntry('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la receta');
    } finally {
      setSaving(false);
    }
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
    <div className="w-full sm:w-[90%] lg:w-[80%] mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
        <h1 
          className="text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Recetas
        </h1>
      </div>

      <div 
        className="rounded-lg shadow-lg p-2"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {error && (
          <div 
            className="mb-4 p-4 rounded-md border-l-4"
            style={{
              background: '#FEE2E2',
              borderLeftColor: '#DC2626',
              color: '#DC2626',
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Prescription Area */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-2">
            <RichTextEditor
              value={newEntry}
              onChange={setNewEntry}
              placeholder="Escriba el contenido de la receta médica..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving || loading || !newEntry.trim()}
              className={clsx(buttonStyle.base, 'disabled:opacity-50')}
              style={buttonStyle.primary}
            >
              {saving ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </form>

        {/* Prescription History */}
        {prescriptions.length > 0 && (
          <div>
            <h2 
              className="text-lg font-medium mb-4 flex items-center gap-2"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fontFamily,
              }}
            >
              Historial de Recetas
              <span 
                className="px-2 py-1 text-sm rounded-full"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                }}
              >
                {prescriptions.length}
              </span>
            </h2>

            <div className="space-y-4">
              {prescriptions.map((prescription, index) => (
                <CollapsibleRecord
                  key={prescription.id}
                  date={format(new Date(prescription.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  content={prescription.prescription_text}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}