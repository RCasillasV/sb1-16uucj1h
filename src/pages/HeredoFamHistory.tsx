// src/pages/HeredoFamHistory.tsx
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Contact as Family, User, FileText, Plus, Save, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api'; // Asegúrate de que api.ts exporte heredoFamilialHistory
import { Modal } from '../components/Modal';
import { DiagnosisSearch } from '../components/DiagnosisSearch'; // Para seleccionar patologías del catálogo
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

// --- 1. Definición de Tipos y Esquemas Zod ---

// Estructura de cada patología dentro del array JSONB
interface HeredoFamilialPathology {
  id_patologia?: number; // Consecutivo de CIE10
  nombre_patologia: string;
  codigo_cie10?: string;
  edad_inicio_familiar?: number;
  notas_especificas_familiar?: string;
}

// Esquema Zod para una patología individual
const heredoFamilialPathologySchema = z.object({
  id_patologia: z.number().optional(),
  nombre_patologia: z.string().min(1, 'El nombre de la patología es requerido'),
  codigo_cie10: z.string().optional(),
  edad_inicio_familiar: z.number().nullable().optional(),
  notas_especificas_familiar: z.string().nullable().optional(),
});

// Esquema Zod para el formulario completo
const heredoFamilialFormDataSchema = z.object({
  miembro_fam: z.string().min(1, 'El miembro familiar es requerido'),
  estado_vital: z.string().min(1, 'El estado vital es requerido'),
  patologias: z.array(heredoFamilialPathologySchema).default([]),
  notas: z.string().nullable().optional(),
});

type HeredoFamilialFormData = z.infer<typeof heredoFamilialFormDataSchema>;

export function HeredoFamHistory() { // <-- Nombre del componente actualizado
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRecordId, setExistingRecordId] = useState<number | null>(null); // ID de la tabla tpFcHeredoFamiliar
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<HeredoFamilialFormData>({
    resolver: zodResolver(heredoFamilialFormDataSchema),
    defaultValues: {
      miembro_fam: '',
      estado_vital: '',
      patologias: [],
      notas: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'patologias',
  });

  // --- Lógica de Carga de Datos ---
  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchHeredoFamilialHistory();
    }
  }, [selectedPatient, user, authLoading]);

  const fetchHeredoFamilialHistory = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.heredoFamilialHistory.getByPatientId(selectedPatient.id);
      if (data) {
        setExistingRecordId(data.id);
        reset({
          miembro_fam: data.miembro_fam || '',
          estado_vital: data.estado_vital || '',
          patologias: (data.patologias || []) as HeredoFamilialPathology[], // Asegurarse de que sea el tipo correcto
          notas: data.notas || '',
        });
      } else {
        // Si no hay datos, resetear a valores por defecto para un nuevo registro
        reset({
          miembro_fam: '',
          estado_vital: '',
          patologias: [],
          notas: '',
        });
        setExistingRecordId(null);
      }
    } catch (err) {
      console.error('Error fetching heredo familial history:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el historial heredo-familiar.');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Envío del Formulario ---
  const onSubmit = async (data: HeredoFamilialFormData) => {
    if (!selectedPatient || !user) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        patient_id: selectedPatient.id,
        id_usuario: user.id, // Asegúrate de que el user.id esté disponible
        idbu: user.idbu, // Asegúrate de que el user.idbu esté disponible
        miembro_fam: data.miembro_fam,
        estado_vital: data.estado_vital,
        patologias: data.patologias, // Ya es un array de objetos
        notas: data.notas,
      };

      if (existingRecordId) {
        await api.heredoFamilialHistory.update(existingRecordId, payload);
      } else {
        const newRecord = await api.heredoFamilialHistory.create(payload);
        setExistingRecordId(newRecord.id); // Guardar el ID del nuevo registro
      }
      // Opcional: Mostrar un mensaje de éxito temporal
    } catch (err) {
      console.error('Error saving heredo familial history:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el historial heredo-familiar.');
    } finally {
      setSaving(false);
    }
  };

  // --- Estilos de Botones ---
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

  // --- Manejo de Patologías Seleccionadas desde DiagnosisSearch ---
  const handleDiagnosisSelect = (diagnosisOrArray: any) => {
    let selectedDiagnosis: any;
    if (Array.isArray(diagnosisOrArray)) {
      selectedDiagnosis = diagnosisOrArray[0]; // Si viene un array, toma el primero
    } else {
      selectedDiagnosis = diagnosisOrArray;
    }

    if (selectedDiagnosis) {
      // Añadir la patología como un nuevo elemento en el array de fields
      append({
        id_patologia: selectedDiagnosis.Consecutivo,
        nombre_patologia: selectedDiagnosis.Nombre,
        codigo_cie10: selectedDiagnosis.Catalog_Key,
        edad_inicio_familiar: undefined, // Inicializar vacío
        notas_especificas_familiar: '', // Inicializar vacío
      });
    }
  };

  const handleDiagnosisRemove = (diagnosis: any) => {
    // Esto es más complejo con useFieldArray, ya que DiagnosisSearch no sabe el índice.
    // Podrías necesitar un botón de eliminar junto a cada patología listada.
    // Por ahora, DiagnosisSearch solo se usa para añadir.
  };

  // --- Renderizado del Componente ---
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
          {authLoading ? 'Autenticando...' : 'Cargando historial heredo-familiar...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <Family className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
        <h1
          className="text-2xl font-bold"
          style={{ color: currentTheme.colors.text }}
        >
          Antecedentes Heredo-Familiares
        </h1>
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
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Sección de Datos Básicos del Familiar */}
        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: currentTheme.colors.text }}
          >
            Información del Familiar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="miembro_fam"
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Miembro Familiar
              </label>
              <select
                id="miembro_fam"
                {...register('miembro_fam')}
                className="w-full p-2 rounded-md border"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Hermano">Hermano(a)</option>
                <option value="Hijo">Hijo(a)</option>
                <option value="AbueloPaterno">Abuelo Paterno</option>
                <option value="AbuelaPaterna">Abuela Paterna</option>
                <option value="AbueloMaterno">Abuelo Materno</option>
                <option value="AbuelaMaterna">Abuela Materna</option>
                <option value="TioPaterno">Tío(a) Paterno(a)</option>
                <option value="TioMaterno">Tío(a) Materno(a)</option>
                <option value="Primo">Primo(a)</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.miembro_fam && (
                <p className="mt-1 text-sm text-red-600">{errors.miembro_fam.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="estado_vital"
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Estado Vital
              </label>
              <select
                id="estado_vital"
                {...register('estado_vital')}
                className="w-full p-2 rounded-md border"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              >
                <option value="">Seleccionar...</option>
                <option value="Vivo">Vivo</option>
                <option value="Fallecido">Fallecido</option>
                <option value="Desconocido">Desconocido</option>
              </select>
              {errors.estado_vital && (
                <p className="mt-1 text-sm text-red-600">{errors.estado_vital.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Patologías */}
        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: currentTheme.colors.text }}
          >
            Patologías Heredo-Familiares
          </h2>

          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Buscar y Añadir Patología
            </label>
            <DiagnosisSearch
              selectedDiagnoses={[]} // No mostramos las seleccionadas aquí, solo para añadir
              onSelect={handleDiagnosisSelect}
              onRemove={handleDiagnosisRemove} // No se usa para eliminar aquí
            />
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-center" style={{ color: currentTheme.colors.textSecondary }}>
              Aún no se han añadido patologías para este familiar.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-md relative"
                  style={{
                    background: currentTheme.colors.background,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                    title="Eliminar patología"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>

                  <h3 className="font-semibold mb-2" style={{ color: currentTheme.colors.primary }}>
                    {watch(`patologias.${index}.nombre_patologia`)}
                    {watch(`patologias.${index}.codigo_cie10`) && ` (${watch(`patologias.${index}.codigo_cie10`)})`}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`patologias.${index}.edad_inicio_familiar`}
                        className="block text-sm font-medium mb-1"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Edad de Inicio (años)
                      </label>
                      <input
                        type="number"
                        id={`patologias.${index}.edad_inicio_familiar`}
                        {...register(`patologias.${index}.edad_inicio_familiar`, { valueAsNumber: true })}
                        className="w-full p-2 rounded-md border"
                        style={{
                          background: currentTheme.colors.surface,
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        htmlFor={`patologias.${index}.notas_especificas_familiar`}
                        className="block text-sm font-medium mb-1"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Notas Específicas
                      </label>
                      <textarea
                        id={`patologias.${index}.notas_especificas_familiar`}
                        {...register(`patologias.${index}.notas_especificas_familiar`)}
                        rows={2}
                        className="w-full p-2 rounded-md border"
                        style={{
                          background: currentTheme.colors.surface,
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Notas Generales */}
        <div
          className="rounded-lg shadow-lg p-6"
          style={{
            background: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }}
        >
          <h2
            className="text-lg font-medium mb-4"
            style={{ color: currentTheme.colors.text }}
          >
            Notas Adicionales
          </h2>
          <div>
            <label
              htmlFor="notas"
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Notas Generales sobre el Historial Heredo-Familiar
            </label>
            <textarea
              id="notas"
              {...register('notas')}
              rows={4}
              className="w-full p-2 rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={clsx(buttonStyle.base, 'flex items-center gap-2')}
            style={buttonStyle.primary}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Historial'}
          </button>
        </div>
      </form>
    </div>
  );
}
