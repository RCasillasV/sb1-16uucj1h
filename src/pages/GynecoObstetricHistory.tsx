// src/pages/GynecoObstetricHistory.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Heart, Save, AlertCircle, Baby, Printer, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import { api } from '../lib/api';
import { format, parseISO } from 'date-fns'; // Para formatear fechas
import { Tooltip } from '../components/Tooltip';
import { GynecoObstetricReport } from '../components/Informes/GynecoObstetricReport';

// Esquema de validación con Zod
const gynecoObstetricSchema = z.object({
  gestas: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).nullable().optional()
  ),
  paras: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).nullable().optional()
  ),
  abortos: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).nullable().optional()
  ),
  cesareas: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).nullable().optional()
  ),
  fum: z.string().nullable().optional(), // Fecha de última menstruación
  menarquia: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).nullable().optional()
  ),
  ritmo_menstrual: z.string().nullable().optional(), // Ej: "28x5"
  metodo_anticonceptivo: z.string().nullable().optional(),
  fecha_ultimo_papanicolau: z.string().nullable().optional(),
  resultado_ultimo_papanicolau: z.string().nullable().optional(),
  mamografia: z.string().nullable().optional(), // Fecha de última mamografía
  resultado_mamografia: z.string().nullable().optional(),
  notas_adicionales: z.string().nullable().optional(),
});

type GynecoObstetricFormData = z.infer<typeof gynecoObstetricSchema>;

export function GynecoObstetricHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  const [showGenderWarningModal, setShowGenderWarningModal] = useState(false);
  const [gynecoObstetricRecord, setGynecoObstetricRecord] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false); // Estado para el modal de informe

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GynecoObstetricFormData>({
    resolver: zodResolver(gynecoObstetricSchema),
    defaultValues: {
      gestas: null,
      paras: null,
      abortos: null,
      cesareas: null,
      fum: null,
      menarquia: null,
      ritmo_menstrual: null,
      metodo_anticonceptivo: null,
      fecha_ultimo_papanicolau: null,
      resultado_ultimo_papanicolau: null,
      mamografia: null,
      resultado_mamografia: null,
      notas_adicionales: null,
    },
  });

  const watchedValues = watch();

  // Efecto para calcular automáticamente las Gestas
  useEffect(() => {
    const paras = Number(watchedValues.paras) || 0;
    const abortos = Number(watchedValues.abortos) || 0;
    const cesareas = Number(watchedValues.cesareas) || 0;
    
    const totalGestas = paras + abortos + cesareas;
    
    // Solo actualizar si el valor calculado es diferente al actual
    if (watchedValues.gestas !== totalGestas) {
      setValue('gestas', totalGestas > 0 ? totalGestas : null);
    }
  }, [watchedValues.paras, watchedValues.abortos, watchedValues.cesareas, setValue, watchedValues.gestas]);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }

    // Check if patient is female
    if (selectedPatient.Sexo?.toLowerCase() !== 'femenino') {
      setShowGenderWarningModal(true);
      return;
    }

    if (!authLoading && user) {
      fetchGynecoObstetricHistory();
    }
  }, [selectedPatient, user, authLoading]);

  const fetchGynecoObstetricHistory = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setError(null);

    try {
      console.log('GYNECO_HISTORY: Iniciando fetch para paciente:', selectedPatient.id,selectedPatient.Sexo); 
      const data = await api.gynecoObstetricHistory.getByPatientId(selectedPatient.id);
      console.log('GYNECO_HISTORY: Datos recibidos de la API:', data);
      if (data) {
        setGynecoObstetricRecord(data);
        // Formatear las fechas a YYYY-MM-DD y asegurar valores no nulos para el formulario
      const formattedData = {
          gestas: data.gestas,
          paras: data.paras,
          abortos: data.abortos,
          cesareas: data.cesareas,
          fum: data.fum ? format(parseISO(data.fum), 'yyyy-MM-dd') : '',
          menarquia: data.menarquia,
          ritmo_menstrual: data.ritmo_menstrual,
          metodo_anticonceptivo: data.metodo_anticonceptivo,
          fecha_ultimo_papanicolau: data.fecha_ultimo_papanicolau ? format(parseISO(data.fecha_ultimo_papanicolau), 'yyyy-MM-dd') : '',
          resultado_ultimo_papanicolau: data.resultado_ultimo_papanicolau,
          mamografia: data.mamografia ? format(parseISO(data.mamografia), 'yyyy-MM-dd') : '',
          resultado_mamografia: data.resultado_mamografia,
          notas_adicionales: data.notas_adicionales,
        };
        console.log('GYNECO_HISTORY: Datos formateados antes de reset:', formattedData);
        reset(formattedData); // Pasa el objeto formattedData completo
      } else {
         console.log('GYNECO_HISTORY: No se encontró registro existente. Reseteando formulario.');

        // Si no hay datos, resetear el formulario a valores por defecto y asegurar que no hay ID de registro existente
        setGynecoObstetricRecord(null);
        reset(); 
      }
    } catch (err) {
      console.error('Error fetching gyneco-obstetric history:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los antecedentes gineco-obstétricos.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: GynecoObstetricFormData) => {
    console.log('GYNECO_HISTORY: onSubmit - Function started.'); // Log al inicio de onSubmit
  console.log('GYNECO_HISTORY: onSubmit - Function started.'); // Log al inicio de onSubmit
    if (!selectedPatient || !user) return;

    setSaving(true);
    setError(null);

    try {
      console.log('onSubmit: Payload being sent:', data);
      const payload = {
        patient_id: selectedPatient.id,
        user_id: user.id, // user.id se obtiene del contexto de autenticación
        // idbu se inyecta automáticamente por createService
        ...data,
      };

      if (gynecoObstetricRecord) {
        console.log('GYNECO_HISTORY: onSubmit - Attempting to UPDATE record with patient_id:', selectedPatient.id, 'and payload:', payload);
        console.log('GYNECO_HISTORY: onSubmit - Attempting to UPDATE record with patient_id:', selectedPatient.id, 'and payload:', payload);

        const result = await api.gynecoObstetricHistory.update(selectedPatient.id, payload);
        console.log('onSubmit: Update successful, result:', result);
      } else {
        console.log('GYNECO_HISTORY: onSubmit - Attempting to CREATE new record with payload:', payload);
        const newRecord = await api.gynecoObstetricHistory.create(payload);
        setGynecoObstetricRecord(newRecord);
        console.log('onSubmit: Create successful, new record:', newRecord);
      }
      
      await fetchGynecoObstetricHistory(); // Re-fetch data to update form and report immediately
      console.log('onSubmit: Data saved successfully and form reloaded.');
    } catch (err) {
      console.error('GYNECO_HISTORY: onSubmit - FATAL ERROR saving gyneco-obstetric history:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los antecedentes gineco-obstétricos.');
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

  // Renderizado condicional para modales de advertencia
  if (!selectedPatient) {
    return (
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={clsx(buttonStyle.base, 'flex items-center gap-2')}
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

  if (selectedPatient.Sexo?.toLowerCase() !== 'femenino') {
    return (
      <Modal
        isOpen={showGenderWarningModal}
        onClose={() => setShowGenderWarningModal(false)}
        title="Sección No Aplicable"
        actions={
          <button
            className={clsx(buttonStyle.base, 'flex items-center gap-2')}
            style={buttonStyle.primary}
            onClick={() => {
              setShowGenderWarningModal(false);
              navigate('/patients');
            }}
          >
            Entendido
          </button>
        }
      >
        <div className="text-center">
          <Baby className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: currentTheme.colors.textSecondary }} />
          <p>Los antecedentes gineco-obstétricos solo aplican para pacientes de sexo femenino.</p>
          <p className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
            Paciente actual: {selectedPatient.Nombre} {selectedPatient.Paterno} ({selectedPatient.Sexo})
          </p>
        </div>
      </Modal>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
        <span className="ml-3" style={{ color: currentTheme.colors.text }}>
          {authLoading ? 'Autenticando...' : 'Cargando antecedentes gineco-obstétricos...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Antecedentes Gineco-Obstétricos
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
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="p-4 rounded-md border-l-4 mb-4"
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

      {/* Main Form Card */}
      <div
        className="rounded-lg shadow-lg p-6"
        style={{
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {error && (
          <div
            className="p-4 rounded-md border-l-4 mb-4"
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sección de Gestas, Paras, Abortos, Cesáreas */}
          <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="gestas" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Gestas
                <Tooltip text="Calculado automáticamente como la suma de Paras + Abortos + Cesáreas. Representa el número total de embarazos que ha tenido la paciente.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="gestas"
                {...register('gestas')}
                readOnly
                placeholder="Calculado automáticamente"
                className="w-full p-2 rounded-md border cursor-not-allowed"
                style={{
                  ...inputStyle,
                  backgroundColor: currentTheme.colors.background,
                  opacity: 0.7, marginBottom: '-0.5rem'
                }}
              />
            </div>
            <div>
              <label htmlFor="paras" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Paras
                <Tooltip text="Número de partos que han llegado a término (después de las 37 semanas) o prematuros (entre las 20 y 37 semanas), resultando en un nacimiento vivo.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="paras"
                {...register('paras')}
                placeholder="Ej: 2"
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
            <div>
              <label htmlFor="abortos" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Abortos
                <Tooltip text="Número total de embarazos que terminaron antes de las 20 semanas de gestación, ya sea de forma espontánea o inducida.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="abortos"
                {...register('abortos')}
                placeholder="Ej: 1"
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
            <div>
              <label htmlFor="cesareas" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Cesáreas
                <Tooltip text="Número de partos que se realizaron mediante una intervención quirúrgica (cesárea).">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="number"
                id="cesareas"
                {...register('cesareas')}
                placeholder="Ej: 1"
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
          </div>

          {/* Sección de Historial Menstrual */}
          <div className="grid grid-cols-6 sm:grid-cols-4 gap-4"> 
            <div>
              <label htmlFor="fum" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Última Menstruación (FUM)
                <Tooltip text="La fecha del primer día de la última menstruación de la paciente. Es un dato clave para calcular la edad gestacional en caso de embarazo.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="fum"
                {...register('fum')}
                className="w-full  p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              /> 
            </div>
            <div>
                <label htmlFor="ritmo_menstrual" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                  Ritmo Menstrual
                  <Tooltip text="Describe la duración del ciclo menstrual y la duración del sangrado. Se expresa como 'duración del ciclo x duración del sangrado' (ej. 28x5 = ciclo de 28 días con 5 días de sangrado).">
                    <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  id="ritmo_menstrual"
                  {...register('ritmo_menstrual')}
                  placeholder="Ej: 28x5 (ciclo de 28 días, 5 días de sangrado)"
                  className="w-full p-2 rounded-md border"
                  style={{inputStyle, marginBottom: '-0.5rem'}}
                />
            </div>
            <div className="col-span-2">
                <label htmlFor="metodo_anticonceptivo" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                  Método Anticonceptivo Actual
                  <Tooltip text="El método que la paciente utiliza actualmente para prevenir el embarazo (ej. Píldoras anticonceptivas, DIU, Condón, Implante, Ninguno).">
                    <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  id="metodo_anticonceptivo"
                  {...register('metodo_anticonceptivo')}
                  placeholder="Ej: Píldoras, DIU, Condón, Ninguno"
                  className="w-full p-2 rounded-md border"
                  style={{inputStyle, marginBottom: '-0.5rem'}}
                />
            </div>
          </div>

          {/* Sección de Papanicolau y Mamografía */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha_ultimo_papanicolau" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Último Papanicolau
                <Tooltip text="Fecha en que se realizó la última prueba de Papanicolau (citología cervical), un examen para detectar cambios en las células del cuello uterino.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="fecha_ultimo_papanicolau"
                {...register('fecha_ultimo_papanicolau')}
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
            <div>
              <label htmlFor="resultado_ultimo_papanicolau" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Resultado Último Papanicolau
                <Tooltip text="El resultado del último Papanicolau. Valores comunes: Normal, ASCUS (células atípicas), NIC I/II/III (lesiones precancerosas).">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="text"
                id="resultado_ultimo_papanicolau"
                {...register('resultado_ultimo_papanicolau')}
                placeholder="Ej: Normal, ASCUS, NIC I"
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
            <div>
              <label htmlFor="mamografia" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Última Mamografía
                <Tooltip text="Fecha en que se realizó la última mamografía, una radiografía de la mama utilizada para detectar el cáncer de mama.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="mamografia"
                {...register('mamografia')}
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
            <div>
              <label htmlFor="resultado_mamografia" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Resultado Última Mamografía
                <Tooltip text="El resultado de la última mamografía, clasificado usando el sistema BIRADS. BIRADS 1: Normal, BIRADS 2: Hallazgos benignos, BIRADS 3: Probablemente benigno.">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="text"
                id="resultado_mamografia"
                {...register('resultado_mamografia')}
                placeholder="Ej: BIRADS 1, BIRADS 2"
                className="w-full p-2 rounded-md border"
                style={{inputStyle, marginBottom: '-0.5rem'}}
              />
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label htmlFor="notas_adicionales" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Notas Adicionales
              <Tooltip text="Cualquier otra información relevante sobre el historial gineco-obstétrico que no encaje en los campos anteriores (ej. Enfermedades de transmisión sexual, cirugías ginecológicas, problemas de fertilidad, menopausia).">
                <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
              </Tooltip>
            </label>
            <textarea
              id="notas_adicionales"
              {...register('notas_adicionales')}
              placeholder="Ej: Enfermedades de transmisión sexual, cirugías ginecológicas, problemas de fertilidad, menopausia..."
              rows={2}
              className="w-full p-1 rounded-md border"
              style={{...inputStyle, marginBottom: '-0.5rem'}}
            />
          </div>

          {/* Move the Save button inside the form */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className={clsx(buttonStyle.base, 'disabled:opacity-50', 'flex items-center gap-2')}
              style={buttonStyle.primary}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>

        {/* Resumen */}
        <div className="mt-6 pt-2 border-t" style={{ borderColor: currentTheme.colors.border }}>
          <h4 
            className="text-sm font-medium mb-2"
            style={{ color: currentTheme.colors.text }}
          >
            Resumen:
          </h4>
          <div className="flex flex-wrap gap-2">
            {watchedValues.gestas !== null && watchedValues.gestas > 0 && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: currentTheme.colors.border,
                }}
              >
                Gestas: {watchedValues.gestas}
              </span>
            )}
            {watchedValues.paras !== null && watchedValues.paras > 0 && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#DEF7EC',
                  color: '#059669',
                  borderColor: '#A7F3D0',
                }}
              >
                Paras: {watchedValues.paras}
              </span>
            )}
            {watchedValues.abortos !== null && watchedValues.abortos > 0 && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#FEE2E2',
                  color: '#DC2626',
                  borderColor: '#FCA5A5',
                }}
              >
                Abortos: {watchedValues.abortos}
              </span>
            )}
            {watchedValues.cesareas !== null && watchedValues.cesareas > 0 && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#FFFBEB',
                  color: '#D97706',
                  borderColor: '#FED7AA',
                }}
              >
                Cesáreas: {watchedValues.cesareas}
              </span>
            )}
            {watchedValues.fum && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: currentTheme.colors.border,
                }}
              >
                FUM: {format(parseISO(watchedValues.fum), 'dd/MM/yyyy')}
              </span>
            )}
            {watchedValues.menarquia !== null && watchedValues.menarquia > 0 && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: currentTheme.colors.border,
                }}
              >
                Menarquia: {watchedValues.menarquia} años
              </span>
            )}
            {watchedValues.ritmo_menstrual && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: currentTheme.colors.border,
                }}
              >
                Ritmo: {watchedValues.ritmo_menstrual}
              </span>
            )}
            {watchedValues.metodo_anticonceptivo && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#DBEAFE',
                  color: '#2563EB',
                  borderColor: '#93C5FD',
                }}
              >
                Anticonceptivo: {watchedValues.metodo_anticonceptivo}
              </span>
            )}
            {watchedValues.fecha_ultimo_papanicolau && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#F0F9FF',
                  color: '#0EA5E9',
                  borderColor: '#BAE6FD',
                }}
              >
                Papanicolau: {format(parseISO(watchedValues.fecha_ultimo_papanicolau), 'dd/MM/yyyy')}
              </span>
            )}
            {watchedValues.resultado_ultimo_papanicolau && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#F0F9FF',
                  color: '#0EA5E9',
                  borderColor: '#BAE6FD',
                }}
              >
                Resultado Pap: {watchedValues.resultado_ultimo_papanicolau}
              </span>
            )}
            {watchedValues.mamografia && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#F0FDF4',
                  color: '#16A34A',
                  borderColor: '#BBF7D0',
                }}
              >
                Mamografía: {format(parseISO(watchedValues.mamografia), 'dd/MM/yyyy')}
              </span>
            )}
            {watchedValues.resultado_mamografia && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: '#F0FDF4',
                  color: '#16A34A',
                  borderColor: '#BBF7D0',
                }}
              >
                Resultado Mamografía: {watchedValues.resultado_mamografia}
              </span>
            )}
            {watchedValues.notas_adicionales && (
              <span 
                className="px-2 py-1 rounded-full text-xs border"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                  borderColor: currentTheme.colors.border,
                }}
              >
                Notas registradas
              </span>
            )}
            {!watchedValues.gestas && 
             !watchedValues.paras && 
             !watchedValues.abortos && 
             !watchedValues.cesareas && 
             !watchedValues.fum && 
             !watchedValues.menarquia && 
             !watchedValues.ritmo_menstrual && 
             !watchedValues.metodo_anticonceptivo && 
             !watchedValues.fecha_ultimo_papanicolau && 
             !watchedValues.mamografia && 
             !watchedValues.notas_adicionales && (
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

      {/* Modal del Informe Gineco-Obstétrico (si se implementa) */}
      {selectedPatient && showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Informe de Antecedentes Gineco-Obstétricos"
          className="max-w-6xl w-full"
        >
          <GynecoObstetricReport
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