/*
  # Fix appointments table relationship with tcPacientes

  1. Changes
    - Drop and recreate foreign key constraint with proper schema reference
    - Add proper indexes
    - Ensure table exists with correct column

  2. Schema Updates
    - Maintain existing data
    - Add proper relationship between tables
    - Fix schema reference issues
*/

-- First ensure the patient_id column exists and has the correct type
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'patient_id'
  ) THEN
    -- If id_paciente exists, rename it
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' 
      AND column_name = 'id_paciente'
    ) THEN
      ALTER TABLE appointments 
        RENAME COLUMN id_paciente TO patient_id;
    ELSE
      -- If neither column exists, create patient_id
      ALTER TABLE appointments 
        ADD COLUMN patient_id uuid;
    END IF;
  END IF;
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

-- Drop existing foreign key if it exists (old name)
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS appointments_id_paciente_fkey;

-- Add new foreign key constraint with explicit schema reference
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES public."tcPacientes"(id) 
  ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
  ON appointments(patient_id);