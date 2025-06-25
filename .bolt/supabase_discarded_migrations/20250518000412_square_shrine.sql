/*
  # Fix Users Table and Policies
  
  1. Changes
    - Fix case sensitivity in column references
    - Ensure consistent casing for "idbu" column
    - Update policies to use correct column names
    
  2. Security
    - Enable RLS
    - Add policies for viewing and managing users
    - Maintain business unit isolation
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
CREATE INDEX idx_usuarios_idbu ON "tcUsuarios"(idbu);
CREATE INDEX idx_usuarios_email ON "tcUsuarios"(email);
CREATE INDEX idx_usuarios_rol ON "tcUsuarios"(rol);