/*
  # Fix user table columns

  1. Changes
    - Rename Email column to email (lowercase)
    - Add missing columns
    - Add proper constraints
    - Update RLS policies
*/

-- Rename Email to email if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcUsuarios' AND column_name = 'Email'
  ) THEN
    ALTER TABLE "tcUsuarios" RENAME COLUMN "Email" TO "email";
  END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcUsuarios' AND column_name = 'email'
  ) THEN
    ALTER TABLE "tcUsuarios" ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcUsuarios' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE "tcUsuarios" ADD COLUMN nombre text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcUsuarios' AND column_name = 'estado'
  ) THEN
    ALTER TABLE "tcUsuarios" ADD COLUMN estado text DEFAULT 'activo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcUsuarios' AND column_name = 'rol'
  ) THEN
    ALTER TABLE "tcUsuarios" ADD COLUMN rol text DEFAULT 'asistente';
  END IF;
END $$;

-- Add NOT NULL constraints
ALTER TABLE "tcUsuarios" 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN nombre SET NOT NULL,
  ALTER COLUMN estado SET NOT NULL,
  ALTER COLUMN rol SET NOT NULL;

-- Add unique constraint on email
ALTER TABLE "tcUsuarios" ADD CONSTRAINT tcUsuarios_email_key UNIQUE (email);

-- Update RLS policies
ALTER TABLE "tcUsuarios" ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own data
CREATE POLICY "Users can view own data" ON "tcUsuarios"
  FOR SELECT TO authenticated
  USING (auth.uid() = idusuario);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON "tcUsuarios"
  FOR UPDATE TO authenticated
  USING (auth.uid() = idusuario)
  WITH CHECK (auth.uid() = idusuario);