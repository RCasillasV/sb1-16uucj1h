/*
  # Create Vital Signs Records Table (tpSignosVitales)

  ## Summary
  Creates the production table for storing individual vital sign measurements taken during
  patient visits or independent monitoring sessions. Each record captures a single vital sign
  measurement with optional association to appointments.

  ## 1. New Tables
    - tpSignosVitales (Vital Signs Records)
      - id (uuid, primary key) - Unique identifier
      - created_at (timestamptz) - Record creation timestamp
      - updated_at (timestamptz) - Last update timestamp
      - paciente_id (uuid) - Foreign key to tcPacientes
      - user_id (uuid) - User who recorded the measurement
      - idbu (uuid) - Business unit identifier
      - id_cita (uuid, nullable) - Optional foreign key to tcCitas
      - id_signo_vital (uuid) - Foreign key to tcSignosVitales catalog
      - valor_medido (decimal) - The measured value
      - fecha_hora (timestamptz) - Date and time of measurement
      - metodo_usado (text) - Method or device used for measurement
      - notas (text) - Additional notes or observations
      - es_critico (boolean) - Flag indicating if value is in critical range
      - deleted_at (timestamptz) - Soft delete timestamp

  ## 2. Indexes
    - Composite index on (paciente_id, fecha_hora DESC) for patient history queries
    - Index on id_signo_vital for filtering by vital sign type
    - Index on id_cita for appointment-related queries
    - Index on idbu for business unit filtering
    - Index on user_id for audit purposes
    - Partial index on es_critico for quick access to critical readings

  ## 3. Constraints
    - Foreign key to tcPacientes with CASCADE delete
    - Foreign key to tcCitas with SET NULL (allows independent records)
    - Foreign key to tcSignosVitales with RESTRICT (prevent deletion of catalog items in use)
    - Check that valor_medido is non-negative
    - Check that deleted_at is null or after created_at

  ## 4. Security
    - Enable RLS on tpSignosVitales table
    - SELECT policy: users can view records from their business unit
    - INSERT policy: authenticated users can create records
    - UPDATE policy: users can update their own records
    - Soft delete support through deleted_at field

  ## 5. Triggers
    - Auto-update updated_at timestamp on record modification
    - Optional: trigger to set es_critico flag based on catalog ranges

  ## 6. Important Notes
    - id_cita is nullable to allow vital signs recording outside appointments
    - es_critico flag is for quick filtering and reporting of critical values
    - fecha_hora allows precise tracking for time-series analysis and graphing
    - Soft delete preserves historical data for auditing and trend analysis
    - Multiple vital signs can be recorded for the same patient at the same time
*/

CREATE TABLE IF NOT EXISTS "tpSignosVitales" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paciente_id uuid NOT NULL REFERENCES "tcPacientes"(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  idbu uuid NOT NULL,
  id_cita uuid REFERENCES "tcCitas"(id) ON DELETE SET NULL,
  id_signo_vital uuid NOT NULL REFERENCES "tcSignosVitales"(id) ON DELETE RESTRICT,
  valor_medido decimal(7,2) NOT NULL,
  fecha_hora timestamptz NOT NULL DEFAULT now(),
  metodo_usado text,
  notas text,
  es_critico boolean DEFAULT false,
  deleted_at timestamptz,
  
  CONSTRAINT valor_no_negativo CHECK (valor_medido >= 0),
  CONSTRAINT fecha_valida CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_paciente_fecha 
  ON "tpSignosVitales"(paciente_id, fecha_hora DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_signo_vital 
  ON "tpSignosVitales"(id_signo_vital) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_cita 
  ON "tpSignosVitales"(id_cita) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_idbu 
  ON "tpSignosVitales"(idbu) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_user 
  ON "tpSignosVitales"(user_id);

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_critico 
  ON "tpSignosVitales"(es_critico, fecha_hora DESC) WHERE es_critico = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tpSignosVitales_fecha_hora 
  ON "tpSignosVitales"(fecha_hora DESC) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS update_tpSignosVitales_updated_at ON "tpSignosVitales";
CREATE TRIGGER update_tpSignosVitales_updated_at 
  BEFORE UPDATE ON "tpSignosVitales"
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE "tpSignosVitales" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vital signs from their BU" ON "tpSignosVitales";
CREATE POLICY "Users can view vital signs from their BU"
  ON "tpSignosVitales"
  FOR SELECT
  TO authenticated
  USING (
    idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can insert vital signs records" ON "tpSignosVitales";
CREATE POLICY "Users can insert vital signs records"
  ON "tpSignosVitales"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their vital signs records" ON "tpSignosVitales";
CREATE POLICY "Users can update their vital signs records"
  ON "tpSignosVitales"
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can soft delete their records" ON "tpSignosVitales";
CREATE POLICY "Users can soft delete their records"
  ON "tpSignosVitales"
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (deleted_at IS NOT NULL);

COMMENT ON TABLE "tpSignosVitales" IS 'Registro histórico de signos vitales de pacientes con soporte para tendencias y alertas';
COMMENT ON COLUMN "tpSignosVitales".paciente_id IS 'Paciente al que pertenece esta medición';
COMMENT ON COLUMN "tpSignosVitales".id_cita IS 'Cita asociada (opcional) - permite registros independientes';
COMMENT ON COLUMN "tpSignosVitales".id_signo_vital IS 'Tipo de signo vital del catálogo';
COMMENT ON COLUMN "tpSignosVitales".valor_medido IS 'Valor medido del signo vital';
COMMENT ON COLUMN "tpSignosVitales".fecha_hora IS 'Fecha y hora exacta de la medición para análisis temporal';
COMMENT ON COLUMN "tpSignosVitales".es_critico IS 'Indica si el valor está en rango crítico según el catálogo';
COMMENT ON COLUMN "tpSignosVitales".deleted_at IS 'Fecha de eliminación lógica para preservar historial';