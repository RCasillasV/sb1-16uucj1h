/*
  # Add get_idbu RPC function

  1. New Functions
    - `get_idbu()`: Returns the current authenticated user's business unit ID
      - No parameters (uses auth.uid() internally)
      - Output: uuid - The business unit ID (idbu) for the current user
      - Returns NULL if user not found or has no business unit assigned

  2. Security
    - Function uses SECURITY DEFINER to access tcUsuarios table
    - Only accessible to authenticated users
    - Uses auth.uid() to ensure users only access their own data

  3. Purpose
    - Used by frontend code to get the current user's business unit
    - Essential for multi-tenant data isolation
    - Called by crudService.ts when creating records
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_idbu();

-- Create the function
CREATE OR REPLACE FUNCTION public.get_idbu()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_idbu uuid;
BEGIN
    -- Get the business unit ID for the current authenticated user
    SELECT idbu
    INTO user_idbu
    FROM "tcUsuarios"
    WHERE idusuario = auth.uid();

    -- Return the business unit ID (will be NULL if user not found)
    RETURN user_idbu;
EXCEPTION
    WHEN others THEN
        -- Log error and return NULL
        RAISE WARNING 'Error in get_idbu(): %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_idbu() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_idbu() IS 'Returns the business unit ID (idbu) for the currently authenticated user';
