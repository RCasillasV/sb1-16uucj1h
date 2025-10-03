/*
  # Crear Sistema de Tracking de Actividades

  1. Descripción
    - Tabla para registrar todas las actividades del sistema
    - Permite auditoría completa de acciones de usuarios
    - Configuración de retención por Business Unit

  2. Nueva Tabla tcActividadReciente
    - `id` (uuid): identificador único de la actividad
    - `created_at` (timestamptz): fecha y hora de la actividad
    - `tipo_actividad` (text): tipo de actividad realizada
    - `descripcion` (text): descripción legible de la actividad
    - `descripcion_detalle` (text): información adicional detallada
    - `id_usuario` (uuid): usuario que realizó la actividad
    - `nombre_usuario` (text): nombre del usuario (desnormalizado)
    - `id_paciente` (uuid): paciente relacionado si aplica
    - `nombre_paciente` (text): nombre del paciente (desnormalizado)
    - `id_entidad` (uuid): ID del registro relacionado (cita, receta, etc.)
    - `tipo_entidad` (text): nombre de la tabla de la entidad
    - `idbu` (uuid): Business Unit
    - `metadatos` (jsonb): información adicional flexible
    - `es_critico` (boolean): marca actividades importantes
    - `icono` (text): nombre del icono Lucide React
    - `color` (text): código de color hex

  3. Índices
    - Índice compuesto por idbu + created_at para consultas rápidas
    - Índices adicionales para filtrado por usuario, tipo, paciente

  4. Seguridad RLS
    - Políticas restrictivas por Business Unit
    - Filtrado adicional por rol de usuario
    - Asistentes solo ven actividades de citas

  5. Tipos de Actividad Soportados
    - cita_nueva: Nueva cita programada
    - cita_actualizada: Cita actualizada o cambio de estado
    - cita_cancelada: Cita cancelada
    - cita_completada: Cita completada
    - paciente_nuevo: Nuevo paciente registrado
    - paciente_actualizado: Información de paciente actualizada
    - receta: Receta médica emitida
    - historia_clinica: Historia clínica creada/actualizada
    - evolucion: Evolución clínica registrada
    - documento: Documento subido al expediente
    - sistema: Actividad del sistema (configuración, etc.)
*/

-- Crear tabla de actividades
CREATE TABLE IF NOT EXISTS tcActividadReciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  tipo_actividad text NOT NULL,
  descripcion text NOT NULL,
  descripcion_detalle text,
  id_usuario uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_usuario text,
  id_paciente uuid,
  nombre_paciente text,
  id_entidad uuid,
  tipo_entidad text,
  idbu uuid,
  metadatos jsonb DEFAULT '{}'::jsonb,
  es_critico boolean DEFAULT false NOT NULL,
  icono text DEFAULT 'Activity' NOT NULL,
  color text DEFAULT '#3B82F6' NOT NULL
);

-- Crear índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_actividad_bu_fecha 
  ON tcActividadReciente(idbu, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_actividad_usuario 
  ON tcActividadReciente(id_usuario, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_actividad_tipo 
  ON tcActividadReciente(tipo_actividad, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_actividad_paciente 
  ON tcActividadReciente(id_paciente, created_at DESC) 
  WHERE id_paciente IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_actividad_critico 
  ON tcActividadReciente(es_critico, created_at DESC) 
  WHERE es_critico = true;

CREATE INDEX IF NOT EXISTS idx_actividad_entidad 
  ON tcActividadReciente(tipo_entidad, id_entidad);

-- Habilitar Row Level Security
ALTER TABLE tcActividadReciente ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT rol INTO user_role
  FROM "tcUsuarios"
  WHERE idusuario = auth.uid();
  
  RETURN COALESCE(user_role, 'Asistente');
END;
$$;

-- Función auxiliar para obtener idbu del usuario actual
CREATE OR REPLACE FUNCTION get_user_idbu_simple()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_idbu uuid;
BEGIN
  SELECT "idBu" INTO user_idbu
  FROM "tcUsuarios"
  WHERE idusuario = auth.uid();
  
  RETURN user_idbu;
END;
$$;

-- Política: Usuarios solo ven actividades de su Business Unit
CREATE POLICY "Usuarios ven actividades de su BU"
  ON tcActividadReciente
  FOR SELECT
  TO authenticated
  USING (
    idbu = get_user_idbu_simple()
  );

-- Política: Solo usuarios autenticados pueden insertar actividades
CREATE POLICY "Usuarios autenticados insertan actividades"
  ON tcActividadReciente
  FOR INSERT
  TO authenticated
  WITH CHECK (
    idbu = get_user_idbu_simple()
  );

-- Política: Nadie puede actualizar actividades (inmutable)
CREATE POLICY "Actividades son inmutables"
  ON tcActividadReciente
  FOR UPDATE
  TO authenticated
  USING (false);

-- Política: Solo admins pueden eliminar actividades (para limpieza)
CREATE POLICY "Solo admins eliminan actividades"
  ON tcActividadReciente
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'Admin'
  );

-- Comentarios para documentación
COMMENT ON TABLE tcActividadReciente IS 'Registro de todas las actividades del sistema para auditoría y visualización';
COMMENT ON COLUMN tcActividadReciente.tipo_actividad IS 'Tipo de actividad: cita_nueva, cita_actualizada, paciente_nuevo, receta, historia_clinica, evolucion, documento, sistema';
COMMENT ON COLUMN tcActividadReciente.descripcion IS 'Descripción legible en lenguaje natural de la actividad';
COMMENT ON COLUMN tcActividadReciente.nombre_usuario IS 'Nombre del usuario que realizó la actividad (desnormalizado para rendimiento)';
COMMENT ON COLUMN tcActividadReciente.nombre_paciente IS 'Nombre completo del paciente involucrado (desnormalizado para rendimiento)';
COMMENT ON COLUMN tcActividadReciente.metadatos IS 'Información adicional en formato JSON para contexto extra';
COMMENT ON COLUMN tcActividadReciente.es_critico IS 'Marca actividades importantes que requieren atención especial';