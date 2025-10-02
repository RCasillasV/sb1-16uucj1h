/*
  # Fix tcCitas estado Column Type and Constraints
  
  This migration corrects the data type of the `estado` column in the `tcCitas` table.
  
  ## Problem
  
  The original migration created the `estado` column as TEXT with a CHECK constraint:
  ```sql
  estado text NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada'))
  ```
  
  This is incorrect because:
  1. The system uses a separate catalog table `tcCitasEstados` with numeric IDs
  2. The application code expects `estado` to be a foreign key to `tcCitasEstados(id)`
  3. The RPC function `agendar_cita` inserts numeric values (1 or 11)
  4. The frontend queries use JOIN syntax: `estado_info:estado(id, estado, descripcion)`
  
  ## Solution
  
  Change the column type from TEXT to SMALLINT and add proper foreign key constraint.
  
  ## Migration Steps
  
  1. Drop the old CHECK constraint
  2. Convert existing TEXT values to numeric IDs (if any exist)
  3. Change column type from TEXT to SMALLINT
  4. Add foreign key constraint to tcCitasEstados
  5. Set default value to 1 (Programada)
  
  ## Data Migration
  
  If there are existing TEXT values, they will be converted:
  - 'programada' → 1
  - 'confirmada' → 2
  - 'completada' → 5
  - 'cancelada' → 7
  - Any other value → 1 (default to Programada)
  
  ## Notes
  
  - The column is nullable to allow flexibility during appointment creation
  - Default value is 1 (Programada) for backward compatibility
  - Foreign key constraint ensures data integrity with tcCitasEstados
*/

-- Step 1: Drop the old CHECK constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tcCitas_estado_check' 
    AND table_name = 'tcCitas'
  ) THEN
    ALTER TABLE "tcCitas" DROP CONSTRAINT "tcCitas_estado_check";
  END IF;
END $$;

-- Step 2: Check if the column is currently TEXT and needs conversion
DO $$ 
BEGIN
  -- Check if estado column is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcCitas' 
    AND column_name = 'estado' 
    AND data_type = 'text'
  ) THEN
    -- Migrate existing data: convert text values to numeric IDs
    UPDATE "tcCitas" 
    SET estado = CASE 
      WHEN estado = 'programada' THEN '1'
      WHEN estado = 'confirmada' THEN '2'
      WHEN estado = 'en espera' THEN '3'
      WHEN estado = 'en progreso' THEN '4'
      WHEN estado = 'completada' OR estado = 'atendida' THEN '5'
      WHEN estado = 'no se presentó' THEN '6'
      WHEN estado = 'cancelada' THEN '7'
      WHEN estado = 'urgencia' THEN '11'
      ELSE '1'  -- Default to Programada for unknown values
    END
    WHERE estado IS NOT NULL 
    AND estado NOT SIMILAR TO '[0-9]+';  -- Only convert if not already numeric
    
    -- Change column type from TEXT to SMALLINT
    ALTER TABLE "tcCitas" 
      ALTER COLUMN estado TYPE smallint 
      USING CASE 
        WHEN estado ~ '^[0-9]+$' THEN estado::smallint 
        ELSE 1  -- Fallback to Programada
      END;
  END IF;
END $$;

-- Step 3: Ensure column has proper default value
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tcCitas' 
    AND column_name = 'estado'
  ) THEN
    ALTER TABLE "tcCitas" 
      ALTER COLUMN estado SET DEFAULT 1;
  END IF;
END $$;

-- Step 4: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_tcCitas_estado' 
    AND table_name = 'tcCitas'
  ) THEN
    ALTER TABLE "tcCitas"
      ADD CONSTRAINT fk_tcCitas_estado 
      FOREIGN KEY (estado) 
      REFERENCES "tcCitasEstados"(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Step 5: Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tcCitas_estado 
  ON "tcCitas"(estado);

-- Add helpful comment
COMMENT ON COLUMN "tcCitas".estado IS 'Foreign key to tcCitasEstados. Default value is 1 (Programada). New appointments can be created with estado 1 or 11 (Urgencia).';