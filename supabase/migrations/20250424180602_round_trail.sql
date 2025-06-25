/*
  # Add Appointments Table

  1. New Tables
    - `tcCitas`
      - Basic appointment information
      - Links to patients and doctors
      - Tracks status and dates

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS "tcCitas" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  id_paciente uuid REFERENCES "tcPacientes"(id) ON DELETE CASCADE,
  id_medico uuid REFERENCES auth.users(id),
  fecha_cita date NOT NULL,
  hora_cita time NOT NULL,
  motivo text NOT NULL,
  estado text NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
  notas text,
  urgente boolean DEFAULT false,
  consultorio integer NOT NULL CHECK (consultorio BETWEEN 1 AND 3),
  sintomas text[] DEFAULT '{}',
  documentos jsonb DEFAULT '[]'
);

-- Enable RLS
ALTER TABLE "tcCitas" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can manage their own appointments"
  ON "tcCitas"
  USING (auth.uid() = id_medico);

-- Create index for better query performance
CREATE INDEX idx_citas_fecha ON "tcCitas" (fecha_cita);
CREATE INDEX idx_citas_medico ON "tcCitas" (id_medico);
CREATE INDEX idx_citas_paciente ON "tcCitas" (id_paciente);