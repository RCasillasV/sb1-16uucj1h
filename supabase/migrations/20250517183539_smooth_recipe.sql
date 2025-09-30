/*
  # Add get_user_idbu function

  1. New Functions
    - `get_user_idbu(user_id uuid)`: Returns a user's business unit information
      - Input: user_id (uuid) - The ID of the user
      - Output: JSON object containing:
        - idbu: The business unit ID
        - business_unit: Object containing business unit details (name)

  2. Security
    - Function is accessible to authenticated users
    - Returns NULL if user not found or has no business unit
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_idbu(user_id uuid);

-- Create the function
CREATE OR REPLACE FUNCTION public.get_user_idbu(user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    jsonb_build_object(
      'idbu', tu."idBu",
      'business_unit', (
        SELECT row_to_json(t) 
        FROM (
          SELECT "Nombre" 
          FROM public."tcBu" 
          WHERE "idBu" = tu."idBu"
        ) t
      )
    )
  FROM public."tcUsuarios" tu 
  WHERE tu.idusuario = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_idbu() TO authenticated;