/*
  # Add agendar_cita RPC function

  1. New Functions
    - `agendar_cita()`: Creates a new appointment with automatic user and business unit assignment
      - Parameters:
        - p_id_paciente: Patient ID (uuid)
        - p_fecha_cita: Appointment date (date)
        - p_hora_cita: Appointment time (time)
        - p_motivo: Appointment reason (text)
        - p_consultorio: Office number (integer)
        - p_duracion_minutos: Duration in minutes (integer)
        - p_tipo_consulta: Consultation type (text)
        - p_tiempo_evolucion: Evolution time (integer, optional)
        - p_unidad_tiempo: Time unit (text, optional)
        - p_sintomas_asociados: Associated symptoms (text array, optional)
        - p_urgente: Is urgent (boolean, optional)
        - p_notas: Additional notes (text, optional)
      - Output: JSON object with the created appointment ID

  2. Security
    - Function uses SECURITY DEFINER to insert into tcCitas
    - Only accessible to authenticated users
    - Automatically assigns auth.uid() as id_user
    - Automatically gets idbu from current user's tcUsuarios record

  3. Purpose
    - Centralizes appointment creation logic
    - Ensures proper user and business unit assignment
    - Provides consistent data validation
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.agendar_cita(
    uuid, date, time, text, integer, integer, text, integer, text, text[], boolean, text
);

-- Create the function
CREATE OR REPLACE FUNCTION public.agendar_cita(
    p_id_paciente uuid,
    p_fecha_cita date,
    p_hora_cita time,
    p_motivo text,
    p_consultorio integer,
    p_duracion_minutos integer,
    p_tipo_consulta text,
    p_tiempo_evolucion integer DEFAULT NULL,
    p_unidad_tiempo text DEFAULT NULL,
    p_sintomas_asociados text[] DEFAULT NULL,
    p_urgente boolean DEFAULT false,
    p_notas text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_idbu uuid;
    v_hora_fin time;
    v_estado integer;
    v_new_appointment_id uuid;
BEGIN
    -- Get current authenticated user
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Get user's business unit
    SELECT idbu INTO v_idbu
    FROM "tcUsuarios"
    WHERE idusuario = v_user_id;

    IF v_idbu IS NULL THEN
        RAISE EXCEPTION 'Usuario no tiene unidad de negocio asignada';
    END IF;

    -- Calculate end time
    v_hora_fin := p_hora_cita + (p_duracion_minutos || ' minutes')::interval;

    -- Determine initial state (1 = Programada, 11 = Urgente if p_urgente is true)
    v_estado := CASE WHEN p_urgente THEN 11 ELSE 1 END;

    -- Insert the appointment
    INSERT INTO "tcCitas" (
        id_paciente,
        id_user,
        fecha_cita,
        hora_cita,
        motivo,
        estado,
        consultorio,
        tipo_consulta,
        tiempo_evolucion,
        unidad_tiempo,
        sintomas_asociados,
        urgente,
        notas,
        duracion_minutos,
        hora_fin,
        "idBu"
    ) VALUES (
        p_id_paciente,
        v_user_id,
        p_fecha_cita,
        p_hora_cita,
        p_motivo,
        v_estado,
        p_consultorio,
        p_tipo_consulta,
        p_tiempo_evolucion,
        p_unidad_tiempo,
        p_sintomas_asociados,
        p_urgente,
        p_notas,
        p_duracion_minutos,
        v_hora_fin,
        v_idbu
    )
    RETURNING id INTO v_new_appointment_id;

    -- Return the created appointment info
    RETURN json_build_object(
        'id', v_new_appointment_id,
        'message', 'Cita creada exitosamente'
    );

EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error al crear la cita: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.agendar_cita(
    uuid, date, time, text, integer, integer, text, integer, text, text[], boolean, text
) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.agendar_cita IS 'Creates a new appointment with automatic user and business unit assignment';
