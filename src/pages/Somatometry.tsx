import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { somatometryService } from '../services/somatometryService';
import { SomatometryFormNew as SomatometryForm } from './SomatometryFormNew';
import type { SomatometryRecord } from '../types/somatometry';
import { Scale, Plus, Edit2, TrendingUp, Ruler, AlertCircle, List, Baby, Thermometer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import WHOWeightForAgeFromDB from '../components/GrowthCharts/WHOWeightForAgeFromDB';
import WHOHeightForAgeFromDB from '../components/GrowthCharts/WHOHeightForAgeFromDB';
import WHOBMIForAgeFromDB from '../components/GrowthCharts/WHOBMIForAgeFromDB';
import WHOHeadCircumferenceFromDB from '../components/GrowthCharts/WHOHeadCircumferenceFromDB';
import { Modal } from '../components/Modal';
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
  const [activeTab, setActiveTab] = useState<Tab>('list');

  // WHO data loading state - shared across all charts
  const [whoData, setWhoData] = useState<{
    weight: any;
    height: any;
    bmi: any;
    head: any;
  } | null>(null);
  const [whoLoading, setWhoLoading] = useState(false);

  // Optimized callbacks to prevent unnecessary re-renders
  const loadRecords = useCallback(async () => {
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
  }, [selectedPatient]);

  // Load WHO data once when patient changes - shared across all charts
  const loadWHOData = useCallback(async () => {
    if (!selectedPatient) return;

    setWhoLoading(true);
    try {
      const genderCode = (selectedPatient.Sexo === 'Femenino' || selectedPatient.Sexo === 'F' || selectedPatient.Sexo === 'Mujer') ? 'F' : 'M';

      const [weightData, heightData, bmiData, headData] = await Promise.all([
        somatometryService.getWHOChartData('weight', genderCode),
        somatometryService.getWHOChartData('height', genderCode),
        somatometryService.getWHOChartData('bmi', genderCode),
        somatometryService.getWHOChartData('head', genderCode)
      ]);

      setWhoData({
        weight: weightData,
        height: heightData,
        bmi: bmiData,
        head: headData
      });
    } catch (err) {
      console.error('Error loading WHO data:', err);
      // Keep existing data or set fallback
    } finally {
      setWhoLoading(false);
    }
  }, [selectedPatient]);

  // Event handlers with useCallback for stability
  const handleAddNew = useCallback(() => {
    setEditingRecord(undefined);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((record: SomatometryRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    await loadRecords();
    setShowForm(false);
    setEditingRecord(undefined);
  }, [loadRecords]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingRecord(undefined);
  }, []);

  // Memoized computed values to prevent recalculation on every render
  const patientPoints = useMemo(() => {
    return records.map(r => ({
      x: r.age_months || 0,
      y: r.weight || 0
    })).filter(p => p.y > 0).sort((a, b) => a.x - b.x);
  }, [records]);

  const patientName = useMemo(() => {
    return selectedPatient ? `${selectedPatient.Nombre} ${selectedPatient.Paterno || ''}` : '';
  }, [selectedPatient]);

  const genderCode = useMemo(() => {
    return selectedPatient ?
      (selectedPatient.Sexo === 'Femenino' || selectedPatient.Sexo === 'F' || selectedPatient.Sexo === 'Mujer' ? 'F' : 'M') :
      'M';
  }, [selectedPatient]);

  // BMI classification function - memoized to prevent recalculation
  const getBMIClassification = useCallback((bmi: number | null, ageMonths: number): string => {
    if (!bmi || ageMonths < 2) return '';
    if (bmi < 14) return 'Bajo peso';
    if (bmi < 17) return 'Peso saludable';
    if (bmi < 19) return 'Sobrepeso';
    return 'Obesidad';
  }, []);

  const getBMIColor = useCallback((classification: string): string => {
    switch (classification) {
      case 'Bajo peso': return '#EF4444';
      case 'Sobrepeso': return '#F59E0B';
      case 'Obesidad': return '#DC2626';
      default: return '#10B981';
    }
  }, []);

  // Load data when patient changes
  useEffect(() => {
    if (selectedPatient) {
      loadRecords();
      loadWHOData();
    } else {
      setRecords([]);
      setWhoData(null);
      setLoading(false);
    }
  }, [selectedPatient, loadRecords, loadWHOData]);

  if (!selectedPatient) {
    return (
      <div className="flex items-center justify-center h-96 rounded-lg" style={{ background: currentTheme.colors.surface }}>
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4" style={{ color: currentTheme.colors.textSecondary }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
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
      <div className="flex items-center justify-center h-96 rounded-lg" style={{ background: currentTheme.colors.surface }}>
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
    { id: 'list' as Tab, label: 'Lista de Registros', icon: List },
    { id: 'weight' as Tab, label: 'Peso/Edad', icon: Scale },
    { id: 'height' as Tab, label: 'Talla/Edad', icon: Ruler },
    { id: 'bmi' as Tab, label: 'IMC/Edad', icon: TrendingUp },
    { id: 'head' as Tab, label: 'P. Cefálico/Edad', icon: Baby },
  ];

  return (
    <div className="space-y-1" style={{ fontSize: 'var(--user-font-size-percentage, 100%)' }}>
      {/* Error Message (if any) */}
      {error && (
        <div
          className="p-2 rounded-md border-l-4"
          style={{
            background: '#FEE2E2',
            borderColor: '#DC2626',
            color: '#DC2626',
            marginBottom: '0.5rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-lg shadow-sm overflow-hidden" style={{ background: currentTheme.colors.surface }}>
        <div
          className="flex items-stretch border-b overflow-x-auto"
          style={{
            borderColor: currentTheme.colors.border,
            minHeight: '42px'
          }}
        >
          <div className="flex flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.id ? 'border-b-2' : 'hover:bg-black/5'
                  )}
                  style={{
                    ...(activeTab === tab.id ? {
                      color: currentTheme.colors.primary,
                      borderColor: currentTheme.colors.primary,
                    } : {
                      color: currentTheme.colors.textSecondary
                    })
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: currentTheme.colors.secondary }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nueva Somatometría Button */}
          <div className="flex items-center pr-2">
            <button
              onClick={handleAddNew}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors m-1"
              style={{
                background: currentTheme.colors.primary,
                color: 'white',
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Nueva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'list' && (
          <div>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <Scale
                  className="h-16 w-16 mx-auto mb-4"
                  style={{ color: currentTheme.colors.textSecondary }}
                />
                <h3 className="text-lg font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
                  No hay registros de somatometría
                </h3>
                <p className="mb-4" style={{ color: currentTheme.colors.textSecondary }}>
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
                <table className="w-full text-base">
                  <thead>
                    <tr
                      className="border-b"
                      style={{
                        borderColor: currentTheme.colors.border,
                        background: `${currentTheme.colors.primary}10`,
                        fontSize: '0.9em'
                      }}
                    >
                      <th className="text-left py-2.5 px-3 font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        Fecha
                      </th>
                      <th className="text-left py-2.5 px-3 text-sm font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9em' }}>
                        Edad
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        Peso (kg)
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        Talla (cm)
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        IMC
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        P. Cefálico
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        Temp. (°C)
                      </th>
                      <th className="text-left py-2.5 px-3 text-sm font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9em' }}>
                        Estado
                      </th>
                      <th className="text-center py-2 px-3 text-xs font-medium uppercase tracking-wider" style={{ color: currentTheme.colors.textSecondary }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const bmiClassification = getBMIClassification(record.bmi ?? null, record.age_months);
                      const bmiColor = getBMIColor(bmiClassification);

                      return (
                        <tr
                          key={record.id}
                          className="border-b hover:bg-black/5 transition-colors"
                          style={{
                            borderColor: currentTheme.colors.border,
                            fontSize: '1em'
                          }}
                        >
                          <td className="py-2.5 px-3" style={{ color: currentTheme.colors.text }}>
                            {format(parseISO(record.measurement_date), 'dd/MM/yyyy', { locale: es })}
                          </td>
                          <td className="py-2.5 px-3" style={{ color: currentTheme.colors.text }}>
                            {Math.floor(record.age_months / 12)}a {record.age_months % 12}m
                          </td>
                          <td className="py-2.5 px-3 text-right" style={{ color: currentTheme.colors.text }}>
                            {record.weight.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right" style={{ color: currentTheme.colors.text }}>
                            {record.height.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right" style={{ color: currentTheme.colors.text }}>
                            {record.bmi ? record.bmi.toFixed(2) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right" style={{ color: currentTheme.colors.text }}>
                            {record.head_circumference ? record.head_circumference.toFixed(2) : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {record.temperature !== undefined && record.temperature !== null ? (
                                <>
                                  <span
                                    style={{
                                      color: currentTheme.colors.text,
                                      fontSize: '1em',
                                      marginRight: '0.25em'
                                    }}
                                  >
                                    {record.temperature.toFixed(1)}
                                  </span>
                                  <Thermometer
                                    className="h-4 w-4"
                                    style={{
                                      color: record.temperature < 36
                                        ? '#3B82F6' // Azul para < 36°C
                                        : record.temperature <= 37.9
                                          ? '#10B981' // Verde para 36°C - 37.9°C
                                          : record.temperature <= 39
                                            ? '#F59E0B' // Amarillo para 38°C - 39°C
                                            : '#EF4444' // Rojo para > 39°C
                                    }}
                                  />
                                </>
                              ) : (
                                <span style={{
                                  color: currentTheme.colors.textSecondary,
                                  fontSize: '0.875em'
                                }}>
                                  -
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {bmiClassification && (
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                                style={{
                                  fontSize: '0.85em',
                                  backgroundColor: `${bmiColor}15`,
                                  color: bmiColor,
                                  border: `1px solid ${bmiColor}40`,
                                  letterSpacing: '0.05em',
                                  lineHeight: '1.2'
                                }}
                              >
                                {bmiClassification}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(record)}
                                className="rounded hover:bg-black/10 transition-colors"
                                style={{
                                  padding: '0.25em 0.4em',
                                  fontSize: '0.9em'
                                }}
                                title="Editar"
                              >
                                <Edit2 className="h-[1.5em] w-[1.5em]" style={{ minInlineSize: '1.5em' }} />
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
            <WHOWeightForAgeFromDB
              records={records}
              gender={genderCode}
              patientName={patientName}
            />
          </div>
        )}

        {activeTab === 'height' && records.length > 0 && (
          <div>
             <WHOHeightForAgeFromDB
              records={records}
              gender={genderCode}
              patientName={patientName}
            />
          </div>
        )}

        {activeTab === 'bmi' && records.length > 0 && (
          <div>
            <WHOBMIForAgeFromDB
              records={records}
              gender={genderCode}
              patientName={patientName}
            />
          </div>
        )}

        {activeTab === 'head' && records.length > 0 && (
          <div>
            <WHOHeadCircumferenceFromDB
              records={records}
              gender={genderCode}
              patientName={patientName}
            />
          </div>
        )}

        {activeTab !== 'list' && records.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: currentTheme.colors.textSecondary }}
            />
            <h3 className="text-lg font-semibold mb-2" style={{ color: currentTheme.colors.text }}>
              No hay datos suficientes
            </h3>
            <p style={{ color: currentTheme.colors.textSecondary }}>
              Agrega al menos un registro de somatometría para ver las gráficas de crecimiento
            </p>
          </div>
        )}
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
    </div>
  );
}

export default Somatometry;
