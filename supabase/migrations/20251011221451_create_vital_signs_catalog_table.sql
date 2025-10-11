/*
  # Create Vital Signs Catalog Table (tcSignosVitales)

  ## Summary
  Creates a configurable catalog for vital signs that allows healthcare providers to define
  different types of vital signs with their normal ranges, critical values, and measurement
  specifications based on patient age and sex.

  ## 1. New Tables
    - tcSignosVitales (Vital Signs Catalog)
      - id (uuid, primary key) - Unique identifier
      - created_at (timestamptz) - Record creation timestamp
      - updated_at (timestamptz) - Last update timestamp
      - idbu (uuid) - Business unit identifier
      - Descripcion (text) - Vital sign description/name
      - Unidad (text) - Unit of measurement
      - sexo (text) - Applicable sex: M, F, or AMBOS
      - edad_minima (integer) - Minimum age in months for this range
      - edad_maxima (integer) - Maximum age in months for this range
      - valor_minimo_normal (decimal) - Minimum normal value
      - valor_maximo_normal (decimal) - Maximum normal value
      - valor_critico_bajo (decimal) - Critical low threshold
      - valor_critico_alto (decimal) - Critical high threshold
      - frecuencia_registro (text) - Recommended recording frequency
      - metodo_medicion (text) - Measurement method/device
      - activo (boolean) - Whether this vital sign is active
      - id_usuario (uuid) - User who created/updated the record

  ## 2. Security
    - Enable RLS on tcSignosVitales table
    - Policies for authenticated users based on business unit

  ## 3. Important Notes
    - Age ranges are in months for consistency with pediatric records
    - Multiple ranges can exist for the same vital sign with different age groups
    - Critical values help identify emergency situations
*/

CREATE TABLE IF NOT EXISTS "tcSignosVitales" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  idbu uuid NOT NULL,
  "Descripcion" text NOT NULL,
  "Unidad" text NOT NULL,
  sexo text NOT NULL DEFAULT 'AMBOS',
  edad_minima integer NOT NULL DEFAULT 0,
  edad_maxima integer NOT NULL DEFAULT 1200,
  valor_minimo_normal decimal(7,2) NOT NULL,
  valor_maximo_normal decimal(7,2) NOT NULL,
  valor_critico_bajo decimal(7,2),
  valor_critico_alto decimal(7,2),
  frecuencia_registro text,
  metodo_medicion text,
  activo boolean NOT NULL DEFAULT true,
  id_usuario uuid REFERENCES auth.users(id),
  
  CONSTRAINT sexo_valido CHECK (sexo IN ('M', 'F', 'AMBOS')),
  CONSTRAINT edad_valida CHECK (edad_minima <= edad_maxima),
  CONSTRAINT edad_no_negativa CHECK (edad_minima >= 0 AND edad_maxima >= 0),
  CONSTRAINT rangos_normales_validos CHECK (valor_minimo_normal < valor_maximo_normal),
  CONSTRAINT valores_no_negativos CHECK (valor_minimo_normal >= 0 AND valor_maximo_normal >= 0),
  CONSTRAINT critico_bajo_valido CHECK (valor_critico_bajo IS NULL OR valor_critico_bajo < valor_minimo_normal),
  CONSTRAINT critico_alto_valido CHECK (valor_critico_alto IS NULL OR valor_critico_alto > valor_maximo_normal)
);

CREATE INDEX IF NOT EXISTS idx_tcSignosVitales_idbu_activo ON "tcSignosVitales"(idbu, activo);
CREATE INDEX IF NOT EXISTS idx_tcSignosVitales_sexo ON "tcSignosVitales"(sexo);
CREATE INDEX IF NOT EXISTS idx_tcSignosVitales_edad_rango ON "tcSignosVitales"(edad_minima, edad_maxima);
CREATE INDEX IF NOT EXISTS idx_tcSignosVitales_descripcion ON "tcSignosVitales"("Descripcion");
CREATE INDEX IF NOT EXISTS idx_tcSignosVitales_usuario ON "tcSignosVitales"(id_usuario);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tcSignosVitales_updated_at ON "tcSignosVitales";
CREATE TRIGGER update_tcSignosVitales_updated_at 
  BEFORE UPDATE ON "tcSignosVitales"
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE "tcSignosVitales" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vital signs from their BU" ON "tcSignosVitales";
CREATE POLICY "Users can view vital signs from their BU"
  ON "tcSignosVitales"
  FOR SELECT
  TO authenticated
  USING (
    idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create vital signs" ON "tcSignosVitales";
CREATE POLICY "Users can create vital signs"
  ON "tcSignosVitales"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
    AND id_usuario = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update vital signs from their BU" ON "tcSignosVitales";
CREATE POLICY "Users can update vital signs from their BU"
  ON "tcSignosVitales"
  FOR UPDATE
  TO authenticated
  USING (
    idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
  )
  WITH CHECK (
    idbu IN (
      SELECT idbu 
      FROM "tcUsuarios" 
      WHERE idusuario = auth.uid()
    )
  );

COMMENT ON TABLE "tcSignosVitales" IS 'Catálogo configurable de signos vitales con rangos normales y críticos por edad y sexo';