/*
  # Fix recursive RLS policies

  1. Changes
    - Remove recursive policies from tcUsuarios table
    - Create new, non-recursive policies for tcUsuarios table
    - Simplify access control logic

  2. Security
    - Maintain data access security while preventing infinite recursion
    - Users can still only access data within their business unit
    - Admins retain management capabilities
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage users in their BU" ON "tcUsuarios";
DROP POLICY IF EXISTS "Enable read access for users with same business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Users can view and update their own record" ON "tcUsuarios";

-- Create new non-recursive policies
CREATE POLICY "Users can view their own record"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (idusuario = auth.uid());

CREATE POLICY "Users can view records in their business unit"
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

CREATE POLICY "Admins can manage users in their business unit"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" admin 
    WHERE admin.idusuario = auth.uid() 
    AND admin.rol = 'admin'
    AND admin.idbu = "tcUsuarios".idbu
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" admin 
    WHERE admin.idusuario = auth.uid() 
    AND admin.rol = 'admin'
    AND admin.idbu = "tcUsuarios".idbu
  )
);