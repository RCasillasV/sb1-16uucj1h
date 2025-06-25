/*
  # Initial Medical CRM Schema

  1. New Tables
    - `patients`
      - Basic patient information
      - Contact details
      - Medical history reference
    - `medical_records`
      - Detailed medical history
      - Linked to patients
    - `appointments`
      - Scheduling information
      - Patient and status tracking

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated access
*/

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  Nombre text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  email text,
  phone text,
  address text,
  emergency_contact text,
  blood_type text,
  allergies text[],
  user_id uuid REFERENCES auth.users(id)
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL,
  diagnosis text NOT NULL,
  treatment text,
  prescription text,
  notes text,
  user_id uuid REFERENCES auth.users(id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  reason text NOT NULL,
  notes text,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own patients"
  ON patients
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their patients' medical records"
  ON medical_records
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their patients' appointments"
  ON appointments
  USING (auth.uid() = user_id);