/*
  # Update RLS policies for public access

  1. Changes
    - Disable RLS on patients table to allow public access
    - Disable RLS on medical_records table
    - Disable RLS on appointments table

  2. Security
    - WARNING: This configuration allows public access to all data
    - Only use this in development or when public access is required
    - Consider implementing proper authentication in production
*/

-- Disable RLS on patients table
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on medical_records table
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;

-- Disable RLS on appointments table
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;