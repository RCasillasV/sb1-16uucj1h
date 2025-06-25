/*
  # Fix appointments table relationship with tcPacientes

  1. Changes
    - Rename id_paciente column to patient_id
    - Update foreign key constraint
    - Add proper indexes

  2. Schema Updates
    - Maintain existing data
    - Add proper relationship between tables
*/

-- Rename column from id_paciente to patient_id
ALTER TABLE appointments 
  RENAME COLUMN id_paciente TO patient_id;

-- Drop existing foreign key if it exists
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS appointments_id_paciente_fkey;

-- Add new foreign key constraint
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES "tcPacientes"(id) 
  ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
  ON appointments(patient_id);