/*
  # Fix appointments and tcPacientes relationship

  1. Changes
    - Rename patient_id column to id_paciente to match tcPacientes
    - Add foreign key constraint to link appointments with tcPacientes
    - Update existing data to maintain integrity

  2. Schema Updates
    - Modify appointments table structure
    - Add proper foreign key relationship
*/

-- Rename column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE appointments RENAME COLUMN patient_id TO id_paciente;
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_id_paciente_fkey,
  ADD CONSTRAINT appointments_id_paciente_fkey 
  FOREIGN KEY (id_paciente) 
  REFERENCES "tcPacientes"(id) 
  ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_appointments_id_paciente 
  ON appointments(id_paciente);