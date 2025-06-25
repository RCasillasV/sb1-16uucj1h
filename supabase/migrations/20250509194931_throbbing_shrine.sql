/*
  # Update RLS policies for tcPacientes table

  1. Changes
    - Enable RLS on tcPacientes table
    - Add policy for authenticated users to insert new patients
    - Add policy for users to read their own patients
    - Add policy for users to update their own patients
    - Add policy for users to delete their own patients

  2. Security
    - Ensures users can only manage patients they created
    - Requires user_id to match auth.uid() for all operations
*/

-- Enable RLS
ALTER TABLE "tcPacientes" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own patients" ON "tcPacientes";
DROP POLICY IF EXISTS "Permitir insertar para usuarios authenticated users" ON "tcPacientes";

-- Create comprehensive RLS policies
CREATE POLICY "Users can insert patients"
ON "tcPacientes"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their patients"
ON "tcPacientes"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their patients"
ON "tcPacientes"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their patients"
ON "tcPacientes"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);