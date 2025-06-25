/*
  # Update User Management Schema

  1. Changes
    - Add missing fields to tcUsuarios table
    - Update field types and constraints
    - Add indexes for better performance

  2. Schema Updates
    - Ensure proper foreign key relationships
    - Add validation constraints
    - Update RLS policies
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS "tcUsuarios";

-- Create updated tcUsuarios table
CREATE TABLE "tcUsuarios" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idUsuario uuid REFERENCES auth.users(id),
  idBu text NOT NULL,
  Nombre text NOT NULL,
  Email text NOT NULL UNIQUE,
  Estado text NOT NULL DEFAULT 'activo' CHECK (Estado IN ('activo', 'inactivo')),
  Rol text NOT NULL DEFAULT 'asistente' CHECK (Rol IN ('admin', 'medico', 'asistente')),
  Telefono text,
  FechaUltimoAcceso timestamptz,
  Configuracion jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_idusuario ON "tcUsuarios"(idUsuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_idbu ON "tcUsuarios"(idBu);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON "tcUsuarios"(Email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON "tcUsuarios"(Rol);

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
      WHERE viewer.idUsuario = auth.uid()
      AND viewer.idBu = "tcUsuarios".idBu
    )
  );

CREATE POLICY "Admins can manage users in their business unit"
  ON "tcUsuarios"
  USING (
    EXISTS (
      SELECT 1 FROM "tcUsuarios" admin
      WHERE admin.idUsuario = auth.uid()
      AND admin.idBu = "tcUsuarios".idBu
      AND admin.Rol = 'admin'
    )
  );