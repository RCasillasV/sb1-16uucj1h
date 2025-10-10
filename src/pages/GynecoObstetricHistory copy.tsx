// src/pages/GynecoObstetricHistory.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Heart, Save, AlertCircle, Baby, Printer, Info, Activity, Calendar as CalendarIcon, Stethoscope, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import { api } from '../lib/api';
import { format, parseISO, addDays, differenceInDays } from 'date-fns'; // Para formatear fechas
import { es } from 'date-fns/locale';
import { Tooltip } from '../components/Tooltip';
import { GynecoObstetricReport } from '../components/Informes/GynecoObstetricReport';

// Esquema de validación con Zod
const gynecoObstetricSchema = z.object({
  // Campos de embarazo actual
  embarazada: z.boolean().default(false),
  fpp: z.string().nullable().optional(), // Calculado automáticamente
  semanas_gestacion: z.number().nullable().optional(), // Calculado
  trimestre: z.string().nullable().optional(), // Calculado
  embarazo_alto_riesgo: z.boolean().default(false),
  notas_embarazo_actual: z.string().nullable().optional(),
  
  // Campos obstétricos
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
  
  // Campos menstruales
  fum: z.string().nullable().optional().transform(e => e === "" ? null : e),
  menarquia: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).nullable().optional()
  ),
  ritmo_menstrual: z.string().nullable().optional(),
  metodo_anticonceptivo: z.string().nullable().optional(),
  ivsa: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int().min(0).max(100).nullable().optional()
  ),
  fecha_menopausia: z.string().nullable().optional().transform(e => e === "" ? null : e),
  
  // Estudios
  fecha_ultimo_papanicolau: z.string().nullable().optional().transform(e => e === "" ? null : e),
  resultado_ultimo_papanicolau: z.string().nullable().optional(),
  mamografia: z.string().nullable().optional().transform(e => e === "" ? null : e),
  resultado_mamografia: z.string().nullable().optional(),
  
  // Notas
  notas_adicionales: z.string().nullable().optional(),
});

type GynecoObstetricFormData = z.infer<typeof gynecoObstetricSchema>;

// Función para calcular FPP usando Regla de Naegele
const calcularFPP = (fum: string | null): { fpp: Date; semanasGestacion: number; diasGestacion: number; diasRestantes: number; trimestre: string } | null => {
  if (!fum) return null;
  
  try {
    const fumDate = parseISO(fum);
    const hoy = new Date();
    
    // FPP = FUM + 280 días (Regla de Naegele)
    const fpp = addDays(fumDate, 280);
    
    // Calcular días y semanas de gestación
    const diasGestacion = differenceInDays(hoy, fumDate);
    const semanasGestacion = Math.floor(diasGestacion / 7);
    const diasRestantes = differenceInDays(fpp, hoy);
    
    // Determinar trimestre
    let trimestre = '';
    if (semanasGestacion < 0) trimestre = 'Fecha FUM inválida';
    else if (semanasGestacion < 13) trimestre = 'Primer Trimestre';
    else if (semanasGestacion < 27) trimestre = 'Segundo Trimestre';
    else if (semanasGestacion < 42) trimestre = 'Tercer Trimestre';
    else trimestre = 'Post-término';
    
    return { fpp, semanasGestacion, diasGestacion, diasRestantes, trimestre };
  } catch (error) {
    console.error('Error calculando FPP:', error);
    return null;
  }
};

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
      embarazada: false,
      fpp: null,
      semanas_gestacion: null,
      trimestre: null,
      embarazo_alto_riesgo: false,
      notas_embarazo_actual: null,
      gestas: null,
      paras: null,
      abortos: null,
      cesareas: null,
      fum: null,
      menarquia: null,
      ritmo_menstrual: null,
      metodo_anticonceptivo: null,
      ivsa: null,
      fecha_menopausia: null,
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
          embarazada: data.embarazada || false,
          fpp: data.fpp ? format(parseISO(data.fpp), 'yyyy-MM-dd') : null,
          semanas_gestacion: data.semanas_gestacion,
          trimestre: data.trimestre,
          embarazo_alto_riesgo: data.embarazo_alto_riesgo || false,
          notas_embarazo_actual: data.notas_embarazo_actual,
          gestas: data.gestas,
          paras: data.paras,
          abortos: data.abortos,
          cesareas: data.cesareas,
          fum: data.fum ? format(parseISO(data.fum), 'yyyy-MM-dd') : '',
          menarquia: data.menarquia,
          ritmo_menstrual: data.ritmo_menstrual,
          metodo_anticonceptivo: data.metodo_anticonceptivo,
          ivsa: data.ivsa,
          fecha_menopausia: data.fecha_menopausia ? format(parseISO(data.fecha_menopausia), 'yyyy-MM-dd') : null,
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
    console.log('GYNECO_HISTORY: onSubmit - Function started.');
    if (!selectedPatient || !user) return;

    setSaving(true);
    setError(null);

    try {
      console.log('onSubmit: Payload being sent:', data);
      const payload = {
        patient_id: selectedPatient.id,
        user_id: user.id,
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
      'px-4 py-1 transition-colors',
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons?.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors?.buttonPrimary || currentTheme.colors.primary,
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
  {/* Grid responsivo: 2 columnas en desktop, 1 en móvil */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    {/* ========== CARD 1: EMBARAZO ACTUAL ========== */}
    <div className="rounded-lg shadow-lg p-6 border" style={{
      background: currentTheme.colors.surface,
      borderColor: currentTheme.colors.border,
    }}>
      <div className="flex items-center gap-2 mb-4">
        <Baby className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>
          Embarazo Actual
        </h3>
      </div>

      <div className="space-y-4">
        {/* Checkbox Embarazada */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="embarazada"
            {...register('embarazada')}
            className="h-4 w-4 rounded"
            style={{ accentColor: currentTheme.colors.primary }}
          />
          <label htmlFor="embarazada" className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
            Paciente actualmente embarazada
          </label>
        </div>

        {/* Mostrar campos solo si está embarazada */}
        {watchedValues.embarazada && (
          <>
            {/* FUM */}
            <div>
              <label htmlFor="fum_embarazo" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Fecha Última Menstruación (FUM)
                <Tooltip text="La FUM es necesaria para calcular la Fecha Probable de Parto (FPP) usando la Regla de Naegele">
                  <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
                </Tooltip>
              </label>
              <input
                type="date"
                id="fum_embarazo"
                {...register('fum')}
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>

            {/* Mostrar FPP calculada */}
            {watchedValues.fum && (() => {
              const fppData = calcularFPP(watchedValues.fum);
              return fppData && fppData.semanasGestacion >= 0 && (
                <div className="p-4 rounded-lg border-2" style={{ 
                  background: `${currentTheme.colors.primary}10`,
                  borderColor: currentTheme.colors.primary 
                }}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                        Fecha Probable de Parto (FPP):
                      </span>
                      <span className="text-lg font-bold" style={{ color: currentTheme.colors.primary }}>
                        {format(fppData.fpp, 'd \'de\' MMMM yyyy', { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: currentTheme.colors.textSecondary }}>Edad Gestacional:</span>
                      <span className="font-semibold" style={{ color: currentTheme.colors.text }}>
                        {fppData.semanasGestacion} semanas {fppData.diasGestacion % 7} días
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: currentTheme.colors.textSecondary }}>Trimestre:</span>
                      <span className="font-semibold" style={{ color: currentTheme.colors.text }}>
                        {fppData.trimestre}
                      </span>
                    </div>
                    {fppData.diasRestantes > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: currentTheme.colors.textSecondary }}>Días restantes:</span>
                        <span className="font-semibold" style={{ color: currentTheme.colors.text }}>
                          {fppData.diasRestantes} días
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Embarazo de alto riesgo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="embarazo_alto_riesgo"
                {...register('embarazo_alto_riesgo')}
                className="h-4 w-4 rounded"
                style={{ accentColor: '#EF4444' }}
              />
              <label htmlFor="embarazo_alto_riesgo" className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                Embarazo de alto riesgo
              </label>
            </div>

            {/* Notas embarazo actual */}
            <div>
              <label htmlFor="notas_embarazo_actual" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                Notas del Embarazo Actual
              </label>
              <textarea
                id="notas_embarazo_actual"
                {...register('notas_embarazo_actual')}
                placeholder="Ej: Diabetes gestacional, preeclampsia, etc."
                rows={3}
                className="w-full p-2 rounded-md border"
                style={inputStyle}
              />
            </div>
          </>
        )}

        {!watchedValues.embarazada && (
          <p className="text-sm text-center py-4" style={{ color: currentTheme.colors.textSecondary }}>
            Marque la casilla si la paciente está actualmente embarazada
          </p>
        )}
      </div>
    </div>

    {/* ========== CARD 2: HISTORIAL OBSTÉTRICO ========== */}
    <div className="rounded-lg shadow-lg p-6 border" style={{
      background: currentTheme.colors.surface,
      borderColor: currentTheme.colors.border,
    }}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>
          Historial Obstétrico (GPAC)
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="gestas" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Gestas
            <Tooltip text="Calculado automáticamente: Paras + Abortos + Cesáreas">
              <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
            </Tooltip>
          </label>
          <input
            type="number"
            id="gestas"
            {...register('gestas')}
            readOnly
            placeholder="Auto"
            className="w-full p-2 rounded-md border cursor-not-allowed"
            style={{
              ...inputStyle,
              backgroundColor: currentTheme.colors.background,
              opacity: 0.7,
            }}
          />
        </div>
        <div>
          <label htmlFor="paras" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Paras
            <Tooltip text="Número de partos (≥20 semanas)">
              <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
            </Tooltip>
          </label>
          <input
            type="number"
            id="paras"
            {...register('paras')}
            placeholder="Ej: 2"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="abortos" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Abortos
            <Tooltip text="Embarazos terminados <20 semanas">
              <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
            </Tooltip>
          </label>
          <input
            type="number"
            id="abortos"
            {...register('abortos')}
            placeholder="Ej: 1"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="cesareas" className="flex items-center text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Cesáreas
            <Tooltip text="Partos por cesárea">
              <Info className="h-4 w-4 ml-1 cursor-help" style={{ color: currentTheme.colors.textSecondary }} />
            </Tooltip>
          </label>
          <input
            type="number"
            id="cesareas"
            {...register('cesareas')}
            placeholder="Ej: 1"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Resumen GPAC */}
      {(watchedValues.gestas || watchedValues.paras || watchedValues.abortos || watchedValues.cesareas) && (
        <div className="mt-4 p-3 rounded-lg" style={{ background: `${currentTheme.colors.primary}10` }}>
          <p className="text-sm font-semibold text-center" style={{ color: currentTheme.colors.primary }}>
            G{watchedValues.gestas || 0}P{watchedValues.paras || 0}A{watchedValues.abortos || 0}C{watchedValues.cesareas || 0}
          </p>
        </div>
      )}
    </div>

    {/* ========== CARD 3: HISTORIAL MENSTRUAL ========== */}
    <div className="rounded-lg shadow-lg p-6 border" style={{
      background: currentTheme.colors.surface,
      borderColor: currentTheme.colors.border,
    }}>
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>
          Historial Menstrual
        </h3>
      </div>

      <div className="space-y-4">
        {!watchedValues.embarazada && (
          <div>
            <label htmlFor="fum_menstrual" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Fecha Última Menstruación (FUM)
            </label>
            <input
              type="date"
              id="fum_menstrual"
              {...register('fum')}
              className="w-full p-2 rounded-md border"
              style={inputStyle}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="menarquia" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              Menarquia (años)
            </label>
            <input
              type="number"
              id="menarquia"
              {...register('menarquia')}
              placeholder="Ej: 12"
              className="w-full p-2 rounded-md border"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="ivsa" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
              IVSA (años)
            </label>
            <input
              type="number"
              id="ivsa"
              {...register('ivsa')}
              placeholder="Ej: 18"
              className="w-full p-2 rounded-md border"
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label htmlFor="ritmo_menstrual" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Ritmo Menstrual
          </label>
          <input
            type="text"
            id="ritmo_menstrual"
            {...register('ritmo_menstrual')}
            placeholder="Ej: 28x5"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="metodo_anticonceptivo" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Método Anticonceptivo
          </label>
          <input
            type="text"
            id="metodo_anticonceptivo"
            {...register('metodo_anticonceptivo')}
            placeholder="Ej: DIU, Píldoras, Ninguno"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="fecha_menopausia" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Fecha Menopausia
          </label>
          <input
            type="date"
            id="fecha_menopausia"
            {...register('fecha_menopausia')}
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
      </div>
    </div>

    {/* ========== CARD 4: ESTUDIOS Y PREVENCIÓN ========== */}
    <div className="rounded-lg shadow-lg p-6 border" style={{
      background: currentTheme.colors.surface,
      borderColor: currentTheme.colors.border,
    }}>
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>
          Estudios y Prevención
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="fecha_ultimo_papanicolau" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Fecha Último Papanicolau
          </label>
          <input
            type="date"
            id="fecha_ultimo_papanicolau"
            {...register('fecha_ultimo_papanicolau')}
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="resultado_ultimo_papanicolau" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Resultado Papanicolau
          </label>
          <input
            type="text"
            id="resultado_ultimo_papanicolau"
            {...register('resultado_ultimo_papanicolau')}
            placeholder="Ej: Normal, ASCUS, NIC I"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="mamografia" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Fecha Última Mamografía
          </label>
          <input
            type="date"
            id="mamografia"
            {...register('mamografia')}
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="resultado_mamografia" className="block text-sm font-medium mb-1" style={{ color: currentTheme.colors.text }}>
            Resultado Mamografía
          </label>
          <input
            type="text"
            id="resultado_mamografia"
            {...register('resultado_mamografia')}
            placeholder="Ej: BIRADS 1, BIRADS 2"
            className="w-full p-2 rounded-md border"
            style={inputStyle}
          />
        </div>
      </div>
    </div>

    {/* ========== CARD 5: NOTAS ADICIONALES (Ancho completo) ========== */}
    <div className="lg:col-span-2 rounded-lg shadow-lg p-6 border" style={{
      background: currentTheme.colors.surface,
      borderColor: currentTheme.colors.border,
    }}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
        <h3 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>
          Notas Adicionales
        </h3>
      </div>

      <textarea
        id="notas_adicionales"
        {...register('notas_adicionales')}
        placeholder="Cualquier información adicional relevante sobre el historial gineco-obstétrico..."
        rows={4}
        className="w-full p-3 rounded-md border"
        style={inputStyle}
      />
    </div>
  </div>

  {/* Botón Guardar */}
  <div className="flex justify-end">
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