import { supabase } from '../lib/supabase';
import type { 
  SomatometryRecord, 
  SomatometryInsert, 
  SomatometryUpdate,
  SomatometryWithPatient,
  SomatometryFilters,
  WHOPercentiles,
  GrowthAnalysis,
  GrowthStatistics,
  AgeCalculation
} from '../types/somatometry';

export class SomatometryService {
  
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================
  
  async create(data: SomatometryInsert): Promise<SomatometryRecord> {
    const { data: result, error } = await supabase
      .from('tpSomatometrias')
      .insert(data)
      .select('*')
      .single();
    
    if (error) throw new Error(`Error creating somatometry: ${error.message}`);
    return result;
  }

  async getById(id: string): Promise<SomatometryRecord | null> {
    const { data, error } = await supabase
      .from('tpSomatometrias')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching somatometry: ${error.message}`);
    }
    return data;
  }

  async getByPatient(patientId: string): Promise<SomatometryRecord[]> {
    const { data, error } = await supabase
      .from('tpSomatometrias')
      .select('*')
      .eq('patient_id', patientId)
      .order('measurement_date', { ascending: false });
    
    if (error) throw new Error(`Error fetching patient somatometries: ${error.message}`);
    return data || [];
  }

  async getLatestByPatient(patientId: string): Promise<SomatometryRecord | null> {
    const { data, error } = await supabase
      .from('tpSomatometrias')
      .select('*')
      .eq('patient_id', patientId)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching latest somatometry: ${error.message}`);
    }
    return data;
  }

  async getByPatientWithDetails(patientId: string): Promise<SomatometryWithPatient[]> {
    const { data, error } = await supabase
      .from('tpSomatometrias')
      .select(`
        *,
        patient:tcPacientes(id, Nombre, Paterno, Materno, FechaNacimiento, Sexo)
      `)
      .eq('patient_id', patientId)
      .order('measurement_date', { ascending: false });
    
    if (error) throw new Error(`Error fetching somatometries with patient details: ${error.message}`);
    return data || [];
  }

  async update(id: string, data: SomatometryUpdate): Promise<SomatometryRecord> {
    // Primero verificar que el registro existe y es accesible
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Somatometry record not found or not accessible');
    }

    const { data: result, error } = await supabase
      .from('tpSomatometrias')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Update error details:', error);
      throw new Error(`Error updating somatometry: ${error.message}`);
    }
    
    if (!result) {
      throw new Error('No data returned after update - possible RLS issue');
    }
    
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tpSomatometrias')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Error deleting somatometry: ${error.message}`);
  }

  async getFiltered(filters: SomatometryFilters): Promise<SomatometryRecord[]> {
    let query = supabase.from('tpSomatometrias').select('*');

    if (filters.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    if (filters.dateFrom) {
      query = query.gte('measurement_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('measurement_date', filters.dateTo);
    }
    if (filters.ageMonthsFrom) {
      query = query.gte('age_months', filters.ageMonthsFrom);
    }
    if (filters.ageMonthsTo) {
      query = query.lte('age_months', filters.ageMonthsTo);
    }
    if (filters.measuredBy) {
      query = query.eq('measured_by', filters.measuredBy);
    }
    if (filters.idbu) {
      query = query.eq('idbu', filters.idbu);
    }

    query = query.order('measurement_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`Error fetching filtered somatometries: ${error.message}`);
    return data || [];
  }

  // ============================================================================
  // WHO PERCENTILES - COMPLETE DATA FOR CHARTS
  // ============================================================================

  async getCompleteWHOWeightData(sex: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tcSomatometriasPesoEdad')
      .select('age_months, p3, p15, p50, p85, p97')
      .eq('sex', sex)
      .order('age_months');
    
    if (error) throw new Error(`Error fetching complete weight data: ${error.message}`);
    return data || [];
  }

  async getCompleteWHOHeightData(sex: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tcSomatometriasAlturaEdad')
      .select('age_months, p3, p15, p50, p85, p97')
      .eq('sex', sex)
      .order('age_months');
    
    if (error) throw new Error(`Error fetching complete height data: ${error.message}`);
    return data || [];
  }

  async getCompleteWHOBMIData(sex: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tcSomatometriasBmiEdad')
      .select('age_months, p3, p15, p50, p85, p97')
      .eq('sex', sex)
      .order('age_months');
    
    if (error) throw new Error(`Error fetching complete BMI data: ${error.message}`);
    return data || [];
  }

  async getCompleteWHOHeadCircumferenceData(sex: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tcSomatometriasCircuHeadAge')
      .select('age_months, p3, p15, p50, p85, p97')
      .eq('sex', sex)
      .order('age_months');
    
    if (error) throw new Error(`Error fetching complete head circumference data: ${error.message}`);
    return data || [];
  }

  // Método para obtener datos formateados para Chart.js
  async getWHOChartData(type: 'weight' | 'height' | 'bmi' | 'head', sex: string) {
    let data: any[];
    
    switch (type) {
      case 'weight':
        data = await this.getCompleteWHOWeightData(sex);
        break;
      case 'height':
        data = await this.getCompleteWHOHeightData(sex);
        break;
      case 'bmi':
        data = await this.getCompleteWHOBMIData(sex);
        break;
      case 'head':
        data = await this.getCompleteWHOHeadCircumferenceData(sex);
        break;
      default:
        throw new Error(`Unknown chart type: ${type}`);
    }

    // Convertir percentiles OMS a formato Z-score para las gráficas
    return {
      ages: data.map(d => d.age_months),
      sd3neg: data.map(d => d.p3),    // P3 ≈ -2SD
      sd2neg: data.map(d => d.p15),   // P15 ≈ -1SD
      sd0: data.map(d => d.p50),      // P50 = Mediana
      sd2pos: data.map(d => d.p85),   // P85 ≈ +1SD
      sd3pos: data.map(d => d.p97)    // P97 ≈ +2SD
    };
  }

  // ============================================================================
  // WHO PERCENTILES - INDIVIDUAL LOOKUPS
  // ============================================================================

  async getWHOPercentiles(sex: string, ageMonths: number): Promise<WHOPercentiles> {
    const [weightData, heightData, bmiData, headData] = await Promise.all([
      this.getWeightPercentiles(sex, ageMonths),
      this.getHeightPercentiles(sex, ageMonths),
      this.getBMIPercentiles(sex, ageMonths),
      ageMonths <= 36 ? this.getHeadCircumferencePercentiles(sex, ageMonths) : null
    ]);

    return {
      weight: weightData,
      height: heightData,
      bmi: bmiData,
      headCircumference: headData
    };
  }

  async getSliderRanges(sex: string, ageMonths: number): Promise<{
    weight: { min: number; max: number; normal: { min: number; max: number } };
    height: { min: number; max: number; normal: { min: number; max: number } };
    headCircumference?: { min: number; max: number; normal: { min: number; max: number } };
    temperature: { min: number; max: number; normal: { min: number; max: number } };
  }> {
    const percentiles = await this.getWHOPercentiles(sex, ageMonths);
    
    const result: any = {
      weight: {
        min: (percentiles.weight as any)?.p3 ? (percentiles.weight as any).p3 * 0.8 : 2,
        max: (percentiles.weight as any)?.p97 ? (percentiles.weight as any).p97 * 1.2 : 30,
        normal: {
          min: (percentiles.weight as any)?.p15 || 8,
          max: (percentiles.weight as any)?.p85 || 16
        }
      },
      height: {
        min: (percentiles.height as any)?.p3 ? (percentiles.height as any).p3 * 0.9 : 40,
        max: (percentiles.height as any)?.p97 ? (percentiles.height as any).p97 * 1.1 : 120,
        normal: {
          min: (percentiles.height as any)?.p15 || 70,
          max: (percentiles.height as any)?.p85 || 110
        }
      },
      temperature: {
        min: 30,
        max: 45,
        normal: {
          min: 34.7,
          max: 38
        }
      }
    };

    // Perímetro cefálico - siempre incluir con rangos apropiados por edad
    if (percentiles.headCircumference) {
      result.headCircumference = {
        min: (percentiles.headCircumference as any)?.p3 ? (percentiles.headCircumference as any).p3 * 0.9 : 30,
        max: (percentiles.headCircumference as any)?.p97 ? (percentiles.headCircumference as any).p97 * 1.1 : 60,
        normal: {
          min: (percentiles.headCircumference as any)?.p15 || 40,
          max: (percentiles.headCircumference as any)?.p85 || 52
        }
      };
    } else {
      // Rangos por defecto basados en edad
      const baseMin = ageMonths <= 36 ? 30 : 45;
      const baseMax = ageMonths <= 36 ? 60 : 65;
      const normalMin = ageMonths <= 36 ? 40 : 50;
      const normalMax = ageMonths <= 36 ? 52 : 58;
      
      result.headCircumference = {
        min: baseMin,
        max: baseMax,
        normal: {
          min: normalMin,
          max: normalMax
        }
      };
    }

    return result;
  }

  private async getWeightPercentiles(sex: string, ageMonths: number) {
    const { data, error } = await supabase
      .from('tcSomatometriasPesoEdad')
      .select('*')
      .eq('sex', sex)
      .eq('age_months', ageMonths)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching weight percentiles: ${error.message}`);
    }
    return data;
  }

  private async getHeightPercentiles(sex: string, ageMonths: number) {
    const { data, error } = await supabase
      .from('tcSomatometriasAlturaEdad')
      .select('*')
      .eq('sex', sex)
      .eq('age_months', ageMonths)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching height percentiles: ${error.message}`);
    }
    return data;
  }

  private async getBMIPercentiles(sex: string, ageMonths: number) {
    const { data, error } = await supabase
      .from('tcSomatometriasBmiEdad')
      .select('*')
      .eq('sex', sex)
      .eq('age_months', ageMonths)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching BMI percentiles: ${error.message}`);
    }
    return data;
  }

  private async getHeadCircumferencePercentiles(sex: string, ageMonths: number) {
    const { data, error } = await supabase
      .from('tcSomatometriasCircuHeadAge')
      .select('*')
      .eq('sex', sex)
      .eq('age_months', ageMonths)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching head circumference percentiles: ${error.message}`);
    }
    return data;
  }

  // ============================================================================
  // ANÁLISIS Y CÁLCULOS
  // ============================================================================

  async analyzeGrowth(
    patientId: string, 
    sex: string, 
    birthDate: string
  ): Promise<GrowthAnalysis | null> {
    const records = await this.getByPatient(patientId);
    if (records.length === 0) return null;

    const latestRecord = records[0];
    const ageMonths = this.calculateAgeInMonths(birthDate, latestRecord.measurement_date);
    const percentiles = await this.getWHOPercentiles(sex, ageMonths);

    return {
      weight: this.analyzeWeightStatus(latestRecord.weight, percentiles.weight),
      height: this.analyzeHeightStatus(latestRecord.height, percentiles.height),
      bmi: this.analyzeBMIStatus(latestRecord.bmi, percentiles.bmi),
      headCircumference: latestRecord.head_circumference && percentiles.headCircumference
        ? this.analyzeHeadCircumferenceStatus(latestRecord.head_circumference, percentiles.headCircumference)
        : undefined,
      alerts: this.generateAlerts(latestRecord, percentiles)
    };
  }

  private analyzeWeightStatus(weight: number, percentiles: any) {
    if (!percentiles) {
      return {
        value: weight,
        percentile: 0,
        status: 'normal' as const,
        zScore: 0
      };
    }

    const percentile = this.calculatePercentile(weight, percentiles);
    let status: 'underweight' | 'normal' | 'overweight' | 'obesity' = 'normal';
    
    if (percentile < 3) status = 'underweight';
    else if (percentile > 97) status = 'overweight';

    return {
      value: weight,
      percentile,
      status,
      zScore: this.calculateZScore(weight, percentiles.p50, percentiles)
    };
  }

  private analyzeHeightStatus(height: number, percentiles: any) {
    if (!percentiles) {
      return {
        value: height,
        percentile: 0,
        status: 'normal' as const,
        zScore: 0
      };
    }

    const percentile = this.calculatePercentile(height, percentiles);
    let status: 'short' | 'normal' | 'tall' = 'normal';
    
    if (percentile < 3) status = 'short';
    else if (percentile > 97) status = 'tall';

    return {
      value: height,
      percentile,
      status,
      zScore: this.calculateZScore(height, percentiles.p50, percentiles)
    };
  }

  private analyzeBMIStatus(bmi: number, percentiles: any) {
    if (!percentiles) {
      return {
        value: bmi,
        percentile: 0,
        status: 'normal' as const,
        zScore: 0
      };
    }

    const percentile = this.calculatePercentile(bmi, percentiles);
    let status: 'underweight' | 'normal' | 'overweight' | 'obesity' = 'normal';
    
    if (percentile < 15) status = 'underweight';
    else if (percentile >= 85 && percentile < 97) status = 'overweight';
    else if (percentile >= 97) status = 'obesity';

    return {
      value: bmi,
      percentile,
      status,
      zScore: this.calculateZScore(bmi, percentiles.p50, percentiles)
    };
  }

  private analyzeHeadCircumferenceStatus(headCirc: number, percentiles: any) {
    if (!percentiles) {
      return {
        value: headCirc,
        percentile: 0,
        status: 'normal' as const,
        zScore: 0
      };
    }

    const percentile = this.calculatePercentile(headCirc, percentiles);
    let status: 'microcephaly' | 'normal' | 'macrocephaly' = 'normal';
    
    if (percentile < 3) status = 'microcephaly';
    else if (percentile > 97) status = 'macrocephaly';

    return {
      value: headCirc,
      percentile,
      status,
      zScore: this.calculateZScore(headCirc, percentiles.p50, percentiles)
    };
  }

  private generateAlerts(record: SomatometryRecord, percentiles: WHOPercentiles) {
    const alerts = [];
    
    // Implementar lógica de alertas basada en percentiles y tendencias
    // Por ahora retornamos array vacío
    return alerts;
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  calculateAgeInMonths(birthDate: string, measurementDate: string): number {
    const birth = new Date(birthDate);
    const measurement = new Date(measurementDate);
    
    const yearDiff = measurement.getFullYear() - birth.getFullYear();
    const monthDiff = measurement.getMonth() - birth.getMonth();
    const dayDiff = measurement.getDate() - birth.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    if (dayDiff < 0) {
      totalMonths -= 1;
    }
    
    return Math.max(0, totalMonths);
  }

  calculateDetailedAge(birthDate: string, measurementDate: string): AgeCalculation {
    const birth = new Date(birthDate);
    const measurement = new Date(measurementDate);
    
    const totalDays = Math.floor((measurement.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const totalMonths = this.calculateAgeInMonths(birthDate, measurementDate);
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const days = totalDays % 30; // Aproximación
    
    return {
      years,
      months,
      days,
      totalMonths,
      totalDays
    };
  }

  private calculatePercentile(value: number, percentiles: any): number {
    if (!percentiles) return 50;
    
    if (value <= percentiles.p3) return 3;
    if (value <= percentiles.p15) return this.interpolate(value, percentiles.p3, percentiles.p15, 3, 15);
    if (value <= percentiles.p50) return this.interpolate(value, percentiles.p15, percentiles.p50, 15, 50);
    if (value <= percentiles.p85) return this.interpolate(value, percentiles.p50, percentiles.p85, 50, 85);
    if (value <= percentiles.p97) return this.interpolate(value, percentiles.p85, percentiles.p97, 85, 97);
    
    return 97;
  }

  private interpolate(value: number, x1: number, x2: number, y1: number, y2: number): number {
    return y1 + ((value - x1) / (x2 - x1)) * (y2 - y1);
  }

  private calculateZScore(value: number, median: number, percentiles: any): number {
    // Implementación simplificada del Z-score
    // En producción, usar los parámetros L, M, S de la OMS
    const sd = (percentiles.p85 - percentiles.p15) / 2; // Aproximación
    return (value - median) / sd;
  }

  async getGrowthStatistics(patientId: string): Promise<GrowthStatistics> {
    const records = await this.getByPatient(patientId);
    
    if (records.length === 0) {
      return {
        totalMeasurements: 0,
        averageWeight: 0,
        averageHeight: 0,
        averageBMI: 0,
        lastMeasurement: null,
        growthTrend: 'stable',
        alertsCount: { warning: 0, danger: 0 }
      };
    }

    const totalWeight = records.reduce((sum, r) => sum + r.weight, 0);
    const totalHeight = records.reduce((sum, r) => sum + r.height, 0);
    const totalBMI = records.reduce((sum, r) => sum + r.bmi, 0);

    return {
      totalMeasurements: records.length,
      averageWeight: totalWeight / records.length,
      averageHeight: totalHeight / records.length,
      averageBMI: totalBMI / records.length,
      lastMeasurement: records[0],
      growthTrend: this.calculateGrowthTrend(records),
      alertsCount: { warning: 0, danger: 0 } // Implementar lógica de alertas
    };
  }

  private calculateGrowthTrend(records: SomatometryRecord[]): 'improving' | 'stable' | 'concerning' {
    if (records.length < 2) return 'stable';
    
    // Implementar lógica de tendencia basada en las últimas mediciones
    // Por ahora retornamos 'stable'
    return 'stable';
  }
}

// Instancia singleton del servicio
export const somatometryService = new SomatometryService();
