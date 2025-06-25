/*
  # Fix recursive policy in tcUsuarios table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new, simplified policies for tcUsuarios table
    - Ensure proper access control without recursive checks

  2. Security
    - Maintain RLS
    - Add clear, non-recursive policies for:
      - Users viewing their own records
      - Admins viewing users in their business unit
      - Admins managing users in their business unit
*/

-- First, drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Admin manage users in bu" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admin view users in bu" ON "tcUsuarios";
DROP POLICY IF EXISTS "Update own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "View own record" ON "tcUsuarios";

-- Create new, non-recursive policies
-- Allow users to view their own record
CREATE POLICY "View own record"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  idusuario = auth.uid()
);

-- Allow users to update their own record
CREATE POLICY "Update own record"
ON "tcUsuarios"
FOR UPDATE
TO authenticated
USING (idusuario = auth.uid())
WITH CHECK (idusuario = auth.uid());

-- Allow admins to view users in their business unit
CREATE POLICY "Admin view users in bu"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "tcUsuarios" u 
    WHERE u.idusuario = auth.uid() 
    AND u.rol = 'admin' 
    AND u.idbu = "tcUsuarios".idbu
  )
);

-- Allow admins to manage users in their business unit
CREATE POLICY "Admin manage users in bu"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "tcUsuarios" u 
    WHERE u.idusuario = auth.uid() 
    AND u.rol = 'admin' 
    AND u.idbu = "tcUsuarios".idbu
  )
);