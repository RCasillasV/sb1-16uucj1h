/*
  # Add new patient fields

  1. Changes
    - Add paternal_surname field for storing the father's surname
    - Add curp field for Mexican ID number
    - Add postal_code field for address validation

  2. Schema Updates
    - All new fields are added to patients table
    - postal_code is validated to be exactly 6 digits
*/

DO $$ 
BEGIN
  -- Add paternal_surname column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'paternal_surname'
  ) THEN
    ALTER TABLE patients ADD COLUMN paternal_surname text NOT NULL DEFAULT '';
  END IF;

  -- Add curp column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'curp'
  ) THEN
    ALTER TABLE patients ADD COLUMN curp text;
  END IF;

  -- Add postal_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE patients ADD COLUMN postal_code text;
    -- Add check constraint for exactly 6 digits
    ALTER TABLE patients ADD CONSTRAINT postal_code_format CHECK (postal_code ~ '^[0-9]{6}$');
  END IF;
END $$;