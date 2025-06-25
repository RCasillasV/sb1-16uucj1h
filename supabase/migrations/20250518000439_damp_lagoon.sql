/*
  # Fix Users Table Policies

  1. Changes
    - Add policy existence checks before creation
    - Keep consistent lowercase column names
    - Maintain same table structure and indexes
    
  2. Security
    - Maintain RLS enabled
    - Same policy rules for viewing and managing users
*/

CREATE TABLE IF NOT EXISTS "tcUsuarios" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idusuario uuid REFERENCES auth.users(id),
  idbu uuid NOT NULL,
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  rol text NOT NULL DEFAULT 'asistente' CHECK (rol IN ('admin', 'medico', 'asistente')),
  telefono text,
  fechaultimoacceso timestamptz,
  configuracion jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE "tcUsuarios" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view users in their business unit" ON "tcUsuarios";
  DROP POLICY IF EXISTS "Admins can manage users in their business unit" ON "tcUsuarios";
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Users can view users in their business unit"
  ON "tcUsuarios"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "tcUsuarios" viewer
      WHERE viewer.idusuario = auth.uid()
      AND viewer.idbu = "tcUsuarios".idbu
    )
  );

CREATE POLICY "Admins can manage users in their business unit"
  ON "tcUsuarios"
  USING (
    EXISTS (
      SELECT 1 FROM "tcUsuarios" admin
      WHERE admin.idusuario = auth.uid()
      AND admin.idbu = "tcUsuarios".idbu
      AND admin.rol = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_idbu ON "tcUsuarios"(idbu);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON "tcUsuarios"(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON "tcUsuarios"(rol);