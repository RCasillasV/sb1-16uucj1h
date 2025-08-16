import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, User, Home, Activity, Save, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

// Esquemas de validación por sección
const habitosEstiloVidaSchema = z.object({
  alcohol: z.string().optional(),
  tabaco: z.string().optional(),
  tabaco_cantidad: z.string().optional(),
  drogas_ilicitas: z.boolean().default(false),
  cafeina: z.string().optional(),
  dieta: z.array(z.string()).default([]),
  actividad_fisica: z.string().optional(),
  horas_sueno: z.string().optional(),
  calidad_sueno: z.string().optional(),
});

const entornoSocialSchema = z.object({
  tipo_vivienda: z.string().optional(),
  numero_ocupantes: z.string().optional(),
  mascotas: z.array(z.string()).default([]),
  nivel_educativo: z.string().optional(),
  ocupacion_actual: z.string().optional(),
  nivel_ingresos: z.string().optional(),
});

const historialAdicionalSchema = z.object({
  inmunizaciones: z.array(z.string()).default([]),
  alergias_ambientales: z.array(z.string()).default([]),
  viajes_recientes: z.boolean().default(false),
  detalles_viajes: z.string().optional(),
});

// Esquema principal del formulario
const antecedentesNoPatologicosSchema = z.object({
  habitos_estilo_vida: habitosEstiloVidaSchema,
  entorno_social: entornoSocialSchema,
  historial_adicional: historialAdicionalSchema,
  notas_generales: z.string().optional(),
});

type FormData = z.infer<typeof antecedentesNoPatologicosSchema>;

type TabType = 'habitos' | 'entorno' | 'historial';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onCheckedChange, disabled = false }: SwitchProps) {
  const { currentTheme } = useTheme();
  
  return (
    <button
      type="button"
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={clsx(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        checked ? 'bg-green-500' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export function AntecedentesNoPatologicos() {
  const [loading, setLoading] = useState(true);
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  
  console.log('AntecedentesNoPatologicos: user:', user, 'authLoading:', authLoading); // <-- Añade esta línea

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(antecedentesNoPatologicosSchema),
    defaultValues: {
      habitos_estilo_vida: {
        alcohol: '',
        tabaco: '',
        tabaco_cantidad: '',
        drogas_ilicitas: false,
        cafeina: '',
        dieta: [],
        actividad_fisica: '',
        horas_sueno: '',
        calidad_sueno: '',
      },
      entorno_social: {
        tipo_vivienda: '',
        numero_ocupantes: '',
        mascotas: [],
        nivel_educativo: '',
        ocupacion_actual: '',
        nivel_ingresos: '',
      },
      historial_adicional: {
        inmunizaciones: [],
        alergias_ambientales: [],
        viajes_recientes: false,
        detalles_viajes: '',
      },
      notas_generales: '',
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchAntecedentes();
    }
  }, [selectedPatient, user, authLoading]);

  const fetchAntecedentes = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.antecedentesNoPatologicos.getByPatientId(selectedPatient.id);
      
      if (data) {
        setExistingRecordId(data.id);
        reset({
          habitos_estilo_vida: data.habitos_estilo_vida as any || {},
          entorno_social: data.entorno_social as any || {},
          historial_adicional: data.historial_adicional as any || {},
          notas_generales: data.notas_generales || '',
        });
      }
    } catch (err) {
      console.error('Error fetching non-pathological history:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los antecedentes no patológicos');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedPatient || !user) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const payload = {
        patient_id: selectedPatient.id,
        user_id: user.id,
        habitos_estilo_vida: data.habitos_estilo_vida,
        entorno_social: data.entorno_social,
        historial_adicional: data.historial_adicional,
        notas_generales: data.notas_generales || null,
      };

      if (existingRecordId) {
        await api.antecedentesNoPatologicos.update(existingRecordId, payload);
      } else {
        const newRecord = await api.antecedentesNoPatologicos.create(payload);
        setExistingRecordId(newRecord.id);
      }
      
      // Mostrar mensaje de éxito brevemente
      // Podríamos agregar un toast notification aquí
    } catch (err) {
      console.error('Error saving non-pathological history:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los antecedentes no patológicos');
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
          {authLoading ? 'Autenticando...' : 'Cargando antecedentes...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes No Patológicos
          </h1>
          <p 
            className="text-sm"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            Información sobre hábitos, estilo de vida y entorno del paciente
          </p>
        </div>
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
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
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
            <TabButton tab="habitos" label="Hábitos" icon={User} />
            <TabButton tab="entorno" label="Entorno" icon={Home} />
            <TabButton tab="historial" label="Historial" icon={FileText} />
          </div>

          <form className="space-y-6">
            {/* PESTAÑA HÁBITOS */}
            {activeTab === 'habitos' && (
              <div className="space-y-6">
                {/* Sección Sustancias */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Consumo de Sustancias
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Alcohol
                      </label>
                      <select
                        {...register('habitos_estilo_vida.alcohol')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Seleccionar</option>
                        <option value="nunca">Nunca</option>
                        <option value="ocasional">Ocasional</option>
                        <option value="moderado">Moderado</option>
                        <option value="frecuente">Frecuente</option>
                        <option value="ex">Ex-consumidor</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Tabaco
                      </label>
                      <select
                        {...register('habitos_estilo_vida.tabaco')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Seleccionar</option>
                        <option value="nunca">Nunca</option>
                        <option value="ex">Ex-fumador</option>
                        <option value="ocasional">Ocasional</option>
                        <option value="diario">Diario</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Cantidad/día
                      </label>
                      <input
                        type="text"
                        {...register('habitos_estilo_vida.tabaco_cantidad')}
                        placeholder="ej. 5 cigarrillos"
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      />
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Cafeína
                      </label>
                      <select
                        {...register('habitos_estilo_vida.cafeina')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Seleccionar</option>
                        <option value="ninguna">Ninguna</option>
                        <option value="1-2-tazas">1-2 tazas</option>
                        <option value="3-4-tazas">3-4 tazas</option>
                        <option value="5-mas">5+ tazas</option>
                      </select>
                    </div>
                  </div>

                  {/* Drogas y Actividad Física */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Drogas ilícitas
                      </label>
                      <div className="flex items-center space-x-2">
                        <Controller
                          name="habitos_estilo_vida.drogas_ilicitas"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <span className="text-sm" style={{ color: currentTheme.colors.text }}>
                          {watchedValues.habitos_estilo_vida?.drogas_ilicitas ? "Sí" : "No"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Actividad Física
                      </label>
                      <select
                        {...register('habitos_estilo_vida.actividad_fisica')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Frecuencia</option>
                        <option value="sedentario">Sedentario</option>
                        <option value="ligero">Ligero (1-2/sem)</option>
                        <option value="moderado">Moderado (3-4/sem)</option>
                        <option value="intenso">Intenso (5+/sem)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dieta */}
                  <div className="space-y-2">
                    <label 
                      className="block text-sm font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Tipo de Dieta
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {["Omnívora", "Vegetariana", "Vegana", "Sin gluten", "Keto", "Otra"].map((diet) => (
                        <div key={diet} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={diet}
                            checked={watchedValues.habitos_estilo_vida?.dieta?.includes(diet) || false}
                            onChange={(e) => handleArrayChange('habitos_estilo_vida.dieta', diet, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label 
                            htmlFor={diet} 
                            className="text-sm"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {diet}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sección Sueño */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Patrón de Sueño
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Horas de sueño
                      </label>
                      <select
                        {...register('habitos_estilo_vida.horas_sueno')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Horas</option>
                        <option value="<5">Menos de 5</option>
                        <option value="5-6">5-6 horas</option>
                        <option value="7-8">7-8 horas</option>
                        <option value="9+">9+ horas</option>
                      </select>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Calidad del sueño
                      </label>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        {['buena', 'regular', 'mala'].map((quality) => (
                          <div key={quality} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={quality}
                              {...register('habitos_estilo_vida.calidad_sueno')}
                              value={quality}
                              className="rounded-full border-gray-300"
                            />
                            <label 
                              htmlFor={quality} 
                              className="text-sm capitalize"
                              style={{ color: currentTheme.colors.text }}
                            >
                              {quality}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA ENTORNO */}
            {activeTab === 'entorno' && (
              <div className="space-y-6">
                {/* Sección Vivienda */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Información de Vivienda
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Tipo de vivienda
                      </label>
                      <select
                        {...register('entorno_social.tipo_vivienda')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Tipo</option>
                        <option value="casa">Casa</option>
                        <option value="apartamento">Apartamento</option>
                        <option value="condominio">Condominio</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Número de ocupantes
                      </label>
                      <select
                        {...register('entorno_social.numero_ocupantes')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Número</option>
                        <option value="1">1 persona</option>
                        <option value="2-3">2-3 personas</option>
                        <option value="4-5">4-5 personas</option>
                        <option value="6+">6+ personas</option>
                      </select>
                    </div>
                  </div>

                  {/* Mascotas */}
                  <div className="space-y-2">
                    <label 
                      className="block text-sm font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Mascotas
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {["Perro", "Gato", "Ave", "Ninguna"].map((pet) => (
                        <div key={pet} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={pet}
                            checked={watchedValues.entorno_social?.mascotas?.includes(pet) || false}
                            onChange={(e) => handleArrayChange('entorno_social.mascotas', pet, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label 
                            htmlFor={pet} 
                            className="text-sm"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {pet}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sección Socioeconómica */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Información Socioeconómica
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Nivel educativo
                      </label>
                      <select
                        {...register('entorno_social.nivel_educativo')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Nivel</option>
                        <option value="primaria">Primaria</option>
                        <option value="secundaria">Secundaria</option>
                        <option value="preparatoria">Preparatoria</option>
                        <option value="universidad">Universidad</option>
                        <option value="posgrado">Posgrado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Ocupación actual
                      </label>
                      <input
                        type="text"
                        {...register('entorno_social.ocupacion_actual')}
                        placeholder="Trabajo actual"
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      />
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Nivel de ingresos
                      </label>
                      <select
                        {...register('entorno_social.nivel_ingresos')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Nivel</option>
                        <option value="bajo">Bajo</option>
                        <option value="medio-bajo">Medio-bajo</option>
                        <option value="medio">Medio</option>
                        <option value="medio-alto">Medio-alto</option>
                        <option value="alto">Alto</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA ENTORNO */}
            {activeTab === 'entorno' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Información de Vivienda extendida */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Detalles de Vivienda
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Tipo de vivienda
                      </label>
                      <select
                        {...register('entorno_social.tipo_vivienda')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Seleccionar</option>
                        <option value="casa">Casa</option>
                        <option value="apartamento">Apartamento</option>
                        <option value="condominio">Condominio</option>
                        <option value="cuarto">Cuarto rentado</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Número de ocupantes
                      </label>
                      <select
                        {...register('entorno_social.numero_ocupantes')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Número</option>
                        <option value="1">1 persona</option>
                        <option value="2-3">2-3 personas</option>
                        <option value="4-5">4-5 personas</option>
                        <option value="6+">6+ personas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información Social extendida */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: currentTheme.colors.primary }}
                  >
                    Información Social
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Nivel educativo
                      </label>
                      <select
                        {...register('entorno_social.nivel_educativo')}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      >
                        <option value="">Nivel</option>
                        <option value="primaria">Primaria</option>
                        <option value="secundaria">Secundaria</option>
                        <option value="preparatoria">Preparatoria</option>
                        <option value="universidad">Universidad</option>
                        <option value="posgrado">Posgrado</option>
                        <option value="sin-estudios">Sin estudios formales</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Ocupación actual
                      </label>
                      <input
                        type="text"
                        {...register('entorno_social.ocupacion_actual')}
                        placeholder="Trabajo actual"
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA HISTORIAL */}
            {activeTab === 'historial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Inmunizaciones */}
                  <div className="space-y-4">
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      Inmunizaciones al día
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "COVID-19", "Influenza", "Hepatitis B", "Tétanos",
                        "Sarampión", "Varicela", "HPV", "Neumococo"
                      ].map((vaccine) => (
                        <div key={vaccine} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={vaccine}
                            checked={watchedValues.historial_adicional?.inmunizaciones?.includes(vaccine) || false}
                            onChange={(e) => handleArrayChange('historial_adicional.inmunizaciones', vaccine, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label 
                            htmlFor={vaccine} 
                            className="text-sm"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {vaccine}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alergias */}
                  <div className="space-y-4">
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      Alergias ambientales
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Polen", "Ácaros", "Polvo", "Pelo animal",
                        "Moho", "Látex", "Ninguna", "Otras"
                      ].map((allergy) => (
                        <div key={allergy} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={allergy}
                            checked={watchedValues.historial_adicional?.alergias_ambientales?.includes(allergy) || false}
                            onChange={(e) => handleArrayChange('historial_adicional.alergias_ambientales', allergy, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label 
                            htmlFor={allergy} 
                            className="text-sm"
                            style={{ color: currentTheme.colors.text }}
                          >
                            {allergy}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Viajes */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      Viajes recientes
                    </h3>
                    <Controller
                      name="historial_adicional.viajes_recientes"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <span className="text-sm" style={{ color: currentTheme.colors.text }}>
                      {watchedValues.historial_adicional?.viajes_recientes ? "Sí" : "No"}
                    </span>
                  </div>
                  <p 
                    className="text-xs"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    Zonas endémicas en los últimos 12 meses
                  </p>
                  
                  {watchedValues.historial_adicional?.viajes_recientes && (
                    <div className="space-y-2">
                      <label 
                        className="block text-sm font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Detalles de viajes
                      </label>
                      <textarea
                        {...register('historial_adicional.detalles_viajes')}
                        placeholder="Describir destinos y fechas relevantes..."
                        rows={3}
                        className="w-full p-2 rounded-md border"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>

                {/* Notas Generales */}
                <div className="space-y-2">
                  <label 
                    className="block text-sm font-medium"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Notas adicionales
                  </label>
                  <textarea
                    {...register('notas_generales')}
                    placeholder="Información relevante adicional..."
                    rows={4}
                    className="w-full p-2 rounded-md border"
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
              {watchedValues.habitos_estilo_vida?.alcohol && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Alcohol: {watchedValues.habitos_estilo_vida.alcohol}
                </span>
              )}
              {watchedValues.habitos_estilo_vida?.tabaco && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Tabaco: {watchedValues.habitos_estilo_vida.tabaco}
                </span>
              )}
              {watchedValues.habitos_estilo_vida?.drogas_ilicitas && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: '#FEE2E2',
                    color: '#DC2626',
                    borderColor: '#FCA5A5',
                  }}
                >
                  Drogas: Sí
                </span>
              )}
              {watchedValues.habitos_estilo_vida?.dieta && watchedValues.habitos_estilo_vida.dieta.length > 0 && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Dieta: {watchedValues.habitos_estilo_vida.dieta.join(', ')}
                </span>
              )}
              {watchedValues.entorno_social?.tipo_vivienda && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: `${currentTheme.colors.primary}20`,
                    color: currentTheme.colors.primary,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  Vivienda: {watchedValues.entorno_social.tipo_vivienda}
                </span>
              )}
              {watchedValues.historial_adicional?.inmunizaciones && watchedValues.historial_adicional.inmunizaciones.length > 0 && (
                <span 
                  className="px-2 py-1 rounded-full text-xs border"
                  style={{ 
                    background: '#DEF7EC',
                    color: '#059669',
                    borderColor: '#A7F3D0',
                  }}
                >
                  Vacunas: {watchedValues.historial_adicional.inmunizaciones.length} al día
                </span>
              )}
              {!watchedValues.habitos_estilo_vida?.alcohol && 
               !watchedValues.habitos_estilo_vida?.tabaco && 
               !watchedValues.habitos_estilo_vida?.dieta?.length && 
               !watchedValues.entorno_social?.tipo_vivienda && (
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
    </div>
  );

  // Helper function para manejar arrays en formularios anidados
  function handleArrayChange(fieldPath: string, value: string, checked: boolean) {
    const keys = fieldPath.split('.');
    const currentValues = watchedValues as any;
    let currentArray: string[] = [];
    
    // Navegar por la estructura anidada
    if (keys.length === 2) {
      currentArray = currentValues[keys[0]]?.[keys[1]] || [];
    }
    
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    // Actualizar usando setValue con la ruta completa
    setValue(fieldPath as any, newArray);
  }
}