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
import { Scale, Ruler, Baby, X, Thermometer } from 'lucide-react';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface SomatometryFormProps {
  patient: Patient;
  onSuccess: (somatometry: SomatometryRecord) => void;
  onCancel: () => void;
  existingSomatometry?: SomatometryRecord;
}

export function SomatometryFormNew({ 
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
    temperature: existingSomatometry?.temperature || undefined,
    notes: existingSomatometry?.notes || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SomatometryConfig | null>(null);
  const [sliderRanges, setSliderRanges] = useState<any>(null);
  const [latestRecord, setLatestRecord] = useState<SomatometryRecord | null>(null);

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

  // Cargar configuración
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!user?.id) {
          setError('Usuario no autenticado');
          return;
        }
        
        const { data: userIdbuValue, error: userError } = await supabase.rpc('get_user_idbu_simple');
        
        if (userError) {
          setError(`Error RPC: ${userError.message || 'Error desconocido'}`);
          return;
        }
        
        if (!userIdbuValue) {
          if (patient.idbu) {
            const configData = await somatometryConfigService.getOrCreateConfig(patient.idbu);
            setConfig(configData);
            return;
          }
          setError('No se encontró unidad de negocio para el usuario');
          return;
        }
        
        const configData = await somatometryConfigService.getOrCreateConfig(userIdbuValue);
        setConfig(configData);
        
      } catch (err) {
        setError(`Error al cargar datos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    };
    loadUserData();
  }, [user?.id, patient.idbu]);

  // Cargar rangos de sliders
  useEffect(() => {
    const loadSliderRanges = async () => {
      if (ageMonths > 0) {
        try {
          const rangesData = await somatometryService.getSliderRanges(
            patient.Sexo === 'Masculino' ? 'M' : 'F',
            ageMonths
          );
          setSliderRanges(rangesData);
        } catch (err) {
          console.error('Error loading slider ranges:', err);
        }
      }
    };
    loadSliderRanges();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const somatometryData = {
        ...formData,
        age_months: ageMonths
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

  if (!sliderRanges) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-2xl shadow-xl" style={{ background: currentTheme.colors.surface }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: currentTheme.colors.primary }} />
          <p style={{ color: currentTheme.colors.textSecondary }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto rounded-2xl shadow-xl overflow-hidden" style={{ background: currentTheme.colors.surface }}>
      {/* Header Compacto */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: currentTheme.colors.surface }}>
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>
              {existingSomatometry ? 'Editar' : 'Nueva'} Somatometría
            </h2>
            <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
              {patient.Nombre} {patient.Paterno} {patient.Materno}
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-black/5 transition-colors">
          <X className="h-5 w-5" style={{ color: currentTheme.colors.secondary }} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg" style={{ background: '#FEE2E2', color: '#DC2626' }}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 pt-1 space-y-3">
        {/* Fecha de Medición y Edad */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.textSecondary }}>
              Fecha de Medición
            </label>
            <input
              type="date"
              value={formData.measurement_date}
              onChange={(e) => setFormData(prev => ({ ...prev, measurement_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: currentTheme.colors.background,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border,
                height: '40px'
              }}
              required
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium" style={{ color: currentTheme.colors.textSecondary }}>
                Edad
              </label>
              {patient.Sexo === 'Masculino' ? (
                <div className="text-lg font-bold" style={{ color: '#4A90E2' }}>♂</div>
              ) : (
                <div className="text-lg font-bold" style={{ color: '#E91E63' }}>♀</div>
              )}
            </div>
            <div 
              className="px-3 rounded-lg text-center flex items-center justify-center"
              style={{ 
                backgroundColor: patient.Sexo === 'Masculino' ? '#4A90E220' : '#E91E6320',
                color: patient.Sexo === 'Masculino' ? '#4A90E2' : '#E91E63',
                border: `1px solid ${patient.Sexo === 'Masculino' ? '#4A90E240' : '#E91E6340'}`,
                height: '40px'
              }}
            >
              <p className="text-sm font-bold">
                {detailedAge.years}a {detailedAge.months}m
              </p>
            </div>
          </div>
        </div>

        {/* Peso Slider */}
        <CustomSlider
          value={formData.weight}
          onChange={(value) => setFormData(prev => ({ ...prev, weight: value }))}
          min={sliderRanges.weight.min}
          max={sliderRanges.weight.max}
          normalRange={sliderRanges.weight.normal}
          label="Peso"
          unit="kg"
          icon={<Scale className="h-5 w-5" />}
        />

        {/* Talla Slider */}
        <CustomSlider
          value={formData.height}
          onChange={(value) => setFormData(prev => ({ ...prev, height: value }))}
          min={sliderRanges.height.min}
          max={sliderRanges.height.max}
          normalRange={sliderRanges.height.normal}
          label="Talla"
          unit="cm"
          icon={<Ruler className="h-5 w-5" />}
        />

        {/* Perímetro Cefálico Slider */}
        <CustomSlider
          value={formData.head_circumference || (sliderRanges.headCircumference?.normal.min || 40)}
          onChange={(value) => setFormData(prev => ({ ...prev, head_circumference: value }))}
          min={sliderRanges.headCircumference?.min || 30}
          max={sliderRanges.headCircumference?.max || 60}
          normalRange={sliderRanges.headCircumference?.normal || { min: 40, max: 52 }}
          label="P. Cefálico"
          unit="cm"
          icon={<Baby className="h-5 w-5" />}
        />

        {/* IMC Calculado */}
        {bmi > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg border" 
               style={{ 
                 backgroundColor: currentTheme.colors.background,
                 borderColor: currentTheme.colors.border 
               }}>
            <div className="flex items-center gap-2">
              <div style={{ color: currentTheme.colors.secondary }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                IMC
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>
                {bmi.toFixed(1)}
              </span>
              <span className="text-sm ml-1" style={{ color: currentTheme.colors.textSecondary }}>
                kg/m²
              </span>
            </div>
          </div>
        )}

        {/* Temperatura */}
        <CustomSlider
          value={formData.temperature || (sliderRanges.temperature?.normal.min || 36.5)}
          onChange={(value) => setFormData(prev => ({ ...prev, temperature: value }))}
          min={sliderRanges.temperature?.min || 30}
          max={sliderRanges.temperature?.max || 45}
          normalRange={sliderRanges.temperature?.normal || { min: 34.7, max: 38 }}
          label="Temperatura"
          unit="°C"
          step={0.1}
          icon={
            <Thermometer className="h-5 w-5" />
          }
        />

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: currentTheme.colors.textSecondary }}>
            Observaciones
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-3 rounded-lg border resize-none"
            style={{
              backgroundColor: currentTheme.colors.background,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border,
            }}
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border transition-colors"
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
            disabled={loading}
            className="flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              `${existingSomatometry ? 'Actualizar' : 'Guardar'}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
