/*
  # Crear tabla de Antecedentes No Patológicos

  1. Nueva Tabla
    - `tpPacienteHistNoPatologica`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp) 
      - `patient_id` (uuid, foreign key a tcPacientes)
      - `user_id` (uuid, foreign key a users)
      - `habitos_estilo_vida` (jsonb) - Datos de hábitos (alcohol, tabaco, ejercicio, etc.)
      - `entorno_social` (jsonb) - Datos de entorno (vivienda, educación, ocupación, etc.)
      - `historial_adicional` (jsonb) - Datos de historial (vacunas, alergias, viajes, etc.)
      - `notas_generales` (text) - Notas adicionales

  2. Seguridad
    - Habilitar RLS en la tabla `tpPacienteHistNoPatologica`
    - Agregar políticas para usuarios autenticados que solo puedan acceder a sus propios registros

  3. Índices
    - Índice en `patient_id` para búsquedas por paciente
    - Índice en `user_id` para búsquedas por usuario
*/

CREATE TABLE IF NOT EXISTS public."tpPacienteHistNoPatologica" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  patient_id uuid NOT NULL,
  user_id uuid NOT NULL,
  habitos_estilo_vida jsonb NOT NULL DEFAULT '{}'::jsonb,
  entorno_social jsonb NOT NULL DEFAULT '{}'::jsonb,
  historial_adicional jsonb NOT NULL DEFAULT '{}'::jsonb,
  notas_generales text
);

-- Agregar claves foráneas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tpPacienteHistNoPatologica_patient_id_fkey'
  ) THEN
    ALTER TABLE public."tpPacienteHistNoPatologica" 
    ADD CONSTRAINT "tpPacienteHistNoPatologica_patient_id_fkey" 
    FOREIGN KEY (patient_id) REFERENCES public."tcPacientes"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tpPacienteHistNoPatologica_user_id_fkey'
  ) THEN
    ALTER TABLE public."tpPacienteHistNoPatologica" 
    ADD CONSTRAINT "tpPacienteHistNoPatologica_user_id_fkey" 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tppacientehistnopatologica_patient_id 
ON public."tpPacienteHistNoPatologica" (patient_id);

CREATE INDEX IF NOT EXISTS idx_tppacientehistnopatologica_user_id 
ON public."tpPacienteHistNoPatologica" (user_id);

-- Habilitar Row Level Security
ALTER TABLE public."tpPacienteHistNoPatologica" ENABLE ROW LEVEL SECURITY;

-- Política para lectura: usuarios autenticados pueden leer sus propios registros
CREATE POLICY "Usuarios pueden leer sus propios antecedentes no patológicos"
  ON public."tpPacienteHistNoPatologica"
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para inserción: usuarios autenticados pueden insertar sus propios registros
CREATE POLICY "Usuarios pueden insertar sus propios antecedentes no patológicos"
  ON public."tpPacienteHistNoPatologica"
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política para actualización: usuarios autenticados pueden actualizar sus propios registros
CREATE POLICY "Usuarios pueden actualizar sus propios antecedentes no patológicos"
  ON public."tpPacienteHistNoPatologica"
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política para eliminación: usuarios autenticados pueden eliminar sus propios registros
CREATE POLICY "Usuarios pueden eliminar sus propios antecedentes no patológicos"
  ON public."tpPacienteHistNoPatologica"
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());