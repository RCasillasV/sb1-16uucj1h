/*
  # Funciones para Sistema de Actividades

  1. Descripción
    - Función para registrar actividades de forma centralizada
    - Función para limpieza automática de actividades antiguas
    - Funciones helper para triggers

  2. Funciones Creadas
    - `fn_registrar_actividad()`: Función centralizada para registro de actividades
    - `fn_limpiar_actividades_antiguas()`: Limpia actividades según configuración de BU
    - `fn_obtener_nombre_paciente()`: Helper para obtener nombre de paciente
    - `fn_obtener_nombre_usuario()`: Helper para obtener nombre de usuario

  3. Uso
    - Las funciones se utilizan desde triggers automáticos
    - También pueden ser llamadas manualmente desde el código
*/

-- Función helper: Obtener nombre completo de paciente
CREATE OR REPLACE FUNCTION fn_obtener_nombre_paciente(patient_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  full_name text;
BEGIN
  SELECT CONCAT("Nombre", ' ', "Paterno", ' ', COALESCE("Materno", ''))
  INTO full_name
  FROM "tcPacientes"
  WHERE id = patient_id;
  
  RETURN COALESCE(full_name, 'Paciente Desconocido');
END;
$$;

-- Función helper: Obtener nombre de usuario
CREATE OR REPLACE FUNCTION fn_obtener_nombre_usuario(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_name text;
BEGIN
  -- Primero intentar obtener de tcUsuarios
  SELECT nombre INTO user_name
  FROM "tcUsuarios"
  WHERE idusuario = user_id;
  
  -- Si no existe en tcUsuarios, intentar de auth.users
  IF user_name IS NULL THEN
    SELECT COALESCE(
      raw_user_meta_data->>'name',
      raw_user_meta_data->>'full_name',
      email
    )
    INTO user_name
    FROM auth.users
    WHERE id = user_id;
  END IF;
  
  RETURN COALESCE(user_name, 'Usuario Desconocido');
END;
$$;

-- Función principal: Registrar actividad
CREATE OR REPLACE FUNCTION fn_registrar_actividad(
  p_tipo_actividad text,
  p_descripcion text,
  p_id_usuario uuid DEFAULT NULL,
  p_id_paciente uuid DEFAULT NULL,
  p_id_entidad uuid DEFAULT NULL,
  p_tipo_entidad text DEFAULT NULL,
  p_idbu uuid DEFAULT NULL,
  p_metadatos jsonb DEFAULT '{}'::jsonb,
  p_es_critico boolean DEFAULT false,
  p_icono text DEFAULT 'Activity',
  p_color text DEFAULT '#3B82F6',
  p_descripcion_detalle text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
  v_nombre_usuario text;
  v_nombre_paciente text;
  v_idbu uuid;
BEGIN
  -- Obtener idbu si no se proporcionó
  IF p_idbu IS NULL THEN
    v_idbu := get_user_idbu_simple();
  ELSE
    v_idbu := p_idbu;
  END IF;
  
  -- Obtener nombre de usuario si hay id_usuario
  IF p_id_usuario IS NOT NULL THEN
    v_nombre_usuario := fn_obtener_nombre_usuario(p_id_usuario);
  ELSE
    -- Usar el usuario actual si no se especificó
    v_nombre_usuario := fn_obtener_nombre_usuario(auth.uid());
  END IF;
  
  -- Obtener nombre de paciente si hay id_paciente
  IF p_id_paciente IS NOT NULL THEN
    v_nombre_paciente := fn_obtener_nombre_paciente(p_id_paciente);
  END IF;
  
  -- Insertar la actividad
  INSERT INTO "tcActividadReciente" (
    tipo_actividad,
    descripcion,
    descripcion_detalle,
    id_usuario,
    nombre_usuario,
    id_paciente,
    nombre_paciente,
    id_entidad,
    tipo_entidad,
    idbu,
    metadatos,
    es_critico,
    icono,
    color
  ) VALUES (
    p_tipo_actividad,
    p_descripcion,
    p_descripcion_detalle,
    COALESCE(p_id_usuario, auth.uid()),
    v_nombre_usuario,
    p_id_paciente,
    v_nombre_paciente,
    p_id_entidad,
    p_tipo_entidad,
    v_idbu,
    p_metadatos,
    p_es_critico,
    p_icono,
    p_color
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Función: Limpiar actividades antiguas según configuración de BU
CREATE OR REPLACE FUNCTION fn_limpiar_actividades_antiguas()
RETURNS TABLE(
  idbu_limpiado uuid,
  registros_eliminados bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bu_record RECORD;
  deleted_count bigint;
  fecha_limite timestamptz;
BEGIN
  -- Iterar sobre cada Business Unit
  FOR bu_record IN 
    SELECT "idBu", dias_retencion_actividad 
    FROM "tcBu"
  LOOP
    -- Calcular fecha límite basada en días de retención
    fecha_limite := now() - (bu_record.dias_retencion_actividad || ' days')::interval;
    
    -- Eliminar actividades antiguas de este BU
    DELETE FROM "tcActividadReciente"
    WHERE idbu = bu_record."idBu"
    AND created_at < fecha_limite;
    
    -- Obtener cantidad eliminada
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Retornar resultado si se eliminó algo
    IF deleted_count > 0 THEN
      idbu_limpiado := bu_record."idBu";
      registros_eliminados := deleted_count;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Función helper: Obtener configuración de actividades de BU
CREATE OR REPLACE FUNCTION fn_obtener_config_actividades(p_idbu uuid)
RETURNS TABLE(
  dias_retencion integer,
  notificaciones_realtime boolean,
  exportar_actividades boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.dias_retencion_actividad,
    b.notificaciones_realtime,
    b.exportar_actividades
  FROM "tcBu" b
  WHERE b."idBu" = p_idbu;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION fn_registrar_actividad TO authenticated;
GRANT EXECUTE ON FUNCTION fn_limpiar_actividades_antiguas TO authenticated;
GRANT EXECUTE ON FUNCTION fn_obtener_nombre_paciente TO authenticated;
GRANT EXECUTE ON FUNCTION fn_obtener_nombre_usuario TO authenticated;
GRANT EXECUTE ON FUNCTION fn_obtener_config_actividades TO authenticated;

-- Comentarios
COMMENT ON FUNCTION fn_registrar_actividad IS 'Función centralizada para registrar actividades del sistema con información contextual completa';
COMMENT ON FUNCTION fn_limpiar_actividades_antiguas IS 'Elimina actividades antiguas según la configuración de días de retención de cada Business Unit';
COMMENT ON FUNCTION fn_obtener_nombre_paciente IS 'Obtiene el nombre completo de un paciente dado su UUID';
COMMENT ON FUNCTION fn_obtener_nombre_usuario IS 'Obtiene el nombre de un usuario dado su UUID';