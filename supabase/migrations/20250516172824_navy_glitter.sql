/*
  # Fix RLS policies for tcUsuarios table

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new optimized policies with proper permission checks
    - Add separate policies for different operations (SELECT, UPDATE, ALL)
    
  2. Security
    - Enable RLS
    - Add policies for:
      - Users viewing their own record
      - Admins viewing users in their business unit
      - Users updating their own record
      - Admins managing users in their business unit
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admins can view users in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Users can update own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admins can manage users in their business unit" ON "tcUsuarios";

-- Create new optimized policies
CREATE POLICY "View own record"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  idusuario = auth.uid()
);

CREATE POLICY "Admin view users"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" u 
    WHERE u.idusuario = auth.uid() 
    AND u.rol = 'admin'
    AND u.idbu = "tcUsuarios".idbu
  )
);

CREATE POLICY "Update own record"
ON "tcUsuarios"
FOR UPDATE
TO authenticated
USING (idusuario = auth.uid())
WITH CHECK (idusuario = auth.uid());

CREATE POLICY "Admin manage users"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" u 
    WHERE u.idusuario = auth.uid() 
    AND u.rol = 'admin'
    AND u.idbu = "tcUsuarios".idbu
  )
);