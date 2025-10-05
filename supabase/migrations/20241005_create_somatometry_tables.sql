-- Migration: Crear tablas de somatometrías pediátricas
-- Fecha: 2024-10-05
-- Descripción: Tablas para captura de somatometrías y catálogos OMS

-- ============================================================================
-- TABLAS DE PRODUCCIÓN (tp)
-- ============================================================================

-- Tabla principal de somatometrías
CREATE TABLE IF NOT EXISTS tpSomatometrias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  patient_id UUID NOT NULL REFERENCES tcPacientes(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  age_months INTEGER NOT NULL,
  age_days INTEGER,
  weight DECIMAL(5,2) CHECK (weight > 0 AND weight <= 200), -- kg
  height DECIMAL(5,1) CHECK (height > 0 AND height <= 250), -- cm
  head_circumference DECIMAL(4,1) CHECK (head_circumference > 0 AND head_circumference <= 70), -- cm
  bmi DECIMAL(4,1) GENERATED ALWAYS AS (
    CASE 
      WHEN height > 0 THEN weight / POWER(height/100, 2)
      ELSE NULL 
    END
  ) STORED,
  notes TEXT,
  measured_by UUID REFERENCES auth.users(id),
  idbu TEXT NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_age CHECK (age_months >= 0 AND age_months <= 240), -- 0-20 años
  CONSTRAINT valid_age_days CHECK (age_days >= 0 AND age_days <= 31)
);

-- Configuración por unidad de negocio
CREATE TABLE IF NOT EXISTS tpSomatometriasConfig (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idbu TEXT NOT NULL UNIQUE,
  
  -- Configuración de alertas BMI
  bmi_underweight_threshold DECIMAL(4,1) DEFAULT 15.0,
  bmi_overweight_threshold DECIMAL(4,1) DEFAULT 25.0,
  bmi_obesity_threshold DECIMAL(4,1) DEFAULT 30.0,
  
  -- Configuración de percentiles
  use_who_percentiles BOOLEAN DEFAULT true,
  use_cdc_percentiles BOOLEAN DEFAULT false,
  
  -- Configuración de alertas
  show_growth_alerts BOOLEAN DEFAULT true,
  alert_below_percentile INTEGER DEFAULT 3 CHECK (alert_below_percentile IN (3, 5, 10)),
  alert_above_percentile INTEGER DEFAULT 97 CHECK (alert_above_percentile IN (90, 95, 97)),
  
  -- Configuración de mediciones
  require_head_circumference_under_24m BOOLEAN DEFAULT true,
  allow_manual_age_override BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de auditoría/historial
CREATE TABLE IF NOT EXISTS tpSomatometriasHistorial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  somatometry_id UUID NOT NULL,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  idbu TEXT NOT NULL,
  
  -- Al menos uno de los valores debe existir
  CONSTRAINT valid_audit_data CHECK (
    (action_type = 'INSERT' AND old_values IS NULL AND new_values IS NOT NULL) OR
    (action_type = 'UPDATE' AND old_values IS NOT NULL AND new_values IS NOT NULL) OR
    (action_type = 'DELETE' AND old_values IS NOT NULL AND new_values IS NULL)
  )
);

-- ============================================================================
-- TABLAS DE CATÁLOGOS OMS (tc)
-- ============================================================================

-- Peso para edad (0-60 meses)
CREATE TABLE IF NOT EXISTS tcSomatometriasPesoEdad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sex VARCHAR(1) NOT NULL CHECK (sex IN ('M', 'F')),
  age_months INTEGER NOT NULL CHECK (age_months >= 0 AND age_months <= 60),
  p3 DECIMAL(5,2) NOT NULL,
  p15 DECIMAL(5,2) NOT NULL,
  p50 DECIMAL(5,2) NOT NULL,
  p85 DECIMAL(5,2) NOT NULL,
  p97 DECIMAL(5,2) NOT NULL,
  
  UNIQUE(sex, age_months),
  
  -- Validar orden de percentiles
  CONSTRAINT valid_weight_percentiles CHECK (p3 < p15 AND p15 < p50 AND p50 < p85 AND p85 < p97)
);

-- Altura para edad (0-60 meses)
CREATE TABLE IF NOT EXISTS tcSomatometriasAlturaEdad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sex VARCHAR(1) NOT NULL CHECK (sex IN ('M', 'F')),
  age_months INTEGER NOT NULL CHECK (age_months >= 0 AND age_months <= 60),
  p3 DECIMAL(5,1) NOT NULL,
  p15 DECIMAL(5,1) NOT NULL,
  p50 DECIMAL(5,1) NOT NULL,
  p85 DECIMAL(5,1) NOT NULL,
  p97 DECIMAL(5,1) NOT NULL,
  
  UNIQUE(sex, age_months),
  
  -- Validar orden de percentiles
  CONSTRAINT valid_height_percentiles CHECK (p3 < p15 AND p15 < p50 AND p50 < p85 AND p85 < p97)
);

-- BMI para edad (0-60 meses)
CREATE TABLE IF NOT EXISTS tcSomatometriasBmiEdad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sex VARCHAR(1) NOT NULL CHECK (sex IN ('M', 'F')),
  age_months INTEGER NOT NULL CHECK (age_months >= 0 AND age_months <= 60),
  p3 DECIMAL(4,1) NOT NULL,
  p15 DECIMAL(4,1) NOT NULL,
  p50 DECIMAL(4,1) NOT NULL,
  p85 DECIMAL(4,1) NOT NULL,
  p97 DECIMAL(4,1) NOT NULL,
  
  UNIQUE(sex, age_months),
  
  -- Validar orden de percentiles
  CONSTRAINT valid_bmi_percentiles CHECK (p3 < p15 AND p15 < p50 AND p50 < p85 AND p85 < p97)
);

-- Perímetro cefálico para edad (0-36 meses)
CREATE TABLE IF NOT EXISTS tcSomatometriasCircuHeadAge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sex VARCHAR(1) NOT NULL CHECK (sex IN ('M', 'F')),
  age_months INTEGER NOT NULL CHECK (age_months >= 0 AND age_months <= 36),
  p3 DECIMAL(4,1) NOT NULL,
  p15 DECIMAL(4,1) NOT NULL,
  p50 DECIMAL(4,1) NOT NULL,
  p85 DECIMAL(4,1) NOT NULL,
  p97 DECIMAL(4,1) NOT NULL,
  
  UNIQUE(sex, age_months),
  
  -- Validar orden de percentiles
  CONSTRAINT valid_head_percentiles CHECK (p3 < p15 AND p15 < p50 AND p50 < p85 AND p85 < p97)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para tpSomatometrias
CREATE INDEX IF NOT EXISTS idx_tpSomatometrias_patient_date ON tpSomatometrias(patient_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_tpSomatometrias_age ON tpSomatometrias(age_months);
CREATE INDEX IF NOT EXISTS idx_tpSomatometrias_idbu ON tpSomatometrias(idbu);
CREATE INDEX IF NOT EXISTS idx_tpSomatometrias_measured_by ON tpSomatometrias(measured_by);
CREATE INDEX IF NOT EXISTS idx_tpSomatometrias_date ON tpSomatometrias(measurement_date);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_tpSomatometriasHistorial_somatometry ON tpSomatometriasHistorial(somatometry_id);
CREATE INDEX IF NOT EXISTS idx_tpSomatometriasHistorial_date ON tpSomatometriasHistorial(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tpSomatometriasHistorial_idbu ON tpSomatometriasHistorial(idbu);

-- Índices para catálogos OMS (optimización de consultas)
CREATE INDEX IF NOT EXISTS idx_tcSomatometriasPesoEdad_lookup ON tcSomatometriasPesoEdad(sex, age_months);
CREATE INDEX IF NOT EXISTS idx_tcSomatometriasAlturaEdad_lookup ON tcSomatometriasAlturaEdad(sex, age_months);
CREATE INDEX IF NOT EXISTS idx_tcSomatometriasBmiEdad_lookup ON tcSomatometriasBmiEdad(sex, age_months);
CREATE INDEX IF NOT EXISTS idx_tcSomatometriasCircuHeadAge_lookup ON tcSomatometriasCircuHeadAge(sex, age_months);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_tpSomatometrias_updated_at ON tpSomatometrias;
CREATE TRIGGER update_tpSomatometrias_updated_at 
  BEFORE UPDATE ON tpSomatometrias 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tpSomatometriasConfig_updated_at ON tpSomatometriasConfig;
CREATE TRIGGER update_tpSomatometriasConfig_updated_at 
  BEFORE UPDATE ON tpSomatometriasConfig 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para auditoría automática
CREATE OR REPLACE FUNCTION audit_somatometrias()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO tpSomatometriasHistorial (
      somatometry_id, action_type, old_values, new_values, 
      changed_by, idbu
    ) VALUES (
      NEW.id, 'INSERT', NULL, 
      row_to_json(NEW)::jsonb,
      NEW.measured_by, NEW.idbu
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO tpSomatometriasHistorial (
      somatometry_id, action_type, old_values, new_values,
      changed_by, idbu
    ) VALUES (
      NEW.id, 'UPDATE',
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
      NEW.measured_by, NEW.idbu
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO tpSomatometriasHistorial (
      somatometry_id, action_type, old_values, new_values,
      changed_by, idbu
    ) VALUES (
      OLD.id, 'DELETE',
      row_to_json(OLD)::jsonb,
      NULL, OLD.measured_by, OLD.idbu
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoría
DROP TRIGGER IF EXISTS audit_somatometrias_trigger ON tpSomatometrias;
CREATE TRIGGER audit_somatometrias_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tpSomatometrias
  FOR EACH ROW EXECUTE FUNCTION audit_somatometrias();

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tpSomatometrias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpSomatometriasConfig ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpSomatometriasHistorial ENABLE ROW LEVEL SECURITY;

-- Las tablas de catálogos OMS no necesitan RLS (son públicas)

-- Políticas para tpSomatometrias
DROP POLICY IF EXISTS "Users can view somatometries from their business unit" ON tpSomatometrias;
CREATE POLICY "Users can view somatometries from their business unit" ON tpSomatometrias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tcPacientes p 
      WHERE p.id = patient_id 
      AND p.idbu = (
        SELECT idbu FROM tcPacientes 
        WHERE user_id = auth.uid() 
        LIMIT 1
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert somatometries for their patients" ON tpSomatometrias;
CREATE POLICY "Users can insert somatometries for their patients" ON tpSomatometrias
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tcPacientes p 
      WHERE p.id = patient_id 
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update somatometries they created" ON tpSomatometrias;
CREATE POLICY "Users can update somatometries they created" ON tpSomatometrias
  FOR UPDATE USING (measured_by = auth.uid());

-- Comentarios para documentación
COMMENT ON TABLE tpSomatometrias IS 'Registro de somatometrías pediátricas con cálculo automático de BMI';
COMMENT ON TABLE tpSomatometriasConfig IS 'Configuración personalizable por unidad de negocio';
COMMENT ON TABLE tpSomatometriasHistorial IS 'Auditoría completa de cambios en somatometrías';
COMMENT ON TABLE tcSomatometriasPesoEdad IS 'Percentiles OMS de peso para edad (0-60 meses)';
COMMENT ON TABLE tcSomatometriasAlturaEdad IS 'Percentiles OMS de altura para edad (0-60 meses)';
COMMENT ON TABLE tcSomatometriasBmiEdad IS 'Percentiles OMS de BMI para edad (0-60 meses)';
COMMENT ON TABLE tcSomatometriasCircuHeadAge IS 'Percentiles OMS de perímetro cefálico (0-36 meses)';
