/*
  # Add Clinical Evolution Table

  1. New Tables
    - `clinical_evolution`
      - Tracks patient's clinical evolution over time
      - Links to patients table
      - Stores evolution text and timestamps

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

-- Create the clinical evolution table
CREATE TABLE IF NOT EXISTS clinical_evolution (
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