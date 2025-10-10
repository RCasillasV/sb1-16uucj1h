/*
  # Add Missing Fields to Gyneco-Obstetric History Table

  1. Changes
    - Add `embarazo_actual` column (boolean) - Indicates if patient is currently pregnant
    - Add `ivsa` column (integer) - Age when sexual activity started (Inicio de Vida Sexual Activa)
    - Add `fecha_menopausia` column (date) - Date when patient entered menopause

  2. Details
    - All fields are nullable/optional to maintain backward compatibility
    - No default values set to allow NULL for existing records
    - Fields support the complete gyneco-obstetric history capture

  3. Security
    - Existing RLS policies automatically apply to new columns
    - No additional security changes needed
*/

-- Add embarazo_actual column (currently pregnant indicator)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tpPacienteHistGineObst'
    AND column_name = 'embarazo_actual'
  ) THEN
    ALTER TABLE public."tpPacienteHistGineObst"
    ADD COLUMN embarazo_actual boolean;
  END IF;
END $$;

-- Add ivsa column (age of first sexual activity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tpPacienteHistGineObst'
    AND column_name = 'ivsa'
  ) THEN
    ALTER TABLE public."tpPacienteHistGineObst"
    ADD COLUMN ivsa integer;
  END IF;
END $$;

-- Add fecha_menopausia column (menopause date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tpPacienteHistGineObst'
    AND column_name = 'fecha_menopausia'
  ) THEN
    ALTER TABLE public."tpPacienteHistGineObst"
    ADD COLUMN fecha_menopausia date;
  END IF;
END $$;

-- Add comments for the new columns
COMMENT ON COLUMN public."tpPacienteHistGineObst".embarazo_actual IS 'Indica si la paciente está actualmente embarazada';
COMMENT ON COLUMN public."tpPacienteHistGineObst".ivsa IS 'Edad de inicio de vida sexual activa (años)';
COMMENT ON COLUMN public."tpPacienteHistGineObst".fecha_menopausia IS 'Fecha en que la paciente entró en menopausia';
