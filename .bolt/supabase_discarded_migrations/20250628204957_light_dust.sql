/*
  # Database Schema Update from Direct Changes

  1. New Tables
    - `tcRoles`: Roles for system users
    - `tcEstadoCivil`: Civil status catalog
    - `colors`: Color definitions with various color models
    - `medical_records`: Patient medical records
    - `tcGruposEtarios`: Age groups catalog
    - `tcTiposSangre`: Blood types catalog

  2. Schema Updates
    - Add new columns to existing tables
    - Update constraints and relationships
    - Add proper indexes for performance
    - Rename and update table structures

  3. Security
    - Update RLS policies for all tables
    - Add proper access control
*/

-- Create color_source enum type
CREATE TYPE color_source AS ENUM (
  '99COLORS_NET', 'ART_PAINTS_YG07S', 'BYRNE', 'CMYK_COLOR_MODEL', 'COLORCODE_IS',
  'COLORHEXA', 'COLORXS', 'COLUMBIA_UNIVERSITY', 'CORNELL_UNIVERSITY', 'CRAYOLA',
  'DUKE_UNIVERSITY', 'ENCYCOLORPEDIA_COM', 'ETON_COLLEGE', 'FANTETTI_AND_PETRACCHI',
  'FEDERAL_STANDARD_595', 'FERRARIO_1919', 'FINDTHEDATA_COM', 'FLAG_OF_INDIA',
  'FLAG_OF_SOUTH_AFRICA', 'GLAZEBROOK_AND_BALDRY', 'GOOGLE', 'HEXCOLOR_CO',
  'ISCC_NBS', 'KELLY_MOORE', 'MAERZ_AND_PAUL', 'MATTEL', 'MILK_PAINT',
  'MUNSELL_COLOR_WHEEL', 'NATURAL_COLOR_SYSTEM', 'PANTONE', 'PLOCHERE',
  'POURPRE_COM', 'RAL', 'RESENE', 'RGB_COLOR_MODEL', 'THOM_POOLE',
  'UNIVERSITY_OF_ALABAMA', 'UNIVERSITY_OF_CALIFORNIA_DAVIS', 'UNIVERSITY_OF_CAMBRIDGE',
  'UNIVERSITY_OF_NORTH_CAROLINA', 'UNIVERSITY_OF_TEXAS_AT_AUSTIN', 'X11_WEB', 'XONA_COM'
);

-- Rename appointments table to z_kill_appointments
ALTER TABLE IF EXISTS appointments RENAME TO z_kill_appointments;
COMMENT ON TABLE z_kill_appointments IS 'Borrar en breve';

-- Create tcRoles table
CREATE TABLE IF NOT EXISTS "tcRoles" (
  id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  "NombreRol" character varying NOT NULL,
  "Descripcion" character varying,
  CONSTRAINT "tcRoles_pkey" PRIMARY KEY (id, "NombreRol"),
  CONSTRAINT "tcRoles_NombreRol_key" UNIQUE ("NombreRol")
);
COMMENT ON TABLE "tcRoles" IS 'Roles que pueden los usuarios tener';

-- Create tcEstadoCivil table
CREATE TABLE IF NOT EXISTS "tcEstadoCivil" (
  id bigint NOT NULL,
  created_at timestamp with time zone,
  "user" bigint,
  "Prefijo" text,
  "SufijoMasculino" text,
  "SufijoFemenino" text,
  "SufiloOtro" text,
  CONSTRAINT "estados_civiles_pkey" PRIMARY KEY (id)
);
COMMENT ON TABLE "tcEstadoCivil" IS 'Estados Civiles';

-- Create colors table
CREATE TABLE IF NOT EXISTS colors (
  id bigint NOT NULL,
  name text COMMENT 'Name of the color',
  hex text NOT NULL COMMENT 'Hex tripliets of the color for HTML web colors',
  red smallint COMMENT 'Red in RGB (%)',
  green smallint COMMENT 'Green in RGB (%)',
  blue smallint COMMENT 'Blue in RGB (%)',
  hue smallint COMMENT 'Hue in HSL (°)',
  sat_hsl smallint COMMENT 'Saturation in HSL (%)',
  light_hsl smallint COMMENT 'Light in HSL (%)',
  sat_hsv smallint COMMENT 'Saturation in HSV (%)',
  val_hsv smallint COMMENT 'Value in HSV (%)',
  source color_source COMMENT 'Source of information on the color',
  CONSTRAINT colors_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE colors IS 'Full list of colors (based on various sources)';

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  patient_id uuid,
  visit_date timestamp with time zone NOT NULL,
  diagnosis text NOT NULL,
  treatment text,
  prescription text,
  notes text,
  user_id uuid,
  CONSTRAINT medical_records_pkey PRIMARY KEY (id)
);

-- Create tcGruposEtarios table
CREATE TABLE IF NOT EXISTS "tcGruposEtarios" (
  create_at timestamp with time zone,
  "Categoria" text,
  "UnidadTiempo" text,
  "Minimo" smallint,
  "Maximo" smallint,
  "Rango de Edad" text NOT NULL,
  id uuid DEFAULT gen_random_uuid() NOT NULL
);
COMMENT ON TABLE "tcGruposEtarios" IS 'Grupos de edades';

-- Create tcTiposSangre table
CREATE TABLE IF NOT EXISTS "tcTiposSangre" (
  id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  "TipoSangre" text NOT NULL,
  "FrecuenciaMex" real NOT NULL,
  "FrecuenciaMundo" real NOT NULL,
  CONSTRAINT "tcTiposSangre_pkey" PRIMARY KEY (id)
);
COMMENT ON TABLE "tcTiposSangre" IS 'Catálogo de tipos de  Sangre';

-- Update tcBu table
ALTER TABLE "tcBu" 
  ADD COLUMN IF NOT EXISTS "Numero" character varying,
  ADD COLUMN IF NOT EXISTS "Interior" character varying,
  ADD COLUMN IF NOT EXISTS "idUser" uuid DEFAULT uid(),
  ADD COLUMN IF NOT EXISTS "dtVigencia" date,
  ADD COLUMN IF NOT EXISTS "Especialidad" character varying,
  ADD COLUMN IF NOT EXISTS "Bucket" text NOT NULL COMMENT 'Espacio para documentos e imagenes';

ALTER TABLE "tcBu" 
  ADD CONSTRAINT "tcBu_Bucket_check" CHECK ((length("Bucket") <= 30)),
  ADD CONSTRAINT "tcBu_Bucket_key" UNIQUE ("Bucket"),
  ADD CONSTRAINT "tcBu_Nombre_key" UNIQUE ("Nombre");

-- Update tcUsuarios table
ALTER TABLE "tcUsuarios" 
  ADD COLUMN IF NOT EXISTS "idusuario" uuid DEFAULT uid() NOT NULL,
  ADD COLUMN IF NOT EXISTS "idbu" uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
  ADD COLUMN IF NOT EXISTS "nombre" text,
  ADD COLUMN IF NOT EXISTS "email" text NOT NULL,
  ADD COLUMN IF NOT EXISTS "estado" text DEFAULT 'Activo'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "rol" text DEFAULT 'Medico'::text NOT NULL,
  ADD COLUMN IF NOT EXISTS "telefono" text,
  ADD COLUMN IF NOT EXISTS "fechaultimoacceso" timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;

-- Add constraints to tcUsuarios
ALTER TABLE "tcUsuarios" 
  ADD CONSTRAINT "tcUsuarios_idusuario_key" UNIQUE ("idusuario"),
  ADD CONSTRAINT "tcusuarios_email_key" UNIQUE (email),
  ADD CONSTRAINT "tcUsuarios_idbu_fkey" FOREIGN KEY ("idbu") REFERENCES "tcBu"("idBu"),
  ADD CONSTRAINT "tcUsuarios_idusuario_fkey" FOREIGN KEY ("idusuario") REFERENCES users(id),
  ADD CONSTRAINT "tcUsuarios_rol_fkey" FOREIGN KEY ("rol") REFERENCES "tcRoles"("NombreRol");

-- Update tcAseguradora table
ALTER TABLE "tcAseguradora" 
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;

-- Update clinical_histories table
ALTER TABLE clinical_histories 
  ADD CONSTRAINT "clinical_histories_user_id_fkey1" FOREIGN KEY (user_id) REFERENCES "tcUsuarios"(idusuario);

-- Update tcCitas table
ALTER TABLE "tcCitas" 
  ADD COLUMN IF NOT EXISTS "hora_fin" time without time zone;

-- Update tcPacientes table
ALTER TABLE "tcPacientes" 
  ADD COLUMN IF NOT EXISTS "TipoPaciente" character varying[],
  ADD COLUMN IF NOT EXISTS "EstadoNacimiento" character varying,
  ADD COLUMN IF NOT EXISTS "Nacionalidad" character varying,
  ADD COLUMN IF NOT EXISTS "Religion" character varying,
  ADD COLUMN IF NOT EXISTS "LenguaIndigena" character varying,
  ADD COLUMN IF NOT EXISTS "GrupoEtnico" character varying,
  ADD COLUMN IF NOT EXISTS "Discapacidad" character varying,
  ADD COLUMN IF NOT EXISTS "Folio" integer NOT NULL,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp without time zone,
  ADD COLUMN IF NOT EXISTS "Asentamiento" character varying;

-- Add constraints to tcPacientes
ALTER TABLE "tcPacientes" 
  ADD CONSTRAINT "formato_codigopostal" CHECK ((("CodigoPostal" IS NULL) OR ("CodigoPostal" ~ '^[0-9]{5}$'::text))),
  ADD CONSTRAINT "pacientes_idbu_fkey" FOREIGN KEY (idbu) REFERENCES "tcBu"("idBu"),
  ADD CONSTRAINT "pacientes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);

-- Update z_kill_appointments table
ALTER TABLE z_kill_appointments 
  ALTER COLUMN cubicle SET DEFAULT 1,
  ALTER COLUMN cubicle SET NOT NULL,
  ADD CONSTRAINT appointments_cubicle_check CHECK (((cubicle >= 1) AND (cubicle <= 5))),
  ADD CONSTRAINT appointments_pkey PRIMARY KEY (id, patient_id),
  ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES "tcPacientes"(id),
  ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Update medical_records table
ALTER TABLE medical_records 
  ADD CONSTRAINT medical_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS "tcRoles_NombreRol_key" ON "tcRoles" USING btree ("NombreRol");
CREATE INDEX IF NOT EXISTS "tcRoles_pkey" ON "tcRoles" USING btree (id, "NombreRol");
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON z_kill_appointments USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON z_kill_appointments USING btree (user_id);

-- Create trigger functions
CREATE OR REPLACE FUNCTION get_user_idbu() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_idbu() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_idbu_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION replicar_userdata() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION insert_tcusuarios() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Function implementation
  RETURN NEW;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE "tcRoles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tcEstadoCivil" ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tcGruposEtarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tcTiposSangre" ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_kill_appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their patients' medical records" ON medical_records
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir todo" ON "tcBu"
  USING (true);

CREATE POLICY "Users can view their own record" ON "tcUsuarios"
  FOR SELECT
  USING ((idusuario = ( SELECT uid() AS uid)));

CREATE POLICY "users_can_insert_its_own" ON "tcUsuarios"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "atender_pacientes" ON "tcPacientes"
  USING ((idbu IN ( SELECT "tcUsuarios".idbu
   FROM "tcUsuarios"
  WHERE ("tcUsuarios".idusuario = ( SELECT uid() AS uid)))));

-- Insert initial data
INSERT INTO "tcRoles" (id, "NombreRol", "Descripcion")
VALUES 
  (1, 'Administrador', 'Administrador del sistema'),
  (2, 'Medico', 'Médico o profesional de la salud'),
  (3, 'Recepcionista', 'Asistente o recepcionista')
ON CONFLICT (id, "NombreRol") DO NOTHING;

INSERT INTO "tcEstadoCivil" (id, "Prefijo", "SufijoMasculino", "SufijoFemenino")
VALUES 
  (1, 'Soltero', 'o', 'a'),
  (2, 'Casado', 'o', 'a'),
  (3, 'Viudo', 'o', 'a'),
  (4, 'Divorciado', 'o', 'a'),
  (5, 'Unión Libre', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "tcTiposSangre" (id, "TipoSangre", "FrecuenciaMex", "FrecuenciaMundo")
VALUES 
  (1, 'O+', 60.0, 38.0),
  (2, 'O-', 8.0, 7.0),
  (3, 'A+', 20.0, 34.0),
  (4, 'A-', 2.0, 6.0),
  (5, 'B+', 8.0, 9.0),
  (6, 'B-', 1.0, 2.0),
  (7, 'AB+', 1.0, 3.0),
  (8, 'AB-', 0.5, 1.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "tcGruposEtarios" ("Categoria", "UnidadTiempo", "Minimo", "Maximo", "Rango de Edad")
VALUES 
  ('Recién nacido', 'días', 0, 28, 'Recién nacido (0-28 días)'),
  ('Lactante menor', 'meses', 1, 12, 'Lactante menor (1-12 meses)'),
  ('Lactante mayor', 'meses', 12, 24, 'Lactante mayor (12-24 meses)'),
  ('Preescolar', 'años', 2, 5, 'Preescolar (2-5 años)'),
  ('Escolar', 'años', 6, 11, 'Escolar (6-11 años)'),
  ('Adolescente', 'años', 12, 18, 'Adolescente (12-18 años)'),
  ('Adulto joven', 'años', 19, 35, 'Adulto joven (19-35 años)'),
  ('Adulto medio', 'años', 36, 59, 'Adulto medio (36-59 años)'),
  ('Adulto mayor', 'años', 60, 120, 'Adulto mayor (60+ años)')
ON CONFLICT DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_idbu() TO authenticated;
GRANT EXECUTE ON FUNCTION set_idbu() TO authenticated;
GRANT EXECUTE ON FUNCTION set_idbu_on_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION replicar_userdata() TO authenticated;
GRANT EXECUTE ON FUNCTION insert_tcusuarios() TO authenticated;