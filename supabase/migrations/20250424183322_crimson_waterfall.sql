/*
  # Add Additional Fields to tcCitas Table

  1. Changes
    - Add tipo_consulta field for appointment type
    - Add tiempo_evolucion fields for symptom duration
    - Add sintomas_asociados for tracking symptoms
    - Add documentos for file attachments
    - Add campos_adicionales for extra data

  2. Schema Updates
    - New enum for appointment types
    - JSON fields for flexible data storage
    - Proper constraints and defaults
*/

-- Add new fields to tcCitas table
ALTER TABLE "tcCitas" 
  ADD COLUMN IF NOT EXISTS tipo_consulta text NOT NULL DEFAULT 'primera' 
    CHECK (tipo_consulta IN ('primera', 'seguimiento', 'urgencia','revision', 'control')),
  ADD COLUMN IF NOT EXISTS tiempo_evolucion integer,
  ADD COLUMN IF NOT EXISTS unidad_tiempo text 
    CHECK (unidad_tiempo IN ('horas', 'dias', 'semanas', 'meses')),
  ADD COLUMN IF NOT EXISTS sintomas_asociados text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS campos_adicionales jsonb DEFAULT '{}';

-- Add index for tipo_consulta
CREATE INDEX IF NOT EXISTS idx_citas_tipo ON "tcCitas" (tipo_consulta);

-- Update RLS policy
DROP POLICY IF EXISTS "Users can manage their own appointments" ON "tcCitas";
CREATE POLICY "Users can manage their own appointments"
  ON "tcCitas"
  USING (auth.uid() = id_medico);