/*
  # Add occupation field to patients table

  1. Changes
    - Add occupation field for storing patient's occupation
    - Field is optional (nullable)

  2. Schema Updates
    - New text field added to patients table
*/

ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation text;