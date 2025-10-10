/*
  # Add FPP (Fecha Probable de Parto) to Gyneco-Obstetric History

  1. Changes
    - Add `fpp` column (date) - Estimated Due Date calculated using Naegele's Rule
    
  2. Details
    - Field is nullable to support patients who are not currently pregnant
    - FPP is calculated as: FUM + 7 days - 3 months + 1 year
    - Only populated when patient is marked as currently pregnant (embarazo_actual = true)
    - Field supports proper pregnancy tracking and clinical decision making
    
  3. Security
    - Existing RLS policies automatically apply to new column
    - No additional security changes needed
*/

-- Add fpp column (Fecha Probable de Parto / Estimated Due Date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tpPacienteHistGineObst'
    AND column_name = 'fpp'
  ) THEN
    ALTER TABLE public."tpPacienteHistGineObst"
    ADD COLUMN fpp date;
  END IF;
END $$;

-- Add comment for the new column
COMMENT ON COLUMN public."tpPacienteHistGineObst".fpp IS 'Fecha Probable de Parto calculada mediante Regla de Naegele (FUM + 7 días - 3 meses + 1 año). Solo aplica cuando embarazo_actual es verdadero.';