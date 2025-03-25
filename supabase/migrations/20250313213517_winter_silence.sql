/*
  # Add Clinical History Table

  1. New Tables
    - `clinical_histories`
      - Basic clinical history information
      - Linked to patients
      - Stores detailed medical background

  2. Security
    - Enable RLS
    - Policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS clinical_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  history_text text NOT NULL,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE clinical_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their patients' clinical histories"
  ON clinical_histories
  USING (auth.uid() = user_id);