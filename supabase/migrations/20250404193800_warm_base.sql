/*
  # Add Cubicle Field to Appointments

  1. Changes
    - Add cubicle field to appointments table
    - Add check constraint for valid cubicle numbers
    - Update existing appointments to have default cubicle

  2. Schema Updates
    - New integer field for tracking appointment location
    - Constraint to ensure valid cubicle numbers (1-3)
*/

-- Add cubicle column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'cubicle'
  ) THEN
    ALTER TABLE appointments ADD COLUMN cubicle integer DEFAULT 1;
    
    -- Add constraint to ensure valid cubicle numbers
    ALTER TABLE appointments 
      ADD CONSTRAINT appointments_cubicle_check 
      CHECK (cubicle BETWEEN 1 AND 3);
  END IF;
END $$;

-- Update existing appointments to have a default cubicle
UPDATE appointments SET cubicle = 1 WHERE cubicle IS NULL;

-- Make cubicle field required
ALTER TABLE appointments ALTER COLUMN cubicle SET NOT NULL;