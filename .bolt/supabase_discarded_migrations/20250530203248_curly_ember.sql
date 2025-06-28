/*
  # Create Postal Codes Table

  1. New Tables
    - `tcCodigosPostales`: Stores Mexican postal code data
      - Basic postal code information
      - Colony, city and state data
      - Links to business units

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

CREATE TABLE IF NOT EXISTS "tcCodigosPostales" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  d_codigo text NOT NULL,
  d_asenta text NOT NULL,
  d_tipo_asenta text,
  d_mnpio text NOT NULL,
  d_estado text NOT NULL,
  d_ciudad text,
  d_CP text,
  c_estado text,
  c_oficina text,
  c_CP text,
  c_tipo_asenta text,
  c_mnpio text,
  id_asenta_cpcons text,
  d_zona text,
  c_cve_ciudad text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_codigos_postales_codigo ON "tcCodigosPostales"(d_codigo);
CREATE INDEX IF NOT EXISTS idx_codigos_postales_estado ON "tcCodigosPostales"(d_estado);
CREATE INDEX IF NOT EXISTS idx_codigos_postales_municipio ON "tcCodigosPostales"(d_mnpio);

-- Enable RLS
ALTER TABLE "tcCodigosPostales" ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to read postal codes"
  ON "tcCodigosPostales"
  FOR SELECT
  TO authenticated
  USING (true);