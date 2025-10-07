import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { somatometryService } from '../services/somatometryService';
import { somatometryConfigService } from '../services/somatometryConfigService';
import { CustomSlider } from '../components/CustomSlider';
import type { 
  SomatometryFormData, 
  SomatometryRecord,
  SomatometryConfig,
  WHOPercentiles 
} from '../types/somatometry';
import type { Database } from '../types/database.types';
import { Scale, Ruler, Brain, AlertTriangle, CheckCircle, X } from 'lucide-react';
import clsx from 'clsx';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface SomatometryFormProps {
  patient: Patient;
  onSuccess: (somatometry: SomatometryRecord) => void;
  onCancel: () => void;
  existingSomatometry?: SomatometryRecord;
}

export function SomatometryForm({ 
  patient, 
  onSuccess, 
  onCancel, 
  existingSomatometry 
}: SomatometryFormProps) {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  
  // Estados del formulario
  const [formData, setFormData] = useState<SomatometryFormData>({
    patient_id: patient.id,
    measurement_date: existingSomatometry?.measurement_date || new Date().toISOString().split('T')[0],
    weight: existingSomatometry?.weight || 0,
    height: existingSomatometry?.height || 0,
    head_circumference: existingSomatometry?.head_circumference || undefined,
    notes: existingSomatometry?.notes || ''
  });
  
  // Estado para rastrear si el usuario ha interactuado con los campos
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SomatometryConfig | null>(null);
  const [percentiles, setPercentiles] = useState<WHOPercentiles | null>(null);
  const [sliderRanges, setSliderRanges] = useState<any>(null);
  const [latestRecord, setLatestRecord] = useState<SomatometryRecord | null>(null);
  // userIdbu ya no es necesario porque se asigna automáticamente en la BD

  // Cálculos automáticos
  const ageMonths = useMemo(() => {
    return somatometryService.calculateAgeInMonths(
      patient.FechaNacimiento, 
      formData.measurement_date
    );
  }, [patient.FechaNacimiento, formData.measurement_date]);

  const detailedAge = useMemo(() => {
    return somatometryService.calculateDetailedAge(
      patient.FechaNacimiento, 
      formData.measurement_date
    );
  }, [patient.FechaNacimiento, formData.measurement_date]);

  const bmi = useMemo(() => {
    if (formData.weight > 0 && formData.height > 0) {
      return formData.weight / Math.pow(formData.height / 100, 2);
    }
    return 0;
  }, [formData.weight, formData.height]);

  // Cargar datos del usuario y configuración
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('Iniciando carga de datos del usuario...');
        
        // Verificar si el usuario está autenticado
        if (!user?.id) {
          console.error('Usuario no autenticado');
          setError('Usuario no autenticado');
          return;
        }
        
        console.log('Usuario autenticado:', user.id);
        
        const { data: userIdbuValue, error: userError } = await supabase.rpc('get_user_idbu_simple');
        
        console.log('Respuesta RPC get_user_idbu_simple:', { userIdbuValue, userError });
        
        if (userError) {
          console.error('Error en RPC get_user_idbu_simple:', userError);
          setError(`Error RPC: ${userError.message || 'Error desconocido'}`);
          return;
        }
        
        if (!userIdbuValue) {
          console.error('No se encontró idbu en la respuesta:', userIdbuValue);
          // Fallback: usar el idbu del paciente si existe
          if (patient.idbu) {
            console.log('Usando idbu del paciente como fallback:', patient.idbu);
            const configData = await somatometryConfigService.getOrCreateConfig(patient.idbu);
            setConfig(configData);
            return;
          }
          setError('No se encontró unidad de negocio para el usuario');
          return;
        }
        
        console.log('idbu obtenido exitosamente:', userIdbuValue);
        
        // Cargar configuración usando el idbu obtenido
        const configData = await somatometryConfigService.getOrCreateConfig(userIdbuValue);
        setConfig(configData);
        console.log('Configuración cargada exitosamente');
        
      } catch (err) {
        console.error('Error completo al cargar datos del usuario:', err);
        setError(`Error al cargar datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    };
    loadUserData();
  }, [user?.id, patient.idbu]);

  useEffect(() => {
    const loadPercentiles = async () => {
      if (ageMonths > 0) {
        try {
          const [percentilesData, rangesData] = await Promise.all([
            somatometryService.getWHOPercentiles(
              patient.Sexo === 'Masculino' ? 'M' : 'F',
              ageMonths
            ),
            somatometryService.getSliderRanges(
              patient.Sexo === 'Masculino' ? 'M' : 'F',
              ageMonths
            )
          ]);
          setPercentiles(percentilesData);
          setSliderRanges(rangesData);
        } catch (err) {
          console.error('Error loading percentiles:', err);
        }
      }
    };
    loadPercentiles();
  }, [patient.Sexo, ageMonths]);

  // Cargar último registro del paciente para valores iniciales
  useEffect(() => {
    const loadLatestRecord = async () => {
      if (!existingSomatometry) {
        try {
          const latest = await somatometryService.getLatestByPatient(patient.id);
          setLatestRecord(latest);
          
          if (latest) {
            setFormData(prev => ({
              ...prev,
              weight: latest.weight,
              height: latest.height,
              head_circumference: latest.head_circumference || undefined
            }));
          }
        } catch (err) {
          console.error('Error loading latest record:', err);
        }
      }
    };
    loadLatestRecord();
  }, [patient.id, existingSomatometry]);

  // Validaciones
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    // Solo mostrar errores para campos que el usuario ha tocado o si es edición
    if ((touchedFields.has('weight') || existingSomatometry) && (formData.weight <= 0 || formData.weight > 200)) {
      errors.push('El peso debe estar entre 0.1 y 200 kg');
    }
    
    if ((touchedFields.has('height') || existingSomatometry) && (formData.height <= 0 || formData.height > 250)) {
      errors.push('La talla debe estar entre 1 y 250 cm');
    }
    
    if (touchedFields.has('head_circumference') && formData.head_circumference && (formData.head_circumference <= 0 || formData.head_circumference > 70)) {
      errors.push('El perímetro cefálico debe estar entre 1 y 70 cm');
    }
    
    if (ageMonths < 0 || ageMonths > 240) {
      errors.push('La edad debe estar entre 0 y 20 años');
    }
    
    if (config?.require_head_circumference_under_24m && ageMonths < 24 && !formData.head_circumference && (touchedFields.has('head_circumference') || existingSomatometry)) {
      errors.push('El perímetro cefálico es obligatorio para menores de 24 meses');
    }
    
    return errors;
  }, [formData, ageMonths, config, touchedFields, existingSomatometry]);

  // Alertas de crecimiento
  const growthAlerts = useMemo(() => {
    if (!percentiles || !config) return [];
    
    const alerts: string[] = [];
    
    // Alertas de peso
    if (percentiles.weight) {
      if (formData.weight < percentiles.weight.p3) {
        alerts.push('⚠️ Peso por debajo del percentil 3 (bajo peso)');
      } else if (formData.weight > percentiles.weight.p97) {
        alerts.push('⚠️ Peso por encima del percentil 97');
      }
    }
    
    // Alertas de talla
    if (percentiles.height) {
      if (formData.height < percentiles.height.p3) {
        alerts.push('⚠️ Talla por debajo del percentil 3 (talla baja)');
      } else if (formData.height > percentiles.height.p97) {
        alerts.push('⚠️ Talla por encima del percentil 97');
      }
    }
    
    // Alertas de BMI
    if (percentiles.bmi && bmi > 0) {
      if (bmi < percentiles.bmi.p15) {
        alerts.push('⚠️ IMC indica bajo peso');
      } else if (bmi >= percentiles.bmi.p85 && bmi < percentiles.bmi.p97) {
        alerts.push('⚠️ IMC indica sobrepeso');
      } else if (bmi >= percentiles.bmi.p97) {
        alerts.push('🚨 IMC indica obesidad');
      }
    }
    
    // Alertas de perímetro cefálico
    if (percentiles.headCircumference && formData.head_circumference) {
      if (formData.head_circumference < percentiles.headCircumference.p3) {
        alerts.push('🚨 Perímetro cefálico por debajo del percentil 3 (microcefalia)');
      } else if (formData.head_circumference > percentiles.headCircumference.p97) {
        alerts.push('🚨 Perímetro cefálico por encima del percentil 97 (macrocefalia)');
      }
    }
    
    return alerts;
  }, [formData, percentiles, config, bmi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) {
      setError('Por favor corrige los errores antes de continuar');
      return;
    }
    
    // Validar que tengamos idbu
    // La validación del idbu ya no es necesaria porque se asigna automáticamente
    
    setLoading(true);
    setError(null);
    
    try {
      const somatometryData = {
        ...formData,
        age_months: ageMonths
        // idbu se asigna automáticamente por get_user_idbu_simple()
        // measured_by se puede agregar después si es necesario
      };
      
      let result: SomatometryRecord;
      
      if (existingSomatometry) {
        result = await somatometryService.update(existingSomatometry.id, somatometryData);
      } else {
        result = await somatometryService.create(somatometryData);
      }
      
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la somatometría');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    borderColor: currentTheme.colors.border,
  };

  const labelStyle = {
    color: currentTheme.colors.textSecondary,
    fontSize: `calc(${currentTheme.typography.baseSize} * 0.875)`,
  };

  return (
    <div 
      className="max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden"
      style={{ background: currentTheme.colors.surface }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-full"
            style={{ background: currentTheme.colors.primary }}
          >
            <Scale className="h-6 w-6" style={{ color: currentTheme.colors.buttonText }} />
          </div>
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fonts.headings,
              }}
            >
              {existingSomatometry ? 'Editar' : 'Nueva'} Somatometría
            </h2>
            <p style={{ color: currentTheme.colors.textSecondary }}>
              {patient.Nombre} {patient.Paterno} {patient.Materno}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
            Edad: {detailedAge.years} años, {detailedAge.months} meses
          </p>
          <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
            Sexo: {patient.Sexo}
          </p>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div 
          className="mb-4 p-4 rounded-md border-l-4"
          style={{ 
            background: '#FEE2E2',
            borderColor: '#DC2626',
            color: '#DC2626'
          }}
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <div 
          className="mb-4 p-4 rounded-md border-l-4"
          style={{ 
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E'
          }}
        >
          <h4 className="font-medium mb-2">Errores de validación:</h4>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alertas de crecimiento */}
      {growthAlerts.length > 0 && config?.show_growth_alerts && (
        <div 
          className="mb-4 p-4 rounded-md border-l-4"
          style={{ 
            background: '#FEF3C7',
            borderColor: '#F59E0B',
            color: '#92400E'
          }}
        >
          <h4 className="font-medium mb-2">Alertas de crecimiento:</h4>
          <ul className="space-y-1">
            {growthAlerts.map((alert, index) => (
              <li key={index} className="text-sm">{alert}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fecha de medición */}
        <div>
          <label htmlFor="measurement_date" className="block mb-1 font-medium" style={labelStyle}>
            Fecha de Medición
          </label>
          <input
            type="date"
            id="measurement_date"
            value={formData.measurement_date}
            onChange={(e) => setFormData(prev => ({ ...prev, measurement_date: e.target.value }))}
            className="w-full p-3 rounded-md border focus:ring-2 focus:ring-offset-2 transition-colors"
            style={inputStyle}
            required
          />
        </div>

        {/* Mediciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Peso */}
          <div>
            <label htmlFor="weight" className="block mb-1 font-medium" style={labelStyle}>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Peso (kg)
              </div>
            </label>
            <input
              type="number"
              id="weight"
              step="0.1"
              min="0.1"
              max="200"
              value={formData.weight || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }));
                setTouchedFields(prev => new Set(prev).add('weight'));
              }}
              onBlur={() => setTouchedFields(prev => new Set(prev).add('weight'))}
              className="w-full p-3 rounded-md border focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
              placeholder="Ej: 15.5"
              required
            />
            {percentiles?.weight && formData.weight > 0 && (
              <p className="text-xs mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                Percentiles OMS: P3={percentiles.weight.p3}kg, P50={percentiles.weight.p50}kg, P97={percentiles.weight.p97}kg
              </p>
            )}
          </div>

          {/* Talla */}
          <div>
            <label htmlFor="height" className="block mb-1 font-medium" style={labelStyle}>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Talla (cm)
              </div>
            </label>
            <input
              type="number"
              id="height"
              step="0.1"
              min="1"
              max="250"
              value={formData.height || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }));
                setTouchedFields(prev => new Set(prev).add('height'));
              }}
              onBlur={() => setTouchedFields(prev => new Set(prev).add('height'))}
              className="w-full p-3 rounded-md border focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
              placeholder="Ej: 95.0"
              required
            />
            {percentiles?.height && formData.height > 0 && (
              <p className="text-xs mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                Percentiles OMS: P3={percentiles.height.p3}cm, P50={percentiles.height.p50}cm, P97={percentiles.height.p97}cm
              </p>
            )}
          </div>

          {/* Perímetro cefálico */}
          <div>
            <label htmlFor="head_circumference" className="block mb-1 font-medium" style={labelStyle}>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Perímetro Cefálico (cm)
                {config?.require_head_circumference_under_24m && ageMonths < 24 && (
                  <span className="text-red-500">*</span>
                )}
              </div>
            </label>
            <input
              type="number"
              id="head_circumference"
              step="0.1"
              min="1"
              max="70"
              value={formData.head_circumference || ''}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  head_circumference: e.target.value ? parseFloat(e.target.value) : undefined 
                }));
                setTouchedFields(prev => new Set(prev).add('head_circumference'));
              }}
              onBlur={() => setTouchedFields(prev => new Set(prev).add('head_circumference'))}
              className="w-full p-3 rounded-md border focus:ring-2 focus:ring-offset-2 transition-colors"
              style={inputStyle}
              placeholder="Ej: 47.5"
              required={config?.require_head_circumference_under_24m && ageMonths < 24}
            />
            {percentiles?.headCircumference && formData.head_circumference && (
              <p className="text-xs mt-1" style={{ color: currentTheme.colors.textSecondary }}>
                Percentiles OMS: P3={percentiles.headCircumference.p3}cm, P50={percentiles.headCircumference.p50}cm, P97={percentiles.headCircumference.p97}cm
              </p>
            )}
          </div>
        </div>

        {/* IMC calculado */}
        {bmi > 0 && (
          <div 
            className="p-4 rounded-md border"
            style={{ 
              background: currentTheme.colors.background,
              borderColor: currentTheme.colors.border 
            }}
          >
            <h3 className="font-medium mb-2" style={{ color: currentTheme.colors.text }}>
              Índice de Masa Corporal (IMC)
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold" style={{ color: currentTheme.colors.primary }}>
                {bmi.toFixed(1)} kg/m²
              </span>
              {percentiles?.bmi && (
                <span className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                  Percentiles OMS: P15={percentiles.bmi.p15}, P50={percentiles.bmi.p50}, P85={percentiles.bmi.p85}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block mb-1 font-medium" style={labelStyle}>
            Observaciones
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-3 rounded-md border focus:ring-2 focus:ring-offset-2 transition-colors"
            style={inputStyle}
            placeholder="Observaciones adicionales sobre la medición..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-md border transition-colors"
            style={{
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
              background: 'transparent',
            }}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading || validationErrors.length > 0}
            className={clsx(
              "px-6 py-2 rounded-md transition-colors flex items-center gap-2",
              (loading || validationErrors.length > 0) && "opacity-50 cursor-not-allowed"
            )}
            style={{
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {existingSomatometry ? 'Actualizar' : 'Guardar'} Somatometría
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
