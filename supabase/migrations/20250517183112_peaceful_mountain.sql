/*
  # Fix User Policies and Add User Info Function

  1. Changes
    - Remove potentially recursive policies from tcUsuarios table
    - Add new stored procedure for safely fetching user info
    - Add new simplified policies for tcUsuarios table

  2. Security
    - Enable RLS on tcUsuarios table
    - Add safe policies for user data access
*/

-- First, drop any existing policies that might be causing recursion
DROP POLICY IF EXISTS "Selecciona Pacientes de Unidad de Negocio" ON "tcUsuarios";
DROP POLICY IF EXISTS "Users can view users in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Admins can manage users in their business unit" ON "tcUsuarios";
DROP POLICY IF EXISTS "Update own record" ON "tcUsuarios";
DROP POLICY IF EXISTS "View own record" ON "tcUsuarios";

-- Create a function to safely get user info without policy recursion
CREATE OR REPLACE FUNCTION get_user_info(user_id uuid)
RETURNS TABLE (
  idbu uuid,
  business_unit jsonb
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u."idBu",
    jsonb_build_object(
      'Nombre', b."Nombre"
    ) as business_unit
  FROM "tcUsuarios" u
  LEFT JOIN "tcBu" b ON b."idBu" = u."idBu"
  WHERE u.idusuario = user_id
  LIMIT 1;
END;
$$;

-- Add new simplified policies
ALTER TABLE "tcUsuarios" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own record"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  idusuario = auth.uid()
);

CREATE POLICY "Allow users to update their own record"
ON "tcUsuarios"
FOR UPDATE
TO authenticated
USING (idusuario = auth.uid())
WITH CHECK (idusuario = auth.uid());

CREATE POLICY "Allow admins to view users in their business unit"
ON "tcUsuarios"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM "tcUsuarios" admin 
    WHERE admin.idusuario = auth.uid() 
    AND admin."idBu" = "tcUsuarios"."idBu"
    AND admin.rol = 'admin'
  )
);