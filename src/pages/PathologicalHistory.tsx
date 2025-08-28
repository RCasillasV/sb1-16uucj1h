import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Save, AlertCircle, Plus, X, Printer, Heart, Pill, Stethoscope, Clipboard, Settings } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { PathologicalHistoryReport } from '../components/Informes/PathologicalHistoryReport';
import clsx from 'clsx';
import { useTheme } from '../contexts/ThemeContext';

// Tipos para patologías
interface AppPatology {
  id: string;
  nombre: string;
}

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

interface DynamicListInputProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  itemType: string;
}

function DynamicListInput({ items, onAdd, onRemove, placeholder, itemType }: DynamicListInputProps) {
  const { currentTheme } = useTheme();
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 p-2 rounded-md border text-sm"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className={clsx(
            'px-3 py-2 rounded-md transition-colors text-sm',
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

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: currentTheme.colors.textSecondary }}>
            {itemType} registrados ({items.length}):
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded border"
                style={{
                  background: currentTheme.colors.background,
                  borderColor: currentTheme.colors.border,
                }}
              >
                <span className="text-sm flex-1" style={{ color: currentTheme.colors.text }}>
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1 rounded-full hover:bg-red-100 transition-colors"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PathologicalHistory() {
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('enfermedades');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [customDiseaseInput, setCustomDiseaseInput] = useState('');
  const [showPatologySuggestions, setShowPatologySuggestions] = useState(false);

  // React Query para obtener patologías activas
  const { data: activePatologiesData, isLoading: isLoadingPatologies, error: patologiesError } = useQuery<AppPatology[]>({
    queryKey: ['activePatologies'],
    queryFn: () => api.patologies.getAllActive(),
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar sugerencias del catálogo
  const filteredPatologySuggestions = (activePatologiesData || []).filter(patology =>
    patology.nombre.toLowerCase().includes(customDiseaseInput.toLowerCase()) &&
    !(watchedValues.enfermedades_cronicas || []).includes(patology.nombre)
  );

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

  // Añadir patología personalizada
  const handleAddCustomDisease = () => {
    if (!customDiseaseInput.trim()) return;
    
    const currentDiseases = watchedValues.enfermedades_cronicas || [];
    if (!currentDiseases.includes(customDiseaseInput.trim())) {
      setValue('enfermedades_cronicas', [...currentDiseases, customDiseaseInput.trim()]);
      setCustomDiseaseInput('');
    }
  };

  const {
    fields: hospitalizacionesFields,
    append: appendHospitalizacion,
    remove: removeHospitalizacion,
  } = useFieldArray({
    control,
    name: 'hospitalizaciones',
  });

  // Manejar cambios en el input de enfermedades personalizadas
  const handleDiseaseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDiseaseInput(value);
    setShowPatologySuggestions(value.length > 1);
  };

  // Añadir enfermedad a la lista
  const handleAddDisease = (diseaseName: string) => {
    if (!diseaseName.trim()) return;
    
    const currentDiseases = watchedValues.enfermedades_cronicas || [];
    if (!currentDiseases.includes(diseaseName.trim())) {
      setValue('enfermedades_cronicas', [...currentDiseases, diseaseName.trim()]);
      setCustomDiseaseInput('');
      setShowPatologySuggestions(false);
    }
  };

  // Eliminar enfermedad de la lista
  const removeChronicDisease = (patologyName: string) => {
    const current = watchedValues.enfermedades_cronicas || [];
    setValue('enfermedades_cronicas', current.filter(name => name !== patologyName));
  };

  // Toggle patología del catálogo
  const toggleCatalogPathology = (patology: AppPatology) => {
    const current = watchedValues.enfermedades_cronicas || [];
    const isSelected = current.includes(patology.nombre);
    
    if (isSelected) {
      setValue('enfermedades_cronicas', current.filter(name => name !== patology.nombre));
    } else {
      setValue('enfermedades_cronicas', [...current, patology.nombre]);
    }
  };

  // Manejar Enter en el input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customDiseaseInput.trim()) {
        handleAddDisease(customDiseaseInput);
      }
    }
  };

  // Seleccionar sugerencia del catálogo
  const handleSelectSuggestion = (patology: AppPatology) => {
    handleAddDisease(patology.nombre);
  };

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchPathologicalHistory();
    }
  }, [selectedPatient, user, authLoading]);

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
                  
                  {/* Catálogo de patologías como botones */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Seleccione del catálogo:
                      </label>
                      <Link
                        to="/settings/patologias"
                        className="flex items-center gap-1 p-1 rounded-lg hover:bg-black/5 transition-colors"
                        title="Gestionar Catálogo de Patologías"
                        style={{ color: currentTheme.colors.primary }}
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-xs">Catálogo</span>
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {isLoadingPatologies ? (
                        <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                          Cargando patologías...
                        </p>
                      ) : patologiesError ? (
                        <p className="text-sm text-red-500">Error: {patologiesError.message}</p>
                      ) : (activePatologiesData || []).map((patology) => {
                        const isSelected = (watchedValues.enfermedades_cronicas || []).includes(patology.nombre);
                        return (
                          <button
                            key={patology.id}
                            type="button"
                            onClick={() => toggleCatalogPathology(patology)}
                            className={clsx(
                              'px-3 py-2 text-sm rounded-md transition-colors border',
                              isSelected && 'bg-red-100 text-red-800 border-red-300',
                              !isSelected && 'bg-white hover:bg-gray-50 border-gray-200'
                            )}
                            style={{
                              backgroundColor: isSelected ? '#FEE2E2' : currentTheme.colors.surface,
                              color: isSelected ? '#DC2626' : currentTheme.colors.text,
                              borderColor: isSelected ? '#FCA5A5' : currentTheme.colors.border,
                            }}
                          >
                            {patology.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Campo de entrada con sugerencias */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDiseaseInput}
                        onChange={handleDiseaseInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Buscar en catálogo o agregar enfermedad personalizada..."
                        className="flex-1 p-3 rounded-md border"
                        style={inputStyle}
                        onFocus={() => customDiseaseInput.length > 1 && setShowPatologySuggestions(true)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDisease(customDiseaseInput)}
                        disabled={!customDiseaseInput.trim()}
                        className={clsx(
                          'px-4 py-3 rounded-md transition-colors',
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
                    
                    {/* Sugerencias del catálogo */}
                    {showPatologySuggestions && filteredPatologySuggestions.length > 0 && (
                      <div 
                        className="absolute z-10 w-full mt-1 rounded-md shadow-lg border max-h-60 overflow-y-auto"
                        style={{
                          background: currentTheme.colors.surface,
                          borderColor: currentTheme.colors.border,
                        }}
                      >
                        {filteredPatologySuggestions.map((patology) => (
                          <button
                            key={patology.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(patology)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {patology.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Campo para agregar patologías personalizadas */}
                  <div className="space-y-2">
                    <label 
                      className="block text-sm font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Agregar otra patología:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDiseaseInput}
                        onChange={(e) => setCustomDiseaseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomDisease();
                          }
                        }}
                        placeholder="Escriba el nombre de la enfermedad..."
                        className="flex-1 p-2 rounded-md border"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomDisease}
                        disabled={!customDiseaseInput.trim()}
                        className={clsx(
                          'px-3 py-2 rounded-md transition-colors',
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
                  </div>
                  
                  {/* Lista de enfermedades seleccionadas */}
                  <div 
                    className="min-h-[100px] p-4 rounded-md border"
                    style={{
                      background: currentTheme.colors.background,
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    {(watchedValues.enfermedades_cronicas || []).length > 0 ? (
                      <div>
                        <h4 
                          className="text-sm font-medium mb-3"
                          style={{ color: currentTheme.colors.text }}
                        >
                          Enfermedades seleccionadas ({(watchedValues.enfermedades_cronicas || []).length}):
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(watchedValues.enfermedades_cronicas || []).map((patologyName, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-red-100 text-red-800 border border-red-300"
                            >
                              <span className="font-medium">{patologyName}</span>
                              <button
                                type="button"
                                onClick={() => removeChronicDisease(patologyName)}
                                className="p-1 rounded-full hover:bg-red-200 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart 
                          className="h-12 w-12 mx-auto mb-3 opacity-50" 
                          style={{ color: currentTheme.colors.textSecondary }} 
                        />
                        <p
                          className="text-sm italic"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          No hay enfermedades crónicas registradas.
                          <br />
                          Haga clic en las etiquetas del catálogo arriba o agregue una personalizada.
                        </p>
                      </div>
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
                    placeholder="Describa otras enfermedades crónicas relevantes que no se encuentren en el catálogo..."
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
                    placeholder="Ej: Neumonía (2019), Infarto agudo de miocardio (2017)..."
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
                    Alergias conocidas
                  </label>
                  <textarea
                    {...register('alergias')}
                    placeholder="Describa alergias a medicamentos, alimentos, sustancias ambientales, etc..."
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
                    Transfusiones sanguíneas
                  </label>
                  <textarea
                    {...register('transfusiones')}
                    placeholder="Historial de transfusiones sanguíneas, fechas, motivos..."
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
                      Estado de inmunización
                    </label>
                    <select
                      {...register('estado_inmunizacion')}
                      className="w-full p-3 rounded-md border"
                      style={inputStyle}
                    >
                      <option value="">Seleccione...</option>
                      <option value="completo">Completo</option>
                      <option value="incompleto">Incompleto</option>
                      <option value="desconocido">Desconocido</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label 
                      className="block text-sm font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Detalles de inmunización
                    </label>
                    <textarea
                      {...register('detalles_inmunizacion')}
                      placeholder="Vacunas específicas, fechas, refuerzos pendientes..."
                      rows={3}
                      className="w-full p-3 rounded-md border"
                      style={inputStyle}
                    />
                  </div>
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
                    Medicamentos actuales
                  </label>
                  <textarea
                    {...register('medicamentos_actuales')}
                    placeholder="Liste los medicamentos que el paciente toma actualmente, dosis y frecuencia..."
                    rows={5}
                    className="w-full p-3 rounded-md border"
                    style={inputStyle}
                  />
                </div>

                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Notas generales
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

          {/* Resumen de información ingresada */}
          <div 
            className="mt-6 p-4 rounded-md border"
            style={{
              background: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            }}
          >
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