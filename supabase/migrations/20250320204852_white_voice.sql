/*
  # Add Prescriptions Schema

  1. New Tables
    - `prescriptions`
      - Basic prescription information
      - Links to patients and doctors
      - Tracks status and dates
    - `prescription_medications`
      - Details for each medication in a prescription
      - Dosage, frequency, and administration details
    - `medications`
      - Catalog of available medications
      - Basic drug information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Medications catalog
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  concentration text NOT NULL,
  presentation text NOT NULL,
  active_compound text NOT NULL,
  contraindications text,
  side_effects text,
  user_id uuid REFERENCES auth.users(id)
);

-- Main prescriptions table
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

-- Prescription medications (junction table with additional fields)
CREATE TABLE IF NOT EXISTS prescription_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id),
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  total_quantity text NOT NULL,
  administration_route text NOT NULL,
  special_instructions text,
  user_id uuid REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_medications_prescription ON prescription_medications(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage medications"
  ON medications
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage prescriptions"
  ON prescriptions
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage prescription medications"
  ON prescription_medications
  USING (auth.uid() = user_id);

-- Function to automatically update expiry date
CREATE OR REPLACE FUNCTION set_prescription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiry date to 30 days from issue date by default
  NEW.expiry_date := NEW.issue_date + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expiry date on prescription creation
CREATE TRIGGER set_prescription_expiry_trigger
  BEFORE INSERT ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_prescription_expiry();

-- Function to update prescription status based on expiry date
CREATE OR REPLACE FUNCTION update_prescription_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date < NOW() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update status when expiry date is reached
CREATE TRIGGER update_prescription_status_trigger
  BEFORE UPDATE ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_status();