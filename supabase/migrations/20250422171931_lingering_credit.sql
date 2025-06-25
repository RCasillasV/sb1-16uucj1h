/*
  # Update CP Column Type in tcBu Table

  1. Changes
    - Change CP column type from smallint to bigint
    - Preserve existing data
    - No data loss or constraints removed

  2. Schema Updates
    - Safe column type modification
    - Handles existing data automatically
*/

-- Alter the CP column type
ALTER TABLE "tcBu" ALTER COLUMN "CP" TYPE bigint USING "CP"::bigint;