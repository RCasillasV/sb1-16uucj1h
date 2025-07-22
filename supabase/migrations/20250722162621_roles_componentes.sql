-- supabase/migrations/YYYYMMDDHHMMSS_create_tp_roles_componentes_table.sql

/*
  # Create tpRolesComponentes Table for Granular Permissions

  1. New Table
    - `tpRolesComponentes`: Stores permissions for roles to access specific components within a business unit.
      - `id` (UUID, PK): Unique identifier for the permission entry.
      - `id_rol` (TEXT): The role identifier (e.g., 'Administrador', 'Medico', 'Recepcionista').
      - `id_componente` (TEXT): A unique identifier for the component/screen (e.g., 'Dashboard', 'PatientsPage', 'ClinicalHistory').
      - `idBu` (UUID, FK to tcBu): The business unit to which this permission applies.
      - `permitido` (BOOLEAN): TRUE if the role has access to the component in that business unit, FALSE otherwise.
      - `created_at`, `updated_at` (TIMESTAMPTZ): Timestamps for creation and last update.

  2. Security
    - Enable RLS on the table.
    - Define policies for read, insert, update, and delete operations based on user roles and business units.

  3. Indexes
    - Add indexes for performance on frequently queried columns.
*/

CREATE TABLE IF NOT EXISTS tpRolesComponentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  id_rol text NOT NULL,
  id_componente text NOT NULL,
  idBu uuid NOT NULL REFERENCES "tcBu"("idBu") ON DELETE CASCADE,
  permitido boolean NOT NULL DEFAULT TRUE,
  CONSTRAINT unique_role_component_bu UNIQUE (id_rol, id_componente, idBu)
);

-- Enable RLS
ALTER TABLE tpRolesComponentes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow authenticated users to read permissions relevant to their business unit
CREATE POLICY "Users can read permissions for their business unit"
  ON tpRolesComponentes
  FOR SELECT
  TO authenticated
  USING (
    idBu IN (
      SELECT idbu
      FROM "tcUsuarios"
      WHERE idusuario = auth.uid()
    )
  );

-- Allow admins to insert new permissions within their business unit
CREATE POLICY "Admins can insert permissions"
  ON tpRolesComponentes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "tcUsuarios"
      WHERE idusuario = auth.uid()
      AND rol = 'Administrador' -- Assuming 'Administrador' is the admin role
      AND idbu = tpRolesComponentes.idBu
    )
  );

-- Allow admins to update permissions within their business unit
CREATE POLICY "Admins can update permissions"
  ON tpRolesComponentes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "tcUsuarios"
      WHERE idusuario = auth.uid()
      AND rol = 'Administrador' -- Assuming 'Administrador' is the admin role
      AND idbu = tpRolesComponentes.idBu
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "tcUsuarios"
      WHERE idusuario = auth.uid()
      AND rol = 'Administrador' -- Assuming 'Administrador' is the admin role
      AND idbu = tpRolesComponentes.idBu
    )
  );

-- Allow admins to delete permissions within their business unit
CREATE POLICY "Admins can delete permissions"
  ON tpRolesComponentes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "tcUsuarios"
      WHERE idusuario = auth.uid()
      AND rol = 'Administrador' -- Assuming 'Administrador' is the admin role
      AND idbu = tpRolesComponentes.idBu
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tprolescomponentes_id_rol ON tpRolesComponentes (id_rol);
CREATE INDEX IF NOT EXISTS idx_tprolescomponentes_id_componente ON tpRolesComponentes (id_componente);
CREATE INDEX IF NOT EXISTS idx_tprolescomponentes_idBu ON tpRolesComponentes (idBu);
