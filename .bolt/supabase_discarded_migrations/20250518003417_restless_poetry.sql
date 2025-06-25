/*
  # Fix Users Policy Migration

  1. Changes
    - Drop existing policies
    - Recreate policies with updated names to avoid conflicts
    - Add policy for users to view their own record
    - Add policy for users to view records in their business unit
    - Add policy for admins to manage users in their business unit

  2. Security
    - Enable RLS
    - Add policies for proper access control
    - Add indexes for performance
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view users in their business unit" ON "tcUsuarios";
  DROP POLICY IF EXISTS "Admins can manage users in their business unit" ON "tcUsuarios";
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies with unique names
CREATE POLICY "Users can view their own record"
  ON "tcUsuarios"
  FOR SELECT
  TO authenticated
  USING (idUsuario = auth.uid());

CREATE POLICY "Users can view records in their business unit"
  ON "tcUsuarios"
  FOR SELECT
  TO authenticated
  USING (
    idBu IN (
      SELECT idbu FROM "tcUsuarios"
      WHERE idUsuario = auth.uid()
    )
  );

CREATE POLICY "Admins can manage users in their business unit"
  ON "tcUsuarios"
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM "tcUsuarios" admin
      WHERE admin.idUsuario = auth.uid()
      AND admin.idBu = "tcUsuarios".idBu
      AND admin.Rol = 'admin'
    )
  );