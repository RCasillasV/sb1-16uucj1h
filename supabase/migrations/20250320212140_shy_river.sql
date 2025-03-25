/*
  # Temporarily Disable RLS for Testing

  1. Changes
    - Disable RLS on medications table
    - Disable RLS on prescriptions table
    - Disable RLS on prescription_medications table

  2. Security
    - WARNING: This configuration allows public access to all data
    - Only use this in development/testing environments
    - Re-enable RLS before deploying to production
*/

-- Disable RLS on medications table
ALTER TABLE medications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on prescriptions table
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on prescription_medications table
ALTER TABLE prescription_medications DISABLE ROW LEVEL SECURITY;