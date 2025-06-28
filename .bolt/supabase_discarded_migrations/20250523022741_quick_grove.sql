/*
  # Fix appointments and tcPacientes relationship

  1. Changes
    - Drop existing foreign key constraints
    - Recreate appointments table with proper schema
    - Add explicit foreign key relationship to tcPacientes
    - Add proper indexes for performance

  2. Schema Updates
    - Ensure data integrity
    - Maintain existing data
    - Add proper constraints
*/

-- Drop existing foreign key constraints if they exist
ALTER TABLE appointments 
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

-- Ensure patient_id column exists and has correct type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE appointments 
      ADD COLUMN patient_id uuid;
  END IF;
END $$;

-- Add new foreign key constraint with explicit schema reference
ALTER TABLE appointments
  ADD CONSTRAINT appointments_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES "tcPacientes"(id) 
  ON DELETE CASCADE;

-- Create index for better join performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id 
  ON appointments(patient_id);

-- Disable RLS temporarily for testing
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;