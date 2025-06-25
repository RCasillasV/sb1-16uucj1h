/*
  # Fix tcUsuarios table policies

  1. Changes
    - Drop existing policies that may be causing recursion
    - Create new, simplified policies for tcUsuarios table:
      - Users can view their own record
      - Admins can view users in their business unit
      - Users can update their own record
      - Admins can manage users in their business unit

  2. Security
    - Maintains RLS enabled
    - Ensures proper access control without recursion
    - Preserves business unit isolation
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Admin manage users" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admin view users" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admins pueden ver a sus usuarios de Bu" ON "tcUsuarios";
DROP POLICY IF EXISTS "Update own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "View own record" ON "tcUsuarios";

-- Create new, simplified policies
-- 1. Users can view their own record
CREATE POLICY "View own record"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  idusuario = auth.uid()
);

-- 2. Users can update their own record
CREATE POLICY "Update own record"
ON "tcUsuarios"
FOR UPDATE
TO authenticated
USING (idusuario = auth.uid())
WITH CHECK (idusuario = auth.uid());

-- 3. Admins can view users in their business unit
CREATE POLICY "Admin view users in bu"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "tcUsuarios" admin
    WHERE admin.idusuario = auth.uid()
    AND admin.rol = 'admin'
    AND admin.idbu = "tcUsuarios".idbu
  )
);

-- 4. Admins can manage users in their business unit
CREATE POLICY "Admin manage users in bu"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "tcUsuarios" admin
    WHERE admin.idusuario = auth.uid()
    AND admin.rol = 'admin'
    AND admin.idbu = "tcUsuarios".idbu
  )
);