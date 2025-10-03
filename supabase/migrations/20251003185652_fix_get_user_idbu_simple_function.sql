/*
  # Fix get_user_idbu_simple Function Column Name

  1. Problem
    - Function was trying to SELECT "idBu" (mixed case) from tcUsuarios
    - But tcUsuarios actually has column "idbu" (lowercase)
    - This caused RLS policies to fail on tcActividadReciente table
    - Result: 404 error when trying to query activity records

  2. Solution
    - Update function to use correct column name "idbu" (lowercase)
    - Match the actual column name in tcUsuarios table
    - Ensures RLS policies work correctly

  3. Impact
    - Fixes activity tracking queries
    - Resolves "relation does not exist" error
    - RLS policies can now properly filter by business unit
*/

-- Fix the get_user_idbu_simple() function to use correct column name
CREATE OR REPLACE FUNCTION public.get_user_idbu_simple()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_idbu uuid;
BEGIN
  -- Use lowercase idbu to match actual column in tcUsuarios
  SELECT idbu INTO user_idbu
  FROM "tcUsuarios"
  WHERE idusuario = auth.uid();
  
  RETURN user_idbu;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_user_idbu_simple() IS 'Returns the business unit ID (idbu) for the currently authenticated user - used in RLS policies';
