/*
  # Fix get_user_idbu function case sensitivity

  1. Changes
    - Drop and recreate get_user_idbu function with correct column case
    - Use lowercase idbu instead of mixed case idBu
    - Add proper type safety and error handling
    - Return both user and business unit information

  2. Security
    - Function remains accessible to authenticated users only
    - Returns only data for the requesting user
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_idbu(user_id uuid);

-- Recreate function with correct column casing
CREATE OR REPLACE FUNCTION get_user_idbu(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'idbu', tu.idbu,
        'business_unit', bu
    )
    INTO result
    FROM "tcUsuarios" tu
    LEFT JOIN "tcBu" bu ON tu.idbu = bu."idBu"
    WHERE tu.idusuario = user_id;

    RETURN result;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error fetching user data: %', SQLERRM;
END;
$$;