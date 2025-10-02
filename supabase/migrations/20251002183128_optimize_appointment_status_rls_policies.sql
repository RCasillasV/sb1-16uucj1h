/*
  # Optimize RLS Policies for Appointment Status Tables
  
  This migration cleans up and optimizes Row Level Security policies for:
  - tcCitasEstados (appointment statuses catalog)
  - tcCitasEdoTrans (appointment status transitions catalog)
  
  ## Current Issues
  
  There are duplicate and overly permissive policies:
  1. Multiple SELECT policies doing the same thing
  2. INSERT and UPDATE policies for catalog tables (should be read-only for regular users)
  3. One policy uses 'public' role instead of 'authenticated'
  
  ## Security Requirements
  
  Both tables are CATALOG/CONFIGURATION data:
  - Users need to READ all records (for UI dropdowns and validation)
  - Users should NOT be able to INSERT, UPDATE, or DELETE records
  - Only superadmin or database admin should modify catalog data directly
  
  ## Changes
  
  1. Drop all existing policies
  2. Create single, clear SELECT policy for each table
  3. Restrict to authenticated users only
  4. No INSERT/UPDATE/DELETE policies (catalog data is managed via migrations)
  
  ## Benefits
  
  - Clearer security model
  - Less overhead (fewer policies to evaluate)
  - Prevents accidental data corruption by users
  - Catalog data can only be changed via migrations
*/

-- ============================================================================
-- Clean up tcCitasEstados policies
-- ============================================================================

-- Drop all existing policies on tcCitasEstados
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'tcCitasEstados'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "tcCitasEstados"', pol.policyname);
  END LOOP;
END $$;

-- Create single, clear SELECT policy for tcCitasEstados
CREATE POLICY "Authenticated users can read appointment statuses"
  ON "tcCitasEstados"
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Clean up tcCitasEdoTrans policies
-- ============================================================================

-- Drop all existing policies on tcCitasEdoTrans
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'tcCitasEdoTrans'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON "tcCitasEdoTrans"', pol.policyname);
  END LOOP;
END $$;

-- Create single, clear SELECT policy for tcCitasEdoTrans
CREATE POLICY "Authenticated users can read appointment transitions"
  ON "tcCitasEdoTrans"
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================

-- Ensure RLS is enabled on both tables
ALTER TABLE "tcCitasEstados" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tcCitasEdoTrans" ENABLE ROW LEVEL SECURITY;

-- Add comments explaining the security model
COMMENT ON TABLE "tcCitasEstados" IS 
  'Catalog table for appointment statuses. RLS allows authenticated users to read all records. Modifications only via migrations.';
  
COMMENT ON TABLE "tcCitasEdoTrans" IS 
  'Catalog table for appointment status transitions. RLS allows authenticated users to read all records. Modifications only via migrations.';