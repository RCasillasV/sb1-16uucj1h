/*
  # Update postal code validation safely

  1. Changes
    - Update postal code validation from 6 to 5 digits
    - Handle existing data safely
    - Modify constraints in both users and patients tables

  2. Schema Updates
    - Clean up existing data
    - Update CHECK constraints for postal_code columns
*/

-- Function to trim postal codes to 5 digits
CREATE OR REPLACE FUNCTION trim_postal_code(postal text) 
RETURNS text AS $$
BEGIN
  IF postal IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN LEFT(postal, 5);
END;
$$ LANGUAGE plpgsql;

-- Update existing postal codes in patients table
UPDATE patients 
SET postal_code = trim_postal_code(postal_code)
WHERE postal_code IS NOT NULL;

-- Update existing postal codes in users table
UPDATE users 
SET postal_code = trim_postal_code(postal_code)
WHERE postal_code IS NOT NULL;

-- Now safe to update constraints
ALTER TABLE patients DROP CONSTRAINT IF EXISTS postal_code_format;
ALTER TABLE patients ADD CONSTRAINT postal_code_format 
  CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{5}$');

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_postal_code_check;
ALTER TABLE users ADD CONSTRAINT users_postal_code_check 
  CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{5}$');

-- Clean up
DROP FUNCTION IF EXISTS trim_postal_code;