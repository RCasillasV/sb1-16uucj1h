/*
  # Users Table Migration
  
  1. New Tables
    - tcUsuarios: Stores user information and permissions
      - id (uuid, primary key)
      - created_at (timestamptz)
      - updated_at (timestamptz) 
      - idUsuario (uuid, references auth.users)
      - idBu (uuid, not null)
      - Nombre (text, not null)
      - Email (text, not null, unique)
      - Estado (text, not null)
      - Rol (text, not null)
      - Telefono (text)
      - FechaUltimoAcceso (timestamptz)
      - Configuracion (jsonb)

  2. Security
    - Enable RLS
    - Add policies for viewing and managing users within business units
    
  3. Indexes
    - Create indexes on frequently queried columns
*/

CREATE TABLE IF NOT EXISTS "tcUsuarios" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idUsuario uuid REFERENCES auth.users(id),
  "idBu" uuid NOT NULL,
  Nombre text NOT NULL,
  Email text NOT NULL UNIQUE,
  Estado text NOT NULL DEFAULT 'activo' CHECK (Estado IN ('activo', 'inactivo')),
  Rol text NOT NULL DEFAULT 'asistente' CHECK (Rol IN ('admin', 'medico', 'asistente')),
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
      AND viewer."idBu" = "tcUsuarios"."idBu"
    )
  );

CREATE POLICY "Admins can manage users in their business unit"
  ON "tcUsuarios"
  USING (
    EXISTS (
      SELECT 1 FROM "tcUsuarios" admin
      WHERE admin.idUsuario = auth.uid()
      AND admin."idBu" = "tcUsuarios"."idBu"
      AND admin.Rol = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_usuarios_idbu ON "tcUsuarios"("idBu");
CREATE INDEX idx_usuarios_email ON "tcUsuarios"(Email);
CREATE INDEX idx_usuarios_rol ON "tcUsuarios"(Rol);