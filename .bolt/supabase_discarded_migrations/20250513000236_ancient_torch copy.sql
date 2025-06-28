/*
  # User Management Schema

  1. New Tables
    - `tcUsuarios`
      - Basic user information
      - Links to business units
      - Role-based access control
      - Status tracking

  2. Security
    - Enable RLS
    - Add policies for access control
*/

CREATE TABLE IF NOT EXISTS "tcUsuarios" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idUsuario uuid REFERENCES auth.users(id),
  idBu uuid NOT NULL,
  Nombre text NOT NULL,
  Email text NOT NULL UNIQUE,
  Estado text NOT NULL DEFAULT 'Activo' CHECK (Estado IN ('Activo', 'Inactivo')),
  Rol text NOT NULL DEFAULT 'Asistente' CHECK (Rol IN ('Administrador', 'Medico', 'Recepcionista')),
  Telefono text,
  FechaUltimoAcceso timestamptz,
  Configuracion jsonb DEFAULT '{}'::jsonb
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
      AND admin.Rol = 'Administrador'
    )
  );

-- Create indexes
CREATE INDEX idx_usuarios_idbu ON "tcUsuarios"(idBu);
CREATE INDEX idx_usuarios_email ON "tcUsuarios"(Email);
CREATE INDEX idx_usuarios_rol ON "tcUsuarios"(Rol);