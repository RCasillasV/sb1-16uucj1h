import React, { useState, useEffect } from 'react';
import { Ruler, Plus, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import { WeightForAge } from '../components/growth-charts/WeightForAge';
import { HeightForAge } from '../components/growth-charts/HeightForAge';
import { BMIForAge } from '../components/growth-charts/BMIForAge';
import { HeadCircumferenceForAge } from '../components/growth-charts/HeadCircumferenceForAge';

interface SomatometryRecord {
  id: string;
  measurement_date: string;
  weight: number;
  height: number;
  head_circumference: number | null;
  bmi: number | null;
  age_months: number;
  notes: string | null;
}

interface FormData {
  measurement_date: string;
  weight: string;
  height: string;
  head_circumference: string;
  notes: string;
}

const initialFormData: FormData = {
  measurement_date: format(new Date(), 'yyyy-MM-dd'),
  weight: '',
  height: '',
  head_circumference: '',
  notes: '',
};

export function Somatometry() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<SomatometryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPatient) {
      return;
    }
    if (!authLoading && user) {
      fetchRecords();
    }
  }, [selectedPatient, user, authLoading]);

  const fetchRecords = async () => {
    if (!selectedPatient) return;
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('somatometry_records')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .order('measurement_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching somatometry records:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los registros de somatometría. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight: number, height: number): number => {
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setError(null);
    const weight = Number(formData.weight);
    const height = Number(formData.height);
    const headCircumference = formData.head_circumference ? Number(formData.head_circumference) : null;

    try {
      const birthDate = new Date(selectedPatient.FechaNacimiento);
      const measurementDate = new Date(formData.measurement_date);
      const ageInMonths = Math.floor((measurementDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

      const { error: insertError } = await supabase
        .from('somatometry_records')
        .insert([{
          patient_id: selectedPatient.id,
          measurement_date: formData.measurement_date,
          weight,
          height,
          head_circumference: headCircumference,
          bmi: calculateBMI(weight, height),
          age_months: ageInMonths,
          notes: formData.notes || null,
        }]);

      if (insertError) throw insertError;

      await fetchRecords();
      setShowModal(false);
      setFormData(initialFormData);
    } catch (err) {
      console.error('Error saving somatometry record:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el registro');
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
        isOpen={true}
        onClose={() => navigate('/patients')}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={buttonStyle.base}
            style={buttonStyle.primary}
            onClick={() => navigate('/patients')}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Ruler className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Somatometría
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={buttonStyle.base}
          style={buttonStyle.primary}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Medición
        </button>
      </div>

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
              <Ruler className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: currentTheme.colors.border }}>
            <thead>
              <tr style={{ background: currentTheme.colors.background }}>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Fecha
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Edad (meses)
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Peso (kg)
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Talla (cm)
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  PC (cm)
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  IMC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: currentTheme.colors.border }}>
              {(loading || authLoading) ? (
                <tr>
                  <td 
                    colSpan={6} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {authLoading ? 'Autenticando...' : 'Cargando registros...'}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td 
                    colSpan={6} 
                    className="px-6 py-4 text-center"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    No hay registros de somatometría
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr 
                    key={record.id}
                    style={{ color: currentTheme.colors.text }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(record.measurement_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.age_months}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.weight.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.height.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.head_circumference?.toFixed(1) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.bmi?.toFixed(1) || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth Charts */}
      {records.length > 0 && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div 
              className="p-4 rounded-lg shadow-lg"
              style={{ 
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              }}
            >
              <WeightForAge records={records} />
            </div>
            <div 
              className="p-4 rounded-lg shadow-lg"
              style={{ 
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              }}
            >
              <HeightForAge records={records} />
            </div>
            <div 
              className="p-4 rounded-lg shadow-lg"
              style={{ 
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              }}
            >
              <BMIForAge records={records} />
            </div>
            {records.some(r => r.age_months <= 36) && (
              <div 
                className="p-4 rounded-lg shadow-lg"
                style={{ 
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                }}
              >
                <HeadCircumferenceForAge records={records} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData(initialFormData);
        }}
        title="Nueva Medición"
        actions={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowModal(false);
                setFormData(initialFormData);
              }}
              className={clsx(buttonStyle.base, 'border')}
              style={{
                background: 'transparent',
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className={buttonStyle.base}
              style={buttonStyle.primary}
            >
              Guardar
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="measurement_date" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Fecha de Medición
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
              <input
                type="date"
                id="measurement_date"
                value={formData.measurement_date}
                onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
                required
                max={format(new Date(), 'yyyy-MM-dd')}
                className="flex-1 rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="weight" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Peso (kg)
              </label>
              <input
                type="number"
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
                step="0.01"
                min="0"
                max="999.99"
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="height" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Talla (cm)
              </label>
              <input
                type="number"
                id="height"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                required
                step="0.1"
                min="0"
                max="999.99"
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="head_circumference" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Perímetro Cefálico (cm)
              </label>
              <input
                type="number"
                id="head_circumference"
                value={formData.head_circumference}
                onChange={(e) => setFormData({ ...formData, head_circumference: e.target.value })}
                step="0.1"
                min="0"
                max="99.9"
                className="w-full rounded-md shadow-sm"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="notes" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Notas
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-md shadow-sm"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}