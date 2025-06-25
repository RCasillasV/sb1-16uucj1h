/*
  # Fix Somatometry Records RLS Policy

  1. Changes
    - Disable RLS temporarily to fix policy issues
    - Drop existing policy
    - Create new policy with correct user_id check
    - Re-enable RLS

  2. Security
    - Ensures users can only manage their own records
    - Maintains data isolation between users
*/

-- Temporarily disable RLS
ALTER TABLE somatometry_records DISABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their patients' somatometry records" ON somatometry_records;

-- Create new policy with correct user_id check
CREATE POLICY "Users can manage their patients' somatometry records"
  ON somatometry_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE somatometry_records ENABLE ROW LEVEL SECURITY;