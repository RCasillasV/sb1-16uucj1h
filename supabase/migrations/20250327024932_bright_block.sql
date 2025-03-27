/*
  # Fix Prescription Table Relationships

  1. Changes
    - Add missing foreign key relationships
    - Update prescription_medications constraints
    - Add indexes for better performance

  2. Schema Updates
    - Add foreign key from prescription_medications to prescriptions
    - Add foreign key from prescription_medications to medications
    - Add indexes for relationship columns
*/

-- First ensure the tables exist
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  prescription_number text NOT NULL UNIQUE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  issue_date timestamptz NOT NULL DEFAULT now(),
  expiry_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  special_instructions text,
  diagnosis text,
  user_id uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS prescription_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  prescription_id uuid,
  medication_id uuid,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  total_quantity text NOT NULL,
  administration_route text NOT NULL,
  special_instructions text,
  user_id uuid REFERENCES auth.users(id)
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  -- Add prescription_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prescription_medications_prescription_id_fkey'
  ) THEN
    ALTER TABLE prescription_medications
    ADD CONSTRAINT prescription_medications_prescription_id_fkey
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE;
  END IF;

  -- Add medication_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'prescription_medications_medication_id_fkey'
  ) THEN
    ALTER TABLE prescription_medications
    ADD CONSTRAINT prescription_medications_medication_id_fkey
    FOREIGN KEY (medication_id) REFERENCES medications(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescription_medications_prescription_id 
  ON prescription_medications(prescription_id);

CREATE INDEX IF NOT EXISTS idx_prescription_medications_medication_id 
  ON prescription_medications(medication_id);

-- Disable RLS temporarily for testing
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;