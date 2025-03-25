/*
  # Add Clinical Evolution Table

  1. New Tables
    - `clinical_evolution`
      - Tracks patient's clinical evolution over time
      - Similar structure to clinical_histories
      - Links to patients table

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

-- Drop the table if it exists to ensure a clean state
DROP TABLE IF EXISTS clinical_evolution;

-- Create the table with the correct schema
CREATE TABLE clinical_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  evolution_text text NOT NULL,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE clinical_evolution ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their patients' clinical evolution"
  ON clinical_evolution
  USING (auth.uid() = user_id);