import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { ReadOnlyRichText } from '../components/ReadOnlyRichText';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export function ClinicalEvolution() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evolutions, setEvolutions] = useState<Array<{ id: string; evolution_text: string; created_at: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    fetchEvolution();
  }, [selectedPatient]);

  const fetchEvolution = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      const data = await api.clinicalEvolution.getByPatientId(selectedPatient.id);
      const sortedEvolutions = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setEvolutions(sortedEvolutions);
    } catch (err) {
      console.error('Error fetching clinical evolution:', err);
      setError('Error al cargar la evolución clínica');
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
      await api.clinicalEvolution.create({
        patient_id: selectedPatient.id,
        evolution_text: newEntry.trim(),
      });
      await fetchEvolution();
      setNewEntry('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la evolución clínica');
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
        <h1 
          className="text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Evolución Clínica
        </h1>
        <span 
          className="ml-2 px-2.5 py-0.5 rounded-full text-sm font-medium"
          style={{ 
            background: `${currentTheme.colors.primary}20`,
            color: currentTheme.colors.primary,
          }}
        >
          {evolutions.length} registros
        </span>
      </div>

      <div 
        className="rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <RichTextEditor
              value={newEntry}
              onChange={setNewEntry}
              placeholder="Ingrese la nueva entrada de evolución clínica..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || loading || !newEntry.trim()}
              className={clsx(buttonStyle.base, 'disabled:opacity-50')}
              style={buttonStyle.primary}
            >
              {saving ? 'Guardando...' : 'Agregar Entrada'}
            </button>
          </div>
        </form>

        {evolutions.length > 0 && (
          <div>
            <h3 
              className="text-lg font-medium mb-4"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fontFamily,
              }}
            >
              Previa
            </h3>
            <div 
              className="space-y-4"
              style={{ 
                background: currentTheme.colors.background,
                borderColor: currentTheme.colors.border,
              }}
            >
              {evolutions.map((evolution) => (
                <div
                  key={evolution.id}
                  className="p-4 rounded-lg border"
                  style={{
                    background: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <div 
                    className="text-sm font-medium mb-2"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {format(new Date(evolution.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                  <ReadOnlyRichText content={evolution.evolution_text} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}