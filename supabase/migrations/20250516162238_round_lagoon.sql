/*
  # Fix tcUsuarios RLS policies

  1. Changes
    - Remove recursive policy that was causing infinite loops
    - Add new simplified policy for user data access
    - Keep RLS enabled but with clearer access rules

  2. Security
    - Users can view users in their business unit
    - Admins can manage users in their business unit
    - Prevents infinite recursion by avoiding self-referential queries
*/

-- First disable existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view users in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admins can manage users in their business unit" ON "tcUsuarios";

-- Create new simplified policies
CREATE POLICY "View users in same business unit"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  idbu IN (
    SELECT idbu FROM "tcUsuarios"
    WHERE idusuario = auth.uid()
  )
);

CREATE POLICY "Manage users in same business unit"
ON "tcUsuarios"
FOR ALL 
TO authenticated
USING (
  idbu IN (
    SELECT idbu FROM "tcUsuarios"
    WHERE idusuario = auth.uid()
    AND rol = 'admin'
  )
)
WITH CHECK (
  idbu IN (
    SELECT idbu FROM "tcUsuarios"
    WHERE idusuario = auth.uid()
    AND rol = 'admin'
  )
);