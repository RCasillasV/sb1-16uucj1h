/*
  # Add Somatometry Tables

  1. New Tables
    - `somatometry_records`
      - Basic somatometry information
      - Links to patients
      - Tracks measurements over time

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS somatometry_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  patient_id uuid REFERENCES "tcPacientes"(id) ON DELETE CASCADE,
  measurement_date date NOT NULL,
  weight numeric(5,2) NOT NULL, -- in kg, allows 999.99
  height numeric(5,2) NOT NULL, -- in cm, allows 999.99
  head_circumference numeric(4,1), -- in cm, allows 99.9
  bmi numeric(4,1), -- calculated field
  age_months integer NOT NULL,
  notes text,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE somatometry_records ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their patients' somatometry records"
  ON somatometry_records
  USING (auth.uid() = user_id);