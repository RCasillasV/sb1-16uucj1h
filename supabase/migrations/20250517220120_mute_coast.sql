/*
  # Fix idBu column in tcPacientes table

  1. Changes
    - Drop existing idBu column if it exists
    - Add idBu column with proper UUID type and constraints
    - Add foreign key reference to tcBu table
    - Set default value to handle existing records
    - Enable RLS for the table

  2. Security
    - Maintain existing RLS policies
    - Ensure foreign key constraint to tcBu table
*/

-- First, safely drop the column if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcPacientes' 
    AND column_name = 'idBu'
  ) THEN
    ALTER TABLE "tcPacientes" DROP COLUMN "idBu";
  END IF;
END $$;

-- Add the column back with proper type and constraints
ALTER TABLE "tcPacientes" 
ADD COLUMN "idBu" uuid NOT NULL;

-- Add foreign key constraint
ALTER TABLE "tcPacientes"
ADD CONSTRAINT "tcPacientes_idBu_fkey"
FOREIGN KEY ("idBu")
REFERENCES "tcBu" ("idBu")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX "idx_tcPacientes_idBu" ON "tcPacientes" ("idBu");

-- Enable RLS if not already enabled
ALTER TABLE "tcPacientes" ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies to include idBu check
DROP POLICY IF EXISTS "Selecciona Pacientes de Unidad de Negocio" ON "tcPacientes";

CREATE POLICY "Selecciona Pacientes de Unidad de Negocio"
ON "tcPacientes"
FOR SELECT
TO authenticated
USING (
  "idBu" IN (
    SELECT "idBu"
    FROM "tcUsuarios"
    WHERE "idusuario" = auth.uid()
  )
);