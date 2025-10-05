import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { somatometryService } from '../services/somatometryService';
import { SomatometryForm } from './SomatometryForm';
import type { SomatometryRecord } from '../types/somatometry';
import { Scale, Plus, Edit2, Trash2, TrendingUp, Calendar, Ruler, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { WeightForAge } from '../components/growth-charts/WeightForAge';
import { HeightForAge } from '../components/growth-charts/HeightForAge';
import { BMIForAge } from '../components/growth-charts/BMIForAge';
import { HeadCircumferenceForAge } from '../components/growth-charts/HeadCircumferenceForAge';
import { Modal } from '../components/Modal';
import { AlertModal } from '../components/AlertModal';
import clsx from 'clsx';

type Tab = 'list' | 'weight' | 'height' | 'bmi' | 'head';

export function Somatometry() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const [records, setRecords] = useState<SomatometryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SomatometryRecord | undefined>(undefined);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<SomatometryRecord | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('list');

  useEffect(() => {
    if (selectedPatient) {
      loadRecords();
    } else {
      setRecords([]);
      setLoading(false);
    }
  }, [selectedPatient]);

  const loadRecords = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setError(null);
    try {
      const data = await somatometryService.getByPatient(selectedPatient.id);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar somatometrías');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingRecord(undefined);
    setShowForm(true);
  };

  const handleEdit = (record: SomatometryRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDeleteClick = (record: SomatometryRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    try {
      await somatometryService.delete(recordToDelete.id);
      await loadRecords();
      setShowDeleteModal(false);
      setRecordToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar registro');
    }
  };

  const handleFormSuccess = async () => {
    await loadRecords();
    setShowForm(false);
    setEditingRecord(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRecord(undefined);
  };

  const getBMIClassification = (bmi: number | null, ageMonths: number): string => {
    if (!bmi || ageMonths < 2) return '';

    if (bmi < 14) return 'Bajo peso';
    if (bmi < 17) return 'Peso saludable';
    if (bmi < 19) return 'Sobrepeso';
    return 'Obesidad';
  };

  const getBMIColor = (classification: string): string => {
    switch (classification) {
      case 'Bajo peso': return '#EF4444';
      case 'Sobrepeso': return '#F59E0B';
      case 'Obesidad': return '#DC2626';
      default: return currentTheme.colors.success;
    }
  };

  if (!selectedPatient) {
    return (
      <div
        className="flex items-center justify-center h-96 rounded-lg"
        style={{ background: currentTheme.colors.surface }}
      >
        <div className="text-center">
          <AlertCircle
            className="h-16 w-16 mx-auto mb-4"
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            No hay paciente seleccionado
          </h3>
          <p style={{ color: currentTheme.colors.textSecondary }}>
            Por favor, selecciona un paciente para ver sus somatometrías
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-96 rounded-lg"
        style={{ background: currentTheme.colors.surface }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: currentTheme.colors.primary }}
          />
          <p style={{ color: currentTheme.colors.textSecondary }}>
            Cargando somatometrías...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'list' as Tab, label: 'Lista de Registros', icon: Scale },
    { id: 'weight' as Tab, label: 'Peso/Edad', icon: Scale },
    { id: 'height' as Tab, label: 'Talla/Edad', icon: Ruler },
    { id: 'bmi' as Tab, label: 'IMC/Edad', icon: TrendingUp },
    { id: 'head' as Tab, label: 'P. Cefálico/Edad', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-lg p-6 shadow-sm"
        style={{ background: currentTheme.colors.surface }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-full"
              style={{ background: currentTheme.colors.primary }}
            >
              <Scale
                className="h-6 w-6"
                style={{ color: currentTheme.colors.buttonText }}
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  color: currentTheme.colors.text,
                  fontFamily: currentTheme.typography.fonts.headings,
                }}
              >
                Somatometrías
              </h1>
              <p style={{ color: currentTheme.colors.textSecondary }}>
                {selectedPatient.Nombre} {selectedPatient.Paterno} {selectedPatient.Materno}
              </p>
            </div>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors hover:opacity-90"
            style={{
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
            }}
          >
            <Plus className="h-5 w-5" />
            Nueva Somatometría
          </button>
        </div>

        {error && (
          <div
            className="mt-4 p-4 rounded-md border-l-4"
            style={{
              background: '#FEE2E2',
              borderColor: '#DC2626',
              color: '#DC2626',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        className="rounded-lg shadow-sm overflow-hidden"
        style={{ background: currentTheme.colors.surface }}
      >
        <div
          className="flex border-b overflow-x-auto"
          style={{ borderColor: currentTheme.colors.border }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-b-2'
                    : 'hover:bg-black/5'
                )}
                style={
                  activeTab === tab.id
                    ? {
                        color: currentTheme.colors.primary,
                        borderColor: currentTheme.colors.primary,
                      }
                    : { color: currentTheme.colors.textSecondary }
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'list' && (
            <div>
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <Scale
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: currentTheme.colors.textSecondary }}
                  />
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: currentTheme.colors.text }}
                  >
                    No hay registros de somatometría
                  </h3>
                  <p
                    className="mb-4"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Comienza agregando la primera medición del paciente
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
                    style={{
                      background: currentTheme.colors.primary,
                      color: currentTheme.colors.buttonText,
                    }}
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Primera Somatometría
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className="border-b"
                        style={{ borderColor: currentTheme.colors.border }}
                      >
                        <th
                          className="text-left py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Fecha
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Edad
                        </th>
                        <th
                          className="text-right py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Peso (kg)
                        </th>
                        <th
                          className="text-right py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Talla (cm)
                        </th>
                        <th
                          className="text-right py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          IMC
                        </th>
                        <th
                          className="text-right py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          P. Cefálico (cm)
                        </th>
                        <th
                          className="text-left py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Estado
                        </th>
                        <th
                          className="text-center py-3 px-4 font-semibold"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => {
                        const bmiClassification = getBMIClassification(
                          record.bmi,
                          record.age_months
                        );
                        const bmiColor = getBMIColor(bmiClassification);

                        return (
                          <tr
                            key={record.id}
                            className="border-b hover:bg-black/5 transition-colors"
                            style={{ borderColor: currentTheme.colors.border }}
                          >
                            <td
                              className="py-3 px-4"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {format(parseISO(record.measurement_date), 'dd/MM/yyyy', {
                                locale: es,
                              })}
                            </td>
                            <td
                              className="py-3 px-4"
                              style={{ color: currentTheme.colors.textSecondary }}
                            >
                              {Math.floor(record.age_months / 12)} años{' '}
                              {record.age_months % 12} meses
                            </td>
                            <td
                              className="py-3 px-4 text-right font-mono"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {record.weight.toFixed(1)}
                            </td>
                            <td
                              className="py-3 px-4 text-right font-mono"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {record.height.toFixed(1)}
                            </td>
                            <td
                              className="py-3 px-4 text-right font-mono"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {record.bmi ? record.bmi.toFixed(1) : '-'}
                            </td>
                            <td
                              className="py-3 px-4 text-right font-mono"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {record.head_circumference
                                ? record.head_circumference.toFixed(1)
                                : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {bmiClassification && (
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${bmiColor}20`,
                                    color: bmiColor,
                                  }}
                                >
                                  {bmiClassification}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(record)}
                                  className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                                  style={{ color: currentTheme.colors.primary }}
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(record)}
                                  className="p-1.5 rounded-md hover:bg-black/10 transition-colors"
                                  style={{ color: '#DC2626' }}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'weight' && records.length > 0 && (
            <div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: currentTheme.colors.text }}
              >
                Gráfica de Peso para la Edad
              </h3>
              <WeightForAge records={records} />
            </div>
          )}

          {activeTab === 'height' && records.length > 0 && (
            <div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: currentTheme.colors.text }}
              >
                Gráfica de Talla para la Edad
              </h3>
              <HeightForAge records={records} />
            </div>
          )}

          {activeTab === 'bmi' && records.length > 0 && (
            <div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: currentTheme.colors.text }}
              >
                Gráfica de IMC para la Edad
              </h3>
              <BMIForAge records={records} />
            </div>
          )}

          {activeTab === 'head' && records.length > 0 && (
            <div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: currentTheme.colors.text }}
              >
                Gráfica de Perímetro Cefálico para la Edad
              </h3>
              <HeadCircumferenceForAge records={records} />
            </div>
          )}

          {activeTab !== 'list' && records.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp
                className="h-16 w-16 mx-auto mb-4"
                style={{ color: currentTheme.colors.textSecondary }}
              />
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: currentTheme.colors.text }}
              >
                No hay datos suficientes
              </h3>
              <p style={{ color: currentTheme.colors.textSecondary }}>
                Agrega al menos un registro de somatometría para ver las gráficas de crecimiento
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && selectedPatient && (
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title=""
        >
          <SomatometryForm
            patient={selectedPatient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            existingSomatometry={editingRecord}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Somatometría"
        message={`¿Estás seguro de que deseas eliminar el registro del ${
          recordToDelete
            ? format(parseISO(recordToDelete.measurement_date), 'dd/MM/yyyy', { locale: es })
            : ''
        }? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
