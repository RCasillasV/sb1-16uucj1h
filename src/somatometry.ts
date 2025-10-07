// Interfaces para somatometrías pediátricas
import type { Database } from './database.types';

// Tipos temporales hasta que se ejecute la migration
export interface SomatometryRecord {
  id: string;
  patient_id: string;
  idbu: string;
  measurement_date: string;
  weight: number;
  height: number;
  head_circumference?: number;
  temperature?: number;
  bmi?: number;
  age_months: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SomatometryInsert {
  patient_id: string;
  // idbu se asigna automáticamente por get_user_idbu_simple()
  measurement_date: string;
  weight: number;
  height: number;
  head_circumference?: number;
  bmi?: number;
  age_months: number;
  notes?: string;
}

export interface SomatometryUpdate {
  weight?: number;
  height?: number;
  head_circumference?: number;
  temperature?: number;
  bmi?: number;
  age_months?: number;
  notes?: string;
  updated_at?: string;
}

export interface SomatometryConfig {
  id: string;
  idbu: string;
  bmi_underweight_threshold: number;
  bmi_overweight_threshold: number;
  bmi_obesity_threshold: number;
  height_alert_threshold?: number;
  weight_alert_threshold?: number;
  head_circumference_alert_threshold?: number;
  show_percentiles?: boolean;
  show_z_scores?: boolean;
  default_chart_type?: string;
  auto_calculate_bmi?: boolean;
  require_notes_for_alerts?: boolean;
  use_who_percentiles?: boolean;
  use_cdc_percentiles?: boolean;
  show_growth_alerts?: boolean;
  alert_below_percentile?: number;
  alert_above_percentile?: number;
  require_head_circumference_under_24m?: boolean;
  allow_manual_age_override?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SomatometryConfigInsert {
  bmi_underweight_threshold?: number;
  bmi_overweight_threshold?: number;
  bmi_obesity_threshold?: number;
  height_alert_threshold?: number;
  weight_alert_threshold?: number;
  head_circumference_alert_threshold?: number;
  show_percentiles?: boolean;
  show_z_scores?: boolean;
  default_chart_type?: string;
  auto_calculate_bmi?: boolean;
  require_notes_for_alerts?: boolean;
  use_who_percentiles?: boolean;
  use_cdc_percentiles?: boolean;
  show_growth_alerts?: boolean;
  alert_below_percentile?: number;
  alert_above_percentile?: number;
  require_head_circumference_under_24m?: boolean;
  allow_manual_age_override?: boolean;
}

export interface SomatometryConfigUpdate {
  bmi_underweight_threshold?: number;
  bmi_overweight_threshold?: number;
  bmi_obesity_threshold?: number;
  height_alert_threshold?: number;
  weight_alert_threshold?: number;
  head_circumference_alert_threshold?: number;
  show_percentiles?: boolean;
  show_z_scores?: boolean;
  default_chart_type?: string;
  auto_calculate_bmi?: boolean;
  require_notes_for_alerts?: boolean;
  use_who_percentiles?: boolean;
  use_cdc_percentiles?: boolean;
  show_growth_alerts?: boolean;
  alert_below_percentile?: number;
  alert_above_percentile?: number;
  require_head_circumference_under_24m?: boolean;
  allow_manual_age_override?: boolean;
  updated_at?: string;
}

export interface WHOWeightForAge {
  id: string;
  sex: string;
  age_months: number;
  l: number;
  m: number;
  s: number;
  p3: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p97: number;
}

export interface WHOHeightForAge {
  id: string;
  sex: string;
  age_months: number;
  l: number;
  m: number;
  s: number;
  p3: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p97: number;
}

export interface WHOBMIForAge {
  id: string;
  sex: string;
  age_months: number;
  l: number;
  m: number;
  s: number;
  p3: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p97: number;
}

export interface WHOHeadCircumference {
  id: string;
  sex: string;
  age_months: number;
  l: number;
  m: number;
  s: number;
  p3: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p97: number;
}

// Interfaces extendidas para uso en componentes
export interface SomatometryWithPatient extends SomatometryRecord {
  patient?: {
    id: string;
    Nombre: string;
    Paterno: string;
    Materno?: string;
    FechaNacimiento: string;
    Sexo: string;
  };
}

export interface SomatometryFormData {
  patient_id: string;
  measurement_date: string;
  weight: number;
  height: number;
  head_circumference?: number;
  temperature?: number;
  notes?: string;
}

// Percentiles OMS agrupados
export interface WHOPercentiles {
  weight?: WHOWeightForAge;
  height?: WHOHeightForAge;
  bmi?: WHOBMIForAge;
  headCircumference?: WHOHeadCircumference;
}

// Análisis de crecimiento
export interface GrowthAnalysis {
  weight: {
    value: number;
    percentile: number;
    status: 'underweight' | 'normal' | 'overweight' | 'obesity';
    zScore: number;
  };
  height: {
    value: number;
    percentile: number;
    status: 'short' | 'normal' | 'tall';
    zScore: number;
  };
  bmi: {
    value: number;
    percentile: number;
    status: 'underweight' | 'normal' | 'overweight' | 'obesity';
    zScore: number;
  };
  headCircumference?: {
    value: number;
    percentile: number;
    status: 'microcephaly' | 'normal' | 'macrocephaly';
    zScore: number;
  };
  alerts: GrowthAlert[];
}

export interface GrowthAlert {
  type: 'warning' | 'danger' | 'info';
  category: 'weight' | 'height' | 'bmi' | 'head_circumference' | 'growth_velocity';
  message: string;
  recommendation?: string;
}

// Datos para gráficas
export interface GrowthChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth?: number;
    pointRadius?: number;
    fill?: boolean;
  }[];
}

// Configuración de alertas
export interface AlertThresholds {
  bmi: {
    underweight: number;
    overweight: number;
    obesity: number;
  };
  percentiles: {
    below: number; // P3, P5, P10
    above: number; // P90, P95, P97
  };
}

// Velocidad de crecimiento
export interface GrowthVelocity {
  period: 'monthly' | 'quarterly' | 'yearly';
  weight: {
    change: number; // kg
    velocity: number; // kg/month
    expected: number; // velocidad esperada
    status: 'slow' | 'normal' | 'fast';
  };
  height: {
    change: number; // cm
    velocity: number; // cm/month
    expected: number;
    status: 'slow' | 'normal' | 'fast';
  };
}

// Filtros para consultas
export interface SomatometryFilters {
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
  ageMonthsFrom?: number;
  ageMonthsTo?: number;
  measuredBy?: string;
  idbu?: string;
}

// Estadísticas de crecimiento
export interface GrowthStatistics {
  totalMeasurements: number;
  averageWeight: number;
  averageHeight: number;
  averageBMI: number;
  lastMeasurement: SomatometryRecord | null;
  growthTrend: 'improving' | 'stable' | 'concerning';
  alertsCount: {
    warning: number;
    danger: number;
  };
}

// Enums útiles
export enum GrowthStatus {
  UNDERWEIGHT = 'underweight',
  NORMAL = 'normal',
  OVERWEIGHT = 'overweight',
  OBESITY = 'obesity'
}

export enum HeightStatus {
  SHORT = 'short',
  NORMAL = 'normal',
  TALL = 'tall'
}

export enum HeadCircumferenceStatus {
  MICROCEPHALY = 'microcephaly',
  NORMAL = 'normal',
  MACROCEPHALY = 'macrocephaly'
}

export enum AlertType {
  WARNING = 'warning',
  DANGER = 'danger',
  INFO = 'info'
}

// Utilidades de cálculo
export interface AgeCalculation {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalDays: number;
}

// Configuración de gráficas
export interface ChartConfiguration {
  showPercentiles: boolean;
  percentilesToShow: number[]; // [3, 15, 50, 85, 97]
  showZScores: boolean;
  timeRange: 'all' | '1year' | '2years' | '5years';
  chartType: 'weight_age' | 'height_age' | 'bmi_age' | 'head_circumference_age';
}