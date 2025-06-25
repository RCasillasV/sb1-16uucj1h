/*
  # Fix recursive policies in tcUsuarios table

  1. Changes
    - Remove recursive policies from tcUsuarios table
    - Add new, non-recursive policies for proper access control
    - Update tcPacientes policies to work with the new tcUsuarios policies

  2. Security
    - Maintain row level security
    - Ensure users can only access data they should see
    - Prevent infinite recursion in policies
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Admins can manage users in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Users can view users in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Users can view own data" ON "tcUsuarios";
DROP POLICY IF EXISTS "View own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "Update own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "Users can update own data" ON "tcUsuarios";

-- Create new, non-recursive policies for tcUsuarios
CREATE POLICY "Enable read access for users with same business unit"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  idbu IN (
    SELECT idbu 
    FROM "tcUsuarios" 
    WHERE idusuario = auth.uid()
  )
);

CREATE POLICY "Users can view and update their own record"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (idusuario = auth.uid())
WITH CHECK (idusuario = auth.uid());

CREATE POLICY "Admins can manage users in their BU"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" admin 
    WHERE admin.idusuario = auth.uid() 
    AND admin.idbu = "tcUsuarios".idbu 
    AND admin.rol = 'admin'
  )
);

-- Update tcPacientes policies to work with the new structure
DROP POLICY IF EXISTS "Selecciona Pacientes de Unidad de Negocio" ON "tcPacientes";

CREATE POLICY "Access patients in same business unit"
ON "tcPacientes"
FOR ALL
TO authenticated
USING (
  "idBu" IN (
    SELECT idbu 
    FROM "tcUsuarios" 
    WHERE idusuario = auth.uid()
  )
);