/*
  # Actualizar estructura de citas con tabla de estados

  1. Nuevas Tablas
    - `tcCitasEstados`
      - `id` (smallint, primary key)
      - `estado` (text, unique)
      - `descripcion` (text)
      - `usocita` (text)

  2. Cambios en tcCitas
    - Campo `estado` cambia de text a smallint FK
    - Agregar campo `idBu` (uuid)
    - Actualizar foreign key de `id_user`

  3. Datos Iniciales
    - Insertar estados predefinidos en tcCitasEstados
    - Migrar datos existentes de estados text a smallint

  4. Seguridad
    - Mantener RLS existente
    - Agregar políticas para nueva tabla
*/

-- Crear tabla de estados de citas
CREATE TABLE IF NOT EXISTS public."tcCitasEstados" (
  id smallint NOT NULL,
  estado text NOT NULL,
  descripcion text NOT NULL,
  usocita text NOT NULL,
  CONSTRAINT tcCitasEstados_pkey PRIMARY KEY (id),
  CONSTRAINT tcCitasEstados_nombre_unique UNIQUE (estado)
);

-- Insertar estados predefinidos
INSERT INTO public."tcCitasEstados" (id, estado, descripcion, usocita) VALUES
  (1, 'Programada', 'Cita programada pendiente de confirmación', 'agenda'),
  (2, 'Confirmada', 'Cita confirmada por el paciente', 'agenda'),
  (3, 'En Progreso', 'Paciente siendo atendido actualmente', 'consulta'),
  (4, 'Atendida', 'Cita completada exitosamente', 'historial'),
  (5, 'No se Presentó', 'Paciente no asistió a la cita', 'historial'),
  (6, 'Cancelada x Paciente', 'Cita cancelada por el paciente', 'historial'),
  (7, 'Cancelada x Médico', 'Cita cancelada por el médico', 'historial'),
  (8, 'Reprogramada x Paciente', 'Cita reprogramada por el paciente', 'agenda'),
  (9, 'Reprogramada x Médico', 'Cita reprogramada por el médico', 'agenda'),
  (10, 'En Espera', 'Paciente en sala de espera', 'consulta'),
  (11, 'Urgencia', 'Cita de urgencia', 'agenda')
ON CONFLICT (id) DO UPDATE SET
  estado = EXCLUDED.estado,
  descripcion = EXCLUDED.descripcion,
  usocita = EXCLUDED.usocita;

-- Agregar columna temporal para mapear estados existentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcCitas' AND column_name = 'estado_temp'
  ) THEN
    ALTER TABLE public."tcCitas" ADD COLUMN estado_temp smallint;
  END IF;
END $$;

-- Mapear estados existentes de text a smallint
UPDATE public."tcCitas" SET estado_temp = CASE
  WHEN estado = 'Programada' THEN 1
  WHEN estado = 'Confirmada' THEN 2
  WHEN estado = 'En Progreso' THEN 3
  WHEN estado = 'Atendida' THEN 4
  WHEN estado = 'No se Presentó' THEN 5
  WHEN estado = 'Cancelada x Paciente' THEN 6
  WHEN estado = 'Cancelada x Médico' THEN 7
  WHEN estado = 'Reprogramada x Paciente' THEN 8
  WHEN estado = 'Reprogramada x Médico' THEN 9
  WHEN estado = 'En Espera' THEN 10
  WHEN estado = 'Urgencia' THEN 11
  ELSE 1 -- Default a 'Programada'
END
WHERE estado_temp IS NULL;

-- Agregar campo idBu si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcCitas' AND column_name = 'idBu'
  ) THEN
    ALTER TABLE public."tcCitas" ADD COLUMN "idBu" uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Actualizar idBu con valores de la tabla de usuarios si están disponibles
UPDATE public."tcCitas" 
SET "idBu" = COALESCE(
  (SELECT idbu FROM public."tcUsuarios" WHERE idusuario = id_user),
  '00000000-0000-0000-0000-000000000000'::uuid
)
WHERE "idBu" IS NULL;

-- Eliminar constraint del campo estado anterior si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tcCitas' AND constraint_name = 'tcCitas_estado_check'
  ) THEN
    ALTER TABLE public."tcCitas" DROP CONSTRAINT tcCitas_estado_check;
  END IF;
END $$;

-- Eliminar columna estado antigua y renombrar estado_temp
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcCitas' AND column_name = 'estado'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public."tcCitas" DROP COLUMN estado;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcCitas' AND column_name = 'estado_temp'
  ) THEN
    ALTER TABLE public."tcCitas" RENAME COLUMN estado_temp TO estado;
  END IF;
END $$;

-- Agregar constraint y foreign key para el nuevo campo estado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tcCitas' AND constraint_name = 'tcCitas_estado_fkey'
  ) THEN
    ALTER TABLE public."tcCitas" 
    ADD CONSTRAINT tcCitas_estado_fkey 
    FOREIGN KEY (estado) REFERENCES public."tcCitasEstados"(id);
  END IF;
END $$;

-- Actualizar foreign key de id_user para referenciar auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tcCitas' AND constraint_name = 'tcCitas_id_medico_fkey'
  ) THEN
    ALTER TABLE public."tcCitas" DROP CONSTRAINT tcCitas_id_medico_fkey;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tcCitas' AND constraint_name = 'tcCitas_id_user_fkey'
  ) THEN
    ALTER TABLE public."tcCitas" 
    ADD CONSTRAINT tcCitas_id_user_fkey 
    FOREIGN KEY (id_user) REFERENCES auth.users(id);
  END IF;
END $$;

-- Habilitar RLS en la nueva tabla
ALTER TABLE public."tcCitasEstados" ENABLE ROW LEVEL SECURITY;

-- Política para lectura de estados (todos los usuarios autenticados)
CREATE POLICY IF NOT EXISTS "Estados de citas - lectura para autenticados"
  ON public."tcCitasEstados"
  FOR SELECT
  TO authenticated
  USING (true);

-- Actualizar índices si es necesario
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public."tcCitas" USING btree (estado);
CREATE INDEX IF NOT EXISTS idx_citas_idbu ON public."tcCitas" USING btree ("idBu");