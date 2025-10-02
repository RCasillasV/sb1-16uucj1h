/*
  # Fix agendar_cita function to use integer estado

  1. Changes
    - Update agendar_cita function to insert estado as integer (1 = Programada)
    - Fix estado assignment to use 1 for normal appointments, 11 for urgent
    - Keep all existing validation logic intact
    - Maintain return type as uuid

  2. Security
    - No security changes
    - Function remains SECURITY DEFINER
    - Only accessible to authenticated users
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.agendar_cita(
    uuid, date, time, text, bigint, smallint, text, integer, text, text[], boolean, text
);

-- Recreate function with corrected estado handling
CREATE OR REPLACE FUNCTION public.agendar_cita(
    p_id_paciente uuid,
    p_fecha_cita date,
    p_hora_cita time,
    p_motivo text,
    p_consultorio bigint,
    p_duracion_minutos smallint,
    p_tipo_consulta text,
    p_tiempo_evolucion integer DEFAULT NULL,
    p_unidad_tiempo text DEFAULT NULL,
    p_sintomas_asociados text[] DEFAULT NULL,
    p_urgente boolean DEFAULT false,
    p_notas text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_idbu UUID;
    v_hora_fin TIME;
    v_start_datetime TIMESTAMP;
    v_end_datetime TIMESTAMP;
    v_agenda_settings public."tcAgendaSettings"%ROWTYPE;
    v_blocked_count INTEGER;
    v_overlap_count INTEGER;
    v_new_cita_id UUID;
    v_day_name_es TEXT;
    v_estado SMALLINT; -- Changed to store integer estado
BEGIN
    SET search_path = public;
    
    -- 1. Get current user ID and business unit
    v_user_id := auth.uid();

    SELECT idbu INTO v_idbu FROM public."tcUsuarios" WHERE idusuario = v_user_id;
    IF v_idbu IS NULL THEN
        RAISE EXCEPTION 'Usuario no asociado a una unidad de negocio.';
    END IF;

    -- 2. Get agenda settings for the business unit
    SELECT * INTO v_agenda_settings FROM public."tcAgendaSettings" WHERE idbu = v_idbu;
    IF v_agenda_settings IS NULL THEN
        RAISE EXCEPTION 'No se encontró configuración de agenda para esta unidad de negocio.';
    END IF;

    -- Calculate end time
    v_hora_fin := (p_hora_cita + (p_duracion_minutos || ' minutes')::INTERVAL)::TIME;

    -- Create timestamps for comparisons
    v_start_datetime := p_fecha_cita::TIMESTAMP + p_hora_cita::INTERVAL;
    v_end_datetime := p_fecha_cita::TIMESTAMP + v_hora_fin::INTERVAL;

    -- 3. Validate appointment is not in the past
    IF v_start_datetime < NOW() THEN
        RAISE EXCEPTION 'No se pueden agendar citas en el pasado.';
    END IF;

    -- 4. Validate it's a consultation day
    SELECT CASE EXTRACT(DOW FROM p_fecha_cita)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END INTO v_day_name_es;

    IF NOT (v_agenda_settings.consultation_days @> ARRAY[v_day_name_es]::TEXT[]) THEN
        RAISE EXCEPTION 'El día seleccionado no es un día de consulta configurado.';
    END IF;

    -- 5. Validate time is within office hours
    IF p_hora_cita < v_agenda_settings.start_time OR v_hora_fin > v_agenda_settings.end_time THEN
        RAISE EXCEPTION 'La hora seleccionada está fuera del horario de atención configurado (% - %).', v_agenda_settings.start_time, v_agenda_settings.end_time;
    END IF;

    -- 6. Validate date is not blocked
    SELECT COUNT(*)
    INTO v_blocked_count
    FROM public."tcAgendaBloqueada"
    WHERE idbu = v_idbu
      AND p_fecha_cita BETWEEN start_date AND end_date;

    IF v_blocked_count > 0 THEN
        RAISE EXCEPTION 'La fecha seleccionada está bloqueada y no se pueden agendar citas.';
    END IF;

    -- 7. Validate no overlap with existing appointments in same office
    SELECT COUNT(*)
    INTO v_overlap_count
    FROM public."tcCitas"
    WHERE fecha_cita = p_fecha_cita
      AND consultorio = p_consultorio
      AND estado IN (1, 2) -- 1=Programada, 2=Confirmada
      AND (
            (p_hora_cita, v_hora_fin) OVERLAPS (hora_cita, hora_fin)
          );

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'El slot de tiempo seleccionado ya está ocupado en este consultorio.';
    END IF;

    -- Determine estado: 1 = Programada, 11 = Urgente (if urgent flag is true)
    v_estado := CASE WHEN p_urgente THEN 11 ELSE 1 END;

    -- 8. Insert the new appointment with integer estado
    INSERT INTO public."tcCitas" (
        id_paciente,
        fecha_cita,
        hora_cita,
        duracion_minutos,
        hora_fin,
        consultorio,
        motivo,
        tipo_consulta,
        tiempo_evolucion,
        unidad_tiempo,
        sintomas_asociados,
        urgente,
        notas,
        id_user,
        "idBu",
        estado
    )
    VALUES (
        p_id_paciente,
        p_fecha_cita,
        p_hora_cita,
        p_duracion_minutos,
        v_hora_fin,
        p_consultorio,
        p_motivo,
        p_tipo_consulta,
        p_tiempo_evolucion,
        p_unidad_tiempo,
        p_sintomas_asociados,
        p_urgente,
        p_notas,
        v_user_id,
        v_idbu,
        v_estado -- Now using integer value
    )
    RETURNING id INTO v_new_cita_id;

    RETURN v_new_cita_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.agendar_cita(
    uuid, date, time, text, bigint, smallint, text, integer, text, text[], boolean, text
) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.agendar_cita IS 'Creates a new appointment with automatic user and business unit assignment, using integer estado values';
