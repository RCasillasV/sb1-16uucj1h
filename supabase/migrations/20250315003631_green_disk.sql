/*
  # Add Patient Images Support

  1. New Tables
    - `patient_images`
      - Stores metadata about patient images
      - Links to patients
      - Includes description and Google Drive file ID

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS patient_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  description text NOT NULL,
  drive_file_id text NOT NULL,
  thumbnail_url text,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png')),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE patient_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their patients' images"
  ON patient_images
  USING (auth.uid() = user_id);