/*
  # Triggers Automáticos para Registro de Actividades

  1. Descripción
    - Triggers que registran automáticamente actividades importantes
    - Se ejecutan AFTER INSERT/UPDATE en tablas clave
    - Utilizan la función fn_registrar_actividad() para consistencia

  2. Triggers Creados
    - Citas: nueva cita, actualización de estado
    - Pacientes: nuevo paciente, actualización
    - Recetas: receta emitida
    - Historia clínica: registro creado
    - Evolución clínica: evolución registrada
    - Documentos: documento subido

  3. Configuración de Iconos y Colores
    - cita_nueva: Calendar (#3B82F6 - azul)
    - cita_actualizada: CalendarCheck (#10B981 - verde)
    - paciente_nuevo: UserPlus (#8B5CF6 - morado)
    - paciente_actualizado: UserCog (#F59E0B - ámbar)
    - receta: FileText (#EF4444 - rojo)
    - historia_clinica: FileHeart (#EC4899 - rosa)
    - evolucion: TrendingUp (#06B6D4 - cian)
    - documento: Upload (#6366F1 - índigo)
*/

-- ==========================================
-- TRIGGERS PARA CITAS (tcCitas)
-- ==========================================

-- Trigger: Nueva cita programada
CREATE OR REPLACE FUNCTION trg_actividad_cita_nueva()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_paciente text;
  v_hora_formato text;
BEGIN
  -- Obtener nombre del paciente
  v_nombre_paciente := fn_obtener_nombre_paciente(NEW.id_paciente);
  
  -- Formatear hora
  v_hora_formato := TO_CHAR(NEW.hora_cita::time, 'HH24:MI');
  
  -- Registrar actividad
  PERFORM fn_registrar_actividad(
    p_tipo_actividad := 'cita_nueva',
    p_descripcion := 'Nueva cita programada con ' || v_nombre_paciente,
    p_id_usuario := NEW.id_user,
    p_id_paciente := NEW.id_paciente,
    p_id_entidad := NEW.id,
    p_tipo_entidad := 'tcCitas',
    p_idbu := NEW."idBu",
    p_metadatos := jsonb_build_object(
      'fecha_cita', NEW.fecha_cita,
      'hora_cita', v_hora_formato,
      'motivo', NEW.motivo,
      'consultorio', NEW.consultorio
    ),
    p_es_critico := NEW.urgente,
    p_icono := 'Calendar',
    p_color := '#3B82F6'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cita_nueva
AFTER INSERT ON "tcCitas"
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_cita_nueva();

-- Trigger: Cita actualizada (cambio de estado)
CREATE OR REPLACE FUNCTION trg_actividad_cita_actualizada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_paciente text;
  v_estado_nombre text;
  v_icono text;
  v_color text;
BEGIN
  -- Solo registrar si cambió el estado
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    v_nombre_paciente := fn_obtener_nombre_paciente(NEW.id_paciente);
    
    -- Determinar nombre del estado y configuración visual
    SELECT estado, 
           CASE 
             WHEN NEW.estado = 1 THEN 'CalendarCheck'
             WHEN NEW.estado = 2 THEN 'CheckCircle'
             WHEN NEW.estado = 3 THEN 'XCircle'
             WHEN NEW.estado = 4 THEN 'Clock'
             ELSE 'Calendar'
           END,
           CASE 
             WHEN NEW.estado = 1 THEN '#3B82F6' -- Azul - Programada
             WHEN NEW.estado = 2 THEN '#10B981' -- Verde - Completada
             WHEN NEW.estado = 3 THEN '#EF4444' -- Rojo - Cancelada
             WHEN NEW.estado = 4 THEN '#F59E0B' -- Ámbar - En espera
             ELSE '#6B7280' -- Gris - Otro
           END
    INTO v_estado_nombre, v_icono, v_color
    FROM "tcCitasEstados"
    WHERE id = NEW.estado;
    
    -- Registrar actividad
    PERFORM fn_registrar_actividad(
      p_tipo_actividad := 'cita_actualizada',
      p_descripcion := 'Cita con ' || v_nombre_paciente || ' actualizada a ' || COALESCE(v_estado_nombre, 'estado desconocido'),
      p_id_usuario := COALESCE(NEW.id_user, auth.uid()),
      p_id_paciente := NEW.id_paciente,
      p_id_entidad := NEW.id,
      p_tipo_entidad := 'tcCitas',
      p_idbu := NEW."idBu",
      p_metadatos := jsonb_build_object(
        'estado_anterior', OLD.estado,
        'estado_nuevo', NEW.estado,
        'fecha_cita', NEW.fecha_cita
      ),
      p_es_critico := (NEW.estado = 3), -- Crítico si se cancela
      p_icono := v_icono,
      p_color := v_color
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cita_actualizada
AFTER UPDATE ON "tcCitas"
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_cita_actualizada();

-- ==========================================
-- TRIGGERS PARA PACIENTES (tcPacientes)
-- ==========================================

-- Trigger: Nuevo paciente registrado
CREATE OR REPLACE FUNCTION trg_actividad_paciente_nuevo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_completo text;
BEGIN
  v_nombre_completo := CONCAT(NEW."Nombre", ' ', NEW."Paterno", ' ', COALESCE(NEW."Materno", ''));
  
  PERFORM fn_registrar_actividad(
    p_tipo_actividad := 'paciente_nuevo',
    p_descripcion := 'Registro de nuevo paciente: ' || v_nombre_completo,
    p_id_usuario := NEW.user_id,
    p_id_paciente := NEW.id,
    p_id_entidad := NEW.id,
    p_tipo_entidad := 'tcPacientes',
    p_idbu := NEW.idbu,
    p_metadatos := jsonb_build_object(
      'sexo', NEW."Sexo",
      'fecha_nacimiento', NEW."FechaNacimiento",
      'telefono', NEW."Telefono"
    ),
    p_es_critico := false,
    p_icono := 'UserPlus',
    p_color := '#8B5CF6'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_paciente_nuevo
AFTER INSERT ON "tcPacientes"
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_paciente_nuevo();

-- Trigger: Paciente actualizado
CREATE OR REPLACE FUNCTION trg_actividad_paciente_actualizado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_completo text;
  v_cambios jsonb;
BEGIN
  -- Solo registrar si hay cambios significativos (no solo updated_at)
  IF (OLD."Nombre" IS DISTINCT FROM NEW."Nombre" OR
      OLD."Paterno" IS DISTINCT FROM NEW."Paterno" OR
      OLD."Materno" IS DISTINCT FROM NEW."Materno" OR
      OLD."Telefono" IS DISTINCT FROM NEW."Telefono" OR
      OLD."Email" IS DISTINCT FROM NEW."Email" OR
      OLD."Calle" IS DISTINCT FROM NEW."Calle") THEN
    
    v_nombre_completo := CONCAT(NEW."Nombre", ' ', NEW."Paterno", ' ', COALESCE(NEW."Materno", ''));
    
    -- Construir objeto con cambios
    v_cambios := '{}'::jsonb;
    
    IF OLD."Telefono" IS DISTINCT FROM NEW."Telefono" THEN
      v_cambios := v_cambios || jsonb_build_object('telefono_actualizado', true);
    END IF;
    
    IF OLD."Email" IS DISTINCT FROM NEW."Email" THEN
      v_cambios := v_cambios || jsonb_build_object('email_actualizado', true);
    END IF;
    
    PERFORM fn_registrar_actividad(
      p_tipo_actividad := 'paciente_actualizado',
      p_descripcion := 'Información actualizada de paciente: ' || v_nombre_completo,
      p_id_usuario := COALESCE(NEW.user_id, auth.uid()),
      p_id_paciente := NEW.id,
      p_id_entidad := NEW.id,
      p_tipo_entidad := 'tcPacientes',
      p_idbu := NEW.idbu,
      p_metadatos := v_cambios,
      p_es_critico := false,
      p_icono := 'UserCog',
      p_color := '#F59E0B'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_paciente_actualizado
AFTER UPDATE ON "tcPacientes"
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_paciente_actualizado();

-- ==========================================
-- TRIGGERS PARA RECETAS (prescriptions)
-- ==========================================

-- Trigger: Receta emitida
CREATE OR REPLACE FUNCTION trg_actividad_receta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_paciente text;
BEGIN
  v_nombre_paciente := fn_obtener_nombre_paciente(NEW.patient_id);
  
  PERFORM fn_registrar_actividad(
    p_tipo_actividad := 'receta',
    p_descripcion := 'Receta emitida para ' || v_nombre_paciente,
    p_id_usuario := NEW.user_id,
    p_id_paciente := NEW.patient_id,
    p_id_entidad := NEW.id,
    p_tipo_entidad := 'prescriptions',
    p_idbu := get_user_idbu_simple(),
    p_metadatos := jsonb_build_object(
      'numero_receta', NEW.prescription_number,
      'diagnostico', NEW.diagnosis,
      'fecha_emision', NEW.issue_date
    ),
    p_es_critico := false,
    p_icono := 'FileText',
    p_color := '#EF4444'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_receta_nueva
AFTER INSERT ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_receta();

-- ==========================================
-- TRIGGERS PARA EVOLUCIÓN CLÍNICA
-- ==========================================

-- Trigger: Evolución clínica registrada
CREATE OR REPLACE FUNCTION trg_actividad_evolucion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_paciente text;
BEGIN
  v_nombre_paciente := fn_obtener_nombre_paciente(NEW.patient_id);
  
  PERFORM fn_registrar_actividad(
    p_tipo_actividad := 'evolucion',
    p_descripcion := 'Evolución clínica registrada para ' || v_nombre_paciente,
    p_id_usuario := NEW.user_id,
    p_id_paciente := NEW.patient_id,
    p_id_entidad := NEW.id,
    p_tipo_entidad := 'clinical_evolution',
    p_idbu := get_user_idbu_simple(),
    p_metadatos := jsonb_build_object(
      'fecha_registro', NEW.created_at
    ),
    p_es_critico := false,
    p_icono := 'TrendingUp',
    p_color := '#06B6D4'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evolucion_nueva
AFTER INSERT ON clinical_evolution
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_evolucion();

-- ==========================================
-- TRIGGERS PARA DOCUMENTOS (tpDocPaciente)
-- ==========================================

-- Trigger: Documento subido
CREATE OR REPLACE FUNCTION trg_actividad_documento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nombre_paciente text;
BEGIN
  v_nombre_paciente := fn_obtener_nombre_paciente(NEW.patient_id);
  
  PERFORM fn_registrar_actividad(
    p_tipo_actividad := 'documento',
    p_descripcion := 'Documento subido al expediente de ' || v_nombre_paciente,
    p_descripcion_detalle := NEW.description,
    p_id_usuario := NEW.user_id,
    p_id_paciente := NEW.patient_id,
    p_id_entidad := NEW.id,
    p_tipo_entidad := 'tpDocPaciente',
    p_idbu := NEW.idbu,
    p_metadatos := jsonb_build_object(
      'tipo_mime', NEW.mime_type,
      'descripcion_documento', NEW.description
    ),
    p_es_critico := false,
    p_icono := 'Upload',
    p_color := '#6366F1'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_documento_nuevo
AFTER INSERT ON "tpDocPaciente"
FOR EACH ROW
EXECUTE FUNCTION trg_actividad_documento();

-- Comentarios
COMMENT ON FUNCTION trg_actividad_cita_nueva IS 'Registra actividad cuando se programa una nueva cita';
COMMENT ON FUNCTION trg_actividad_cita_actualizada IS 'Registra actividad cuando cambia el estado de una cita';
COMMENT ON FUNCTION trg_actividad_paciente_nuevo IS 'Registra actividad cuando se registra un nuevo paciente';
COMMENT ON FUNCTION trg_actividad_paciente_actualizado IS 'Registra actividad cuando se actualiza información de paciente';
COMMENT ON FUNCTION trg_actividad_receta IS 'Registra actividad cuando se emite una receta médica';
COMMENT ON FUNCTION trg_actividad_evolucion IS 'Registra actividad cuando se registra evolución clínica';
COMMENT ON FUNCTION trg_actividad_documento IS 'Registra actividad cuando se sube un documento al expediente';