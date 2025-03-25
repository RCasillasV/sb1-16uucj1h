import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { CollapsibleRecord } from '../components/CollapsibleRecord';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

export function ClinicalHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [histories, setHistories] = useState<Array<{ id: string; history_text: string; created_at: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  const [lastAppointment, setLastAppointment] = useState<{
    date: Date;
    status: string;
  } | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Date | null>(null);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    fetchHistory();
    fetchAppointments();
  }, [selectedPatient]);

  const fetchHistory = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      const data = await api.clinicalHistories.getByPatientId(selectedPatient.id);
      const sortedHistories = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistories(sortedHistories);
    } catch (err) {
      console.error('Error fetching clinical history:', err);
      setError('Error al cargar la historia clínica');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!selectedPatient) return;

    try {
      const appointments = await api.appointments.getAll();
      const patientAppointments = appointments
        .filter(app => app.patient_id === selectedPatient.id)
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

      // Get last appointment
      const last = patientAppointments.find(app => 
        new Date(app.appointment_date) <= new Date()
      );
      if (last) {
        setLastAppointment({
          date: new Date(last.appointment_date),
          status: last.status === 'completed' ? 'COMPLETA' : 'PROGRAMADA'
        });
      }

      // Get next appointment
      const next = patientAppointments.find(app => 
        new Date(app.appointment_date) > new Date() && app.status === 'scheduled'
      );
      if (next) {
        setNextAppointment(new Date(next.appointment_date));
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient || !newEntry.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await api.clinicalHistories.create({
        patient_id: selectedPatient.id,
        history_text: newEntry.trim(),
      });
      await fetchHistory();
      setNewEntry('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la historia clínica');
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
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Patient Header */}
      <div 
        className="bg-white rounded-lg shadow-md p-6 mb-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
          fontFamily: 'Arial, Helvetica, sans-serif'
        }}
      >
        <h2 
          className="text-lg font-bold mb-4"
          style={{ color: currentTheme.colors.text }}
        >
          DATOS DEL PACIENTE
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-baseline">
            <span 
              className="font-bold min-w-[180px]"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Nombre completo:
            </span>
            <span 
              className="font-bold"
              style={{ color: currentTheme.colors.text }}
            >
              {selectedPatient.paternal_surname} {selectedPatient.last_name}, {selectedPatient.first_name}
            </span>
          </div>

          {lastAppointment && (
            <div className="flex items-baseline">
              <span 
                className="font-bold min-w-[180px] flex items-center gap-2"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                <Clock className="h-4 w-4" />
                Última consulta:
              </span>
              <span style={{ color: currentTheme.colors.text }}>
                {format(lastAppointment.date, 'dd/MM/yyyy')} - 
                <span 
                  className={clsx(
                    'ml-2 font-bold',
                    lastAppointment.status === 'COMPLETA' ? 'text-green-600' : 'text-blue-600'
                  )}
                >
                  {lastAppointment.status}
                </span>
              </span>
            </div>
          )}

          {nextAppointment && (
            <div className="flex items-baseline">
              <span 
                className="font-bold min-w-[180px] flex items-center gap-2"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                <Calendar className="h-4 w-4" />
                Próxima cita:
              </span>
              <span style={{ color: currentTheme.colors.text }}>
                {format(nextAppointment, "dd MMM yy", { locale: es })}
              </span>
            </div>
          )}
        </div>
      </div>

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
          Historia Clínica
        </h1>
        <span 
          className="ml-2 px-2.5 py-0.5 rounded-full text-sm font-medium"
          style={{ 
            background: `${currentTheme.colors.primary}20`,
            color: currentTheme.colors.primary,
          }}
        >
          {histories.length} registros previos
        </span>
      </div>

      <div 
        className="rounded-lg shadow-lg p-4 sm:p-6"
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

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <h3 
              className="text-lg font-medium mb-2"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fontFamily,
              }}
            >
              Historia Actual
            </h3>
            
            <RichTextEditor
              value={newEntry}
              onChange={setNewEntry}
              placeholder="Ingrese la nueva entrada de historia clínica..."
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

        {histories.length > 0 && (
          <div>
            <h3 
              className="text-lg font-medium mb-4"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fontFamily,
              }}
            >
              Historia Previa
            </h3>
            <div className="space-y-4">
              {histories.map((history, index) => (
                <CollapsibleRecord
                  key={history.id}
                  date={format(new Date(history.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  content={history.history_text}
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