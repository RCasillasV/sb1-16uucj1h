/*
  # Users Table Schema

  1. New Tables
    - `tcUsuarios`: Stores user information and business unit associations
      - `id` (uuid, primary key): Unique identifier
      - `idUsuario` (uuid): References auth.users
      - `idBu` (uuid): Business unit ID
      - `Nombre` (text): User's name
      - `Email` (text): Unique email address
      - `Estado` (text): User status (active/inactive)
      - `Rol` (text): User role (admin/medico/asistente)
      
  2. Security
    - Enables RLS
    - Adds policies for business unit-based access control
    
  3. Indexes
    - Business unit ID
    - Email
    - Role
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

-- Create indexes conditionally
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_idbu') THEN
    CREATE INDEX idx_usuarios_idbu ON "tcUsuarios"("idBu");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_email') THEN
    CREATE INDEX idx_usuarios_email ON "tcUsuarios"(Email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_rol') THEN
    CREATE INDEX idx_usuarios_rol ON "tcUsuarios"(Rol);
  END IF;
END $$;