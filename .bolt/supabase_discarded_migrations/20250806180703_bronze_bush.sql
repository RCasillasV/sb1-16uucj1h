/*
  # Configuración de agenda médica

  1. New Tables
    - `agenda_settings`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `idbu` (uuid, foreign key to tcBu)
      - `start_time` (time without time zone)
      - `end_time` (time without time zone)
      - `consultation_days` (text array)
      - `slot_interval` (integer)
      - `user_id` (uuid, foreign key to users)

    - `blocked_dates`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `idbu` (uuid, foreign key to tcBu)
      - `start_date` (date)
      - `end_date` (date)
      - `reason` (text)
      - `block_type` (text)
      - `user_id` (uuid, foreign key to users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own settings
    - Ensure users can only access data from their business unit
*/

-- Create agenda_settings table
CREATE TABLE IF NOT EXISTS agenda_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idbu uuid NOT NULL,
  start_time time without time zone NOT NULL DEFAULT '08:00:00',
  end_time time without time zone NOT NULL DEFAULT '18:00:00',
  consultation_days text[] NOT NULL DEFAULT ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  slot_interval integer NOT NULL DEFAULT 30,
  user_id uuid,
  CONSTRAINT agenda_settings_idbu_fkey FOREIGN KEY (idbu) REFERENCES "tcBu"("idBu") ON DELETE CASCADE,
  CONSTRAINT agenda_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT agenda_settings_slot_interval_check CHECK (slot_interval IN (15, 20, 30, 45, 60)),
  CONSTRAINT agenda_settings_time_check CHECK (start_time < end_time)
);

-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  idbu uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  block_type text NOT NULL DEFAULT 'other',
  user_id uuid,
  CONSTRAINT blocked_dates_idbu_fkey FOREIGN KEY (idbu) REFERENCES "tcBu"("idBu") ON DELETE CASCADE,
  CONSTRAINT blocked_dates_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT blocked_dates_type_check CHECK (block_type IN ('vacation', 'congress', 'legal', 'other')),
  CONSTRAINT blocked_dates_date_check CHECK (start_date <= end_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agenda_settings_idbu ON agenda_settings(idbu);
CREATE INDEX IF NOT EXISTS idx_agenda_settings_user_id ON agenda_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_idbu ON blocked_dates(idbu);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_user_id ON blocked_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_dates ON blocked_dates(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE agenda_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agenda_settings
CREATE POLICY "Users can manage their business unit agenda settings"
  ON agenda_settings
  FOR ALL
  TO authenticated
  USING (idbu IN (
    SELECT "tcUsuarios".idbu
    FROM "tcUsuarios"
    WHERE "tcUsuarios".idusuario = uid()
  ));

-- Create RLS policies for blocked_dates
CREATE POLICY "Users can manage their business unit blocked dates"
  ON blocked_dates
  FOR ALL
  TO authenticated
  USING (idbu IN (
    SELECT "tcUsuarios".idbu
    FROM "tcUsuarios"
    WHERE "tcUsuarios".idusuario = uid()
  ));

-- Add updated_at trigger for agenda_settings
CREATE OR REPLACE FUNCTION update_agenda_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agenda_settings_updated_at_trigger
  BEFORE UPDATE ON agenda_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_settings_updated_at();

-- Add updated_at trigger for blocked_dates
CREATE OR REPLACE FUNCTION update_blocked_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blocked_dates_updated_at_trigger
  BEFORE UPDATE ON blocked_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_blocked_dates_updated_at();

-- Update tcConsultorios to add name field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcConsultorios' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE "tcConsultorios" ADD COLUMN nombre text DEFAULT '';
    
    -- Update existing records with default names
    UPDATE "tcConsultorios" 
    SET nombre = CASE 
      WHEN id = 1 THEN 'Consultorio 1'
      WHEN id = 2 THEN 'Consultorio 2'
      WHEN id = 3 THEN 'Consultorio 3'
      ELSE 'Consultorio ' || id::text
    END
    WHERE nombre = '' OR nombre IS NULL;
  END IF;
END $$;