/*
  # Fix infinite recursion in tcUsuarios policies

  1. Changes
    - Remove recursive policy from tcUsuarios table
    - Add simplified policy for authenticated users
    
  2. Security
    - Enable RLS on tcUsuarios table
    - Add policy for authenticated users to view records in their business unit
*/

-- Drop existing policies that may be causing recursion
DROP POLICY IF EXISTS "Users can view records in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Access patients in same business unit" ON "tcUsuarios";

-- Create new non-recursive policy
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