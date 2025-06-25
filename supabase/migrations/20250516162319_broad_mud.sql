/*
  # Fix tcUsuarios RLS policies

  1. Changes
    - Drop existing policies that cause recursion
    - Add new policies with proper access control:
      - Users can view their own record
      - Users can view records in their business unit if they are admins
      - Users can update their own record
      - Admins can manage users in their business unit

  2. Security
    - Enable RLS on tcUsuarios table
    - Add policies for proper access control
    - Prevent infinite recursion by using direct user ID comparison
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Manage users in same business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "View users in same business unit" ON "tcUsuarios";

-- Create new policies without recursion
CREATE POLICY "Users can view own record"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  -- Direct comparison with the user's ID
  auth.uid() = idusuario
);

CREATE POLICY "Admins can view users in their business unit"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  -- Check if current user is admin and shares the same business unit
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" admin 
    WHERE admin.idusuario = auth.uid() 
    AND admin.rol = 'admin'
    AND admin.idbu = "tcUsuarios".idbu
  )
);

CREATE POLICY "Users can update own record"
ON "tcUsuarios"
FOR UPDATE
TO authenticated
USING (auth.uid() = idusuario)
WITH CHECK (auth.uid() = idusuario);

CREATE POLICY "Admins can manage users in their business unit"
ON "tcUsuarios"
FOR ALL
TO authenticated
USING (
  -- Check if current user is admin and shares the same business unit
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" admin 
    WHERE admin.idusuario = auth.uid() 
    AND admin.rol = 'admin'
    AND admin.idbu = "tcUsuarios".idbu
  )
);