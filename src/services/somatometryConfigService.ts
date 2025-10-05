import { supabase } from '../lib/supabase';
import type { 
  SomatometryConfig, 
  SomatometryConfigInsert, 
  SomatometryConfigUpdate,
  AlertThresholds
} from '../types/somatometry';

export class SomatometryConfigService {
  
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================
  
  async getByIdbu(idbu: string): Promise<SomatometryConfig | null> {
    const { data, error } = await supabase
      .from('tpSomatometriasConfig')
      .select('*')
      .eq('idbu', idbu)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching somatometry config: ${error.message}`);
    }
    return data;
  }

  async getOrCreateConfig(idbu: string): Promise<SomatometryConfig> {
    let config = await this.getByIdbu(idbu);
    
    if (!config) {
      config = await this.createDefault(idbu);
    }
    
    return config;
  }

  async createDefault(idbu: string): Promise<SomatometryConfig> {
    const defaultConfig: SomatometryConfigInsert = {
      idbu,
      bmi_underweight_threshold: 15.0,
      bmi_overweight_threshold: 25.0,
      bmi_obesity_threshold: 30.0,
      use_who_percentiles: true,
      use_cdc_percentiles: false,
      show_growth_alerts: true,
      alert_below_percentile: 3,
      alert_above_percentile: 97,
      require_head_circumference_under_24m: true,
      allow_manual_age_override: false
    };

    const { data, error } = await supabase
      .from('tpSomatometriasConfig')
      .insert(defaultConfig)
      .select('*')
      .single();
    
    if (error) throw new Error(`Error creating default config: ${error.message}`);
    return data;
  }

  async update(idbu: string, updates: SomatometryConfigUpdate): Promise<SomatometryConfig> {
    const { data, error } = await supabase
      .from('tpSomatometriasConfig')
      .update(updates)
      .eq('idbu', idbu)
      .select('*')
      .single();
    
    if (error) throw new Error(`Error updating somatometry config: ${error.message}`);
    return data;
  }

  // ============================================================================
  // CONFIGURACIÓN ESPECÍFICA
  // ============================================================================

  async updateBMIThresholds(
    idbu: string, 
    thresholds: { underweight: number; overweight: number; obesity: number }
  ): Promise<SomatometryConfig> {
    return this.update(idbu, {
      bmi_underweight_threshold: thresholds.underweight,
      bmi_overweight_threshold: thresholds.overweight,
      bmi_obesity_threshold: thresholds.obesity
    });
  }

  async updatePercentileSettings(
    idbu: string, 
    settings: { 
      useWHO: boolean; 
      useCDC: boolean; 
      alertBelow: number; 
      alertAbove: number; 
    }
  ): Promise<SomatometryConfig> {
    return this.update(idbu, {
      use_who_percentiles: settings.useWHO,
      use_cdc_percentiles: settings.useCDC,
      alert_below_percentile: settings.alertBelow,
      alert_above_percentile: settings.alertAbove
    });
  }

  async updateGeneralSettings(
    idbu: string, 
    settings: { 
      showAlerts: boolean; 
      requireHeadCirc: boolean; 
      allowManualAge: boolean; 
    }
  ): Promise<SomatometryConfig> {
    return this.update(idbu, {
      show_growth_alerts: settings.showAlerts,
      require_head_circumference_under_24m: settings.requireHeadCirc,
      allow_manual_age_override: settings.allowManualAge
    });
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  getAlertThresholds(config: SomatometryConfig): AlertThresholds {
    return {
      bmi: {
        underweight: config.bmi_underweight_threshold,
        overweight: config.bmi_overweight_threshold,
        obesity: config.bmi_obesity_threshold
      },
      percentiles: {
        below: config.alert_below_percentile,
        above: config.alert_above_percentile
      }
    };
  }

  shouldRequireHeadCircumference(config: SomatometryConfig, ageMonths: number): boolean {
    return config.require_head_circumference_under_24m && ageMonths < 24;
  }

  shouldShowAlerts(config: SomatometryConfig): boolean {
    return config.show_growth_alerts;
  }

  canOverrideAge(config: SomatometryConfig): boolean {
    return config.allow_manual_age_override;
  }

  getPreferredPercentileSource(config: SomatometryConfig): 'WHO' | 'CDC' | 'BOTH' {
    if (config.use_who_percentiles && config.use_cdc_percentiles) return 'BOTH';
    if (config.use_cdc_percentiles) return 'CDC';
    return 'WHO';
  }

  validateBMIThresholds(thresholds: { underweight: number; overweight: number; obesity: number }): string[] {
    const errors: string[] = [];
    
    if (thresholds.underweight >= thresholds.overweight) {
      errors.push('El umbral de bajo peso debe ser menor al de sobrepeso');
    }
    
    if (thresholds.overweight >= thresholds.obesity) {
      errors.push('El umbral de sobrepeso debe ser menor al de obesidad');
    }
    
    if (thresholds.underweight < 10 || thresholds.underweight > 20) {
      errors.push('El umbral de bajo peso debe estar entre 10 y 20');
    }
    
    if (thresholds.overweight < 20 || thresholds.overweight > 30) {
      errors.push('El umbral de sobrepeso debe estar entre 20 y 30');
    }
    
    if (thresholds.obesity < 25 || thresholds.obesity > 40) {
      errors.push('El umbral de obesidad debe estar entre 25 y 40');
    }
    
    return errors;
  }

  validatePercentileSettings(settings: { alertBelow: number; alertAbove: number }): string[] {
    const errors: string[] = [];
    
    const validBelowValues = [3, 5, 10];
    const validAboveValues = [90, 95, 97];
    
    if (!validBelowValues.includes(settings.alertBelow)) {
      errors.push('El percentil inferior debe ser 3, 5 o 10');
    }
    
    if (!validAboveValues.includes(settings.alertAbove)) {
      errors.push('El percentil superior debe ser 90, 95 o 97');
    }
    
    return errors;
  }

  // ============================================================================
  // CONFIGURACIONES PREDEFINIDAS
  // ============================================================================

  getConservativeConfig(): Partial<SomatometryConfigUpdate> {
    return {
      bmi_underweight_threshold: 15.0,
      bmi_overweight_threshold: 23.0,
      bmi_obesity_threshold: 27.0,
      alert_below_percentile: 5,
      alert_above_percentile: 95,
      show_growth_alerts: true,
      require_head_circumference_under_24m: true
    };
  }

  getStandardConfig(): Partial<SomatometryConfigUpdate> {
    return {
      bmi_underweight_threshold: 15.0,
      bmi_overweight_threshold: 25.0,
      bmi_obesity_threshold: 30.0,
      alert_below_percentile: 3,
      alert_above_percentile: 97,
      show_growth_alerts: true,
      require_head_circumference_under_24m: true
    };
  }

  getLiberalConfig(): Partial<SomatometryConfigUpdate> {
    return {
      bmi_underweight_threshold: 13.0,
      bmi_overweight_threshold: 27.0,
      bmi_obesity_threshold: 32.0,
      alert_below_percentile: 3,
      alert_above_percentile: 97,
      show_growth_alerts: false,
      require_head_circumference_under_24m: false
    };
  }

  async applyPresetConfig(
    idbu: string, 
    preset: 'conservative' | 'standard' | 'liberal'
  ): Promise<SomatometryConfig> {
    let configUpdates: Partial<SomatometryConfigUpdate>;
    
    switch (preset) {
      case 'conservative':
        configUpdates = this.getConservativeConfig();
        break;
      case 'liberal':
        configUpdates = this.getLiberalConfig();
        break;
      default:
        configUpdates = this.getStandardConfig();
    }
    
    return this.update(idbu, configUpdates);
  }
}

// Instancia singleton del servicio
export const somatometryConfigService = new SomatometryConfigService();
