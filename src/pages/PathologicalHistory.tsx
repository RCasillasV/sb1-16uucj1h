import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Save, AlertCircle, Plus, X, Printer, Heart, Pill, Stethoscope, Clipboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { PathologicalHistoryReport } from '../components/Informes/PathologicalHistoryReport';
import clsx from 'clsx';
import { DynamicListInput } from '../components/DynamicListInput'; // Import extracted component

// Esquema principal del formulario
const pathologicalHistorySchema = z.object({
  enfermedades_cronicas: z.array(z.string()).default([]),
  otras_enfermedades_cronicas: z.string().optional(),
  cirugias: z.array(z.string()).default([]),
  hospitalizaciones: z.array(z.string()).default([]),
  alergias: z.string().optional(),
  transfusiones: z.string().optional(),
  estado_inmunizacion: z.string().optional(),
  detalles_inmunizacion: z.string().optional(),
  medicamentos_actuales: z.string().optional(),
  notas_generales: z.string().optional(),
});

type PathologicalHistoryFormData = z.infer<typeof pathologicalHistorySchema>;

type TabType = 'enfermedades' | 'quirurgico' | 'alergias' | 'medicamentos';

interface AppPatology {
  id: string;
  nombre: string;
  especialidad: string | null;
  sexo: 'Masculino' | 'Femenino' | 'Indistinto';
}

export function PathologicalHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  const [activeTab, setActiveTab] = useState<TabType>('enfermedades');
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [allActivePatologies, setAllActivePatologies] = useState<AppPatology[]>([]);
  const [customPatologyInput, setCustomPatologyInput] = useState('');
  const [isLoadingPatologies, setIsLoadingPatologies] = useState(false);
  const [patologiesError, setPatologiesError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PathologicalHistoryFormData>({
    resolver: zodResolver(pathologicalHistorySchema),
    defaultValues: {
      enfermedades_cronicas: [],
      otras_enfermedades_cronicas: '',
      cirugias: [],
      hospitalizaciones: [],
      alergias: '',
      transfusiones: '',
      estado_inmunizacion: '',
      detalles_inmunizacion: '',
      medicamentos_actuales: '',
      notas_generales: '',
    },
  });

  const watchedValues = watch();

  const {
    fields: cirugiasFields,
    append: appendCirugia,
    remove: removeCirugia,
  } = useFieldArray({
    control,
    name: 'cirugias',
  });

  const {
    fields: hospitalizacionesFields,
    append: appendHospitalizacion,
    remove: removeHospitalizacion,
  } = useFieldArray({
    control,
    name: 'hospitalizaciones',
  });

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchPathologicalHistory();
    }
  }, [selectedPatient, user, authLoading]);

  useEffect(() => {
    const fetchAllPatologies = async () => {
      setIsLoadingPatologies(true);
      setPatologiesError(null);
      try {
        const data = await api.patologies.getAllActive();
        setAllActivePatologies(data);
      } catch (err) {
        console.error('Error fetching all active patologies:', err);
        setPatologiesError(err instanceof Error ? err.message : 'Error al cargar patologías');
      } finally {
        setIsLoadingPatologies(false);
      }
    };

    if (user) {
      fetchAllPatologies();
    }
  }, [user]);

  const filteredAvailablePatologies = useMemo(() => {
    if (!allActivePatologies || !selectedPatient) return [];
    
    const patientSex = selectedPatient.Sexo?.toLowerCase();
    return allActivePatologies.filter(patology => {
      const patologySex = patology.sexo?.toLowerCase();
      return patologySex === 'indistinto' || patologySex === patientSex;
    });
  }, [allActivePatologies, selectedPatient]);

  const handlePatologyToggle = (patologyName: string) => {
    const current = watchedValues.enfermedades_cronicas || [];
    if (current.includes(patologyName)) {
      setValue('enfermedades_cronicas', current.filter(item => item !== patologyName));
    } else {
      setValue('enfermedades_cronicas', [...current, patologyName]);
    }
  };

  const handleAddCustomPatology = () => {
    if (!customPatologyInput.trim()) return;
    
    const current = watchedValues.enfermedades_cronicas || [];
    if (!current.includes(customPatologyInput.trim())) {
      setValue('enfermedades_cronicas', [...current, customPatologyInput.trim()]);
      setCustomPatologyInput('');
    }
  };

  const fetchPathologicalHistory = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.pathologicalHistory.getByPatientId(selectedPatient.id);

      if (data) {
        setExistingRecordId(data.id);
        reset({
          enfermedades_cronicas: (data.enfermedades_cronicas as string[]) || [],
          otras_enfermedades_cronicas: data.otras_enfermedades_cronicas || '',
          cirugias: (data.cirugias as string[]) || [],
          hospitalizaciones: (data.hospitalizaciones as string[]) || [],
          alergias: data.alergias || '',
          transfusiones: data.transfusiones || '',
          estado_inmunizacion: data.estado_inmunizacion || '',
          detalles_inmunizacion: data.detalles_inmunizacion || '',
          medicamentos_actuales: data.medicamentos_actuales || '',
          notas_generales: data.notas_generales || '',
        });
      }
    } catch (err) {
      console.error('Error fetching pathological history:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los antecedentes patológicos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PathologicalHistoryFormData) => {
    if (!selectedPatient || !user) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        id_paciente: selectedPatient.id,
        id_usuario: user.id,
        enfermedades_cronicas: data.enfermedades_cronicas,
        otras_enfermedades_cronicas: data.otras_enfermedades_cronicas || null,
        cirugias: data.cirugias,
        hospitalizaciones: data.hospitalizaciones,
        alergias: data.alergias || null,
        transfusiones: data.transfusiones || null,
        estado_inmunizacion: data.estado_inmunizacion || null,
        detalles_inmunizacion: data.detalles_inmunizacion || null,
        medicamentos_actuales: data.medicamentos_actuales || null,
        notas_generales: data.notas_generales || null,
      };

      if (existingRecordId) {
        await api.pathologicalHistory.update(existingRecordId, payload);
      } else {
        const newRecord = await api.pathologicalHistory.create(payload);
        setExistingRecordId(newRecord.id);
      }
    } catch (err) {
      console.error('Error saving pathological history:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los antecedentes patológicos');
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

  const inputStyle = {
    backgroundColor: currentTheme.colors.surface,
    borderColor: currentTheme.colors.border,
    color: currentTheme.colors.text,
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType; label: string; icon: React.ElementType }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 font-medium transition-colors',
        activeTab === tab ? 'border-b-2' : 'hover:bg-black/5'
      )}
      style={{
        color: activeTab === tab ? currentTheme.colors.primary : currentTheme.colors.text,
        borderColor: activeTab === tab ? currentTheme.colors.primary : 'transparent',
      }}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.substring(0, 3)}.</span>
    </button>
  );

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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          {authLoading ? 'Autenticando...' : 'Cargando antecedentes patológicos...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes Patológicos
          </h1>
        </div>
        <div className="flex gap-2">
          {selectedPatient && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className={clsx(buttonStyle.base, 'flex items-center gap-2')}
              style={buttonStyle.primary}
            >
              <Printer className="h-4 w-4" />
              Imprimir Informe
            </button>
          )}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            className={clsx(buttonStyle.base, 'disabled:opacity-50', 'flex items-center gap-2')}
            style={buttonStyle.primary}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
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

      {/* Main Card */}
      <div 
        className="rounded-lg shadow-lg overflow-hidden"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="p-4">
          {/* Tab Navigation */}
          <div className="flex border-b mb-4" style={{ borderColor: currentTheme.colors.border }}>
            <TabButton tab="enfermedades" label="Enfermedades Crónicas" icon={Heart} />
            <TabButton tab="quirurgico" label="Historial Quirúrgico" icon={Stethoscope} />
            <TabButton tab="alergias" label="Alergias e Inmunizaciones" icon={AlertCircle} />
            <TabButton tab="medicamentos" label="Medicamentos y Notas" icon={Pill} />
          </div>

          <form className="space-y-6">
            {/* PESTAÑA ENFERMEDADES CRÓNICAS */}
            {activeTab === 'enfermedades' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Enfermedades Crónicas Diagnosticadas
                  </h3>
                  
                  <div className="space-y-4">
                    <p 
                      className="text-sm mb-4"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      Seleccione las patologías del catálogo que aplican a este paciente
                    </p>
                    
                    {isLoadingPatologies ? (
                      <div className="flex items-center gap-2 text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
                        Cargando patologías...
                      </div>
                    ) : patologiesError ? (
                      <p className="text-sm text-red-500">Error al cargar patologías: {patologiesError}</p>
                    ) : (
                      <>
                        {/* Mostrar patologías del catálogo como botones seleccionables */}
                        <div className="flex flex-wrap gap-2 min-h-[40px]">
                          {filteredAvailablePatologies.map(patology => {
                            const isSelected = watchedValues.enfermedades_cronicas?.includes(patology.nombre) || false;
                            return (
                              <button
                                key={patology.id}
                                type="button"
                                onClick={() => handlePatologyToggle(patology.nombre)}
                                className={clsx(
                                  'px-3 py-1 rounded-md text-sm transition-colors border',
                                  isSelected && 'bg-slate-800 text-white border-slate-900',
                                  !isSelected && 'bg-white hover:bg-slate-50 border-slate-200'
                                )}
                                style={{
                                  color: isSelected ? '#fff' : currentTheme.colors.text,
                                  background: isSelected ? currentTheme.colors.primary : currentTheme.colors.surface,
                                  borderColor: isSelected ? currentTheme.colors.primary : currentTheme.colors.border,
                                }}
                              >
                                {patology.nombre}
                              </button>
                            );
                          })}
                        </div>

                        {/* Mostrar patologías personalizadas ya seleccionadas */}
                        {watchedValues.enfermedades_cronicas
                          ?.filter(patologyName => 
                            !filteredAvailablePatologies.some(catalogPatology => catalogPatology.nombre === patologyName)
                          )
                          .map((customPatology) => (
                            <div
                              key={customPatology}
                              className="inline-flex items-center bg-slate-800 text-white px-2 py-0.5 rounded-md text-xs font-medium border border-slate-900 mr-2 mb-2"
                            >
                              {customPatology}
                              <button
                                type="button"
                                className="ml-1 text-white hover:text-slate-200"
                                onClick={() => {
                                  const current = watchedValues.enfermedades_cronicas || [];
                                  setValue('enfermedades_cronicas', current.filter(item => item !== customPatology));
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}

                        {/* Campo para agregar patologías personalizadas */}
                        <div className="flex gap-2 mt-4">
                          <input
                            type="text"
                            value={customPatologyInput}
                            onChange={(e) => setCustomPatologyInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomPatology();
                              }
                            }}
                            placeholder="Agregar otra patología no listada"
                            className="flex-1 p-2 rounded-md border"
                            style={inputStyle}
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomPatology}
                            disabled={!customPatologyInput.trim()}
                            className={clsx(
                              'px-3 py-1 rounded-md text-sm transition-colors',
                              'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            style={{
                              background: currentTheme.colors.primary,
                              color: currentTheme.colors.buttonText,
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Otras enfermedades crónicas (descripción libre)
                  </label>
                  <textarea
                    {...register('otras_enfermedades_cronicas')}
                    placeholder="Describa otras enfermedades crónicas relevantes..."
                    rows={4}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* PESTAÑA HISTORIAL QUIRÚRGICO */}
            {activeTab === 'quirurgico' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Cirugías Previas
                  </h3>
                  
                  <DynamicListInput
                    items={watchedValues.cirugias || []}
                    onAdd={(item) => {
                      const current = watchedValues.cirugias || [];
                      setValue('cirugias', [...current, item]);
                    }}
                    onRemove={(index) => {
                      const current = watchedValues.cirugias || [];
                      setValue('cirugias', current.filter((_, i) => i !== index));
                    }}
                    placeholder="Ej: Apendicectomía (2020), Colecistectomía laparoscópica (2018)..."
                    itemType="Cirugías"
                  />
                </div>

                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Hospitalizaciones Previas
                  </h3>
                  
                  <DynamicListInput
                    items={watchedValues.hospitalizaciones || []}
                    onAdd={(item) => {
                      const current = watchedValues.hospitalizaciones || [];
                      setValue('hospitalizaciones', [...current, item]);
                    }}
                    onRemove={(index) => {
                      const current = watchedValues.hospitalizaciones || [];
                      setValue('hospitalizaciones', current.filter((_, i) => i !== index));
                    }}
                    placeholder="Ej: Neumonía (2019), Infarto agudo al miocardio (2021)..."
                    itemType="Hospitalizaciones"
                  />
                </div>
              </div>
            )}

            {/* PESTAÑA ALERGIAS E INMUNIZACIONES */}
            {activeTab === 'alergias' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Alergias a Medicamentos y Sustancias
                  </label>
                  <textarea
                    {...register('alergias')}
                    placeholder="Describa alergias a medicamentos, materiales (látex), anestésicos, etc..."
                    rows={3}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>

                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Historial de Transfusiones
                  </label>
                  <textarea
                    {...register('transfusiones')}
                    placeholder="Fechas, motivos y reacciones a transfusiones sanguíneas..."
                    rows={3}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label 
                      className="block text-sm font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Estado de Inmunización
                    </label>
                    <select
                      {...register('estado_inmunizacion')}
                      className="w-full p-2 rounded-md border"
                      style={inputStyle}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="completo">Esquema completo</option>
                      <option value="incompleto">Esquema incompleto</option>
                      <option value="desconocido">Desconocido</option>
                      <option value="no-aplica">No aplica</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Detalles de Inmunización
                  </label>
                  <textarea
                    {...register('detalles_inmunizacion')}
                    placeholder="Vacunas recibidas, fechas, vacunas pendientes..."
                    rows={3}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* PESTAÑA MEDICAMENTOS Y NOTAS */}
            {activeTab === 'medicamentos' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Medicamentos Actuales
                  </label>
                  <textarea
                    {...register('medicamentos_actuales')}
                    placeholder="Lista de medicamentos que el paciente toma actualmente, con dosis y frecuencia..."
                    rows={4}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>

                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Notas Generales
                  </label>
                  <textarea
                    {...register('notas_generales')}
                    placeholder="Información adicional relevante sobre los antecedentes patológicos del paciente..."
                    rows={4}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </form>

          {/* Resumen */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
            <h4 
              className="text-sm font-medium mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Resumen:
            </h4>
            <div className="flex flex-wrap gap-2">
              {watchedValues.enfermedades_cronicas && watchedValues.enfermedades_cronicas.length > 0 && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: '#FEE2E2',
                    color: '#DC2626',
                    borderColor: '#FCA5A5',
                  }}
                >
                  Enfermedades: {watchedValues.enfermedades_cronicas.length}
                </span>
              )}
              {watchedValues.cirugias && watchedValues.cirugias.length > 0 && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Cirugías: {watchedValues.cirugias.length}
                </span>
              )}
              {watchedValues.hospitalizaciones && watchedValues.hospitalizaciones.length > 0 && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Hospitalizaciones: {watchedValues.hospitalizaciones.length}
                </span>
              )}
              {watchedValues.alergias && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: '#FFFBEB',
                    color: '#D97706',
                    borderColor: '#FED7AA',
                  }}
                >
                  Alergias registradas
                </span>
              )}
              {watchedValues.estado_inmunizacion && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: '#DEF7EC',
                    color: '#059669',
                    borderColor: '#A7F3D0',
                  }}
                >
                  Inmunización: {watchedValues.estado_inmunizacion}
                </span>
              )}
              {!watchedValues.enfermedades_cronicas?.length && 
               !watchedValues.cirugias?.length && 
               !watchedValues.hospitalizaciones?.length && 
               !watchedValues.alergias && 
               !watchedValues.estado_inmunizacion && (
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  No hay información ingresada aún
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal del Informe de Antecedentes Patológicos */}
      {selectedPatient && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Informe de Antecedentes Patológicos"
          className="max-w-6xl w-full"
        >
          <PathologicalHistoryReport 
            patientId={selectedPatient.id}
            isModalView={true}
            onClose={() => setShowReportModal(false)}
            patientData={selectedPatient}
          />
        </Modal>
      )}
    </div>
  );
}