-- supabase/migrations/20250822170000_create_gyneco_obstetric_history_table.sql
-- Crear la tabla tpPacienteHistGineObst
CREATE TABLE public."tpPacienteHistGineObst" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    patient_id uuid NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    idbu uuid NOT NULL DEFAULT get_useridbu(auth.uid()), -- Asume que get_useridbu existe y devuelve el idbu del usuario
    
    -- Campos específicos del historial gineco-obstétrico
    gestas integer,
    paras integer,
    abortos integer,
    cesareas integer,
    fum date, -- Fecha de última menstruación
    menarquia integer, -- Edad de la primera menstruación
    ritmo_menstrual text, -- Ej: "28x5"
    metodo_anticonceptivo text,
    fecha_ultimo_papanicolau date,
    resultado_ultimo_papanicolau text,
    mamografia date, -- Fecha de última mamografía
    resultado_mamografia text,
    notas_adicionales text,
    
    -- Claves Foráneas
    CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES public."tcPacientes"(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_idbu FOREIGN KEY (idbu) REFERENCES public."tcBu"("idBu") ON DELETE CASCADE
);

-- Comentario para la tabla
COMMENT ON TABLE public."tpPacienteHistGineObst" IS 'Historial Gineco-Obstétrico del Paciente';

-- Habilitar Row Level Security (RLS)
ALTER TABLE public."tpPacienteHistGineObst" ENABLE ROW LEVEL SECURITY;

-- Crear función para actualizar 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para 'updated_at'
CREATE TRIGGER set_tpPacienteHistGineObst_updated_at
BEFORE UPDATE ON public."tpPacienteHistGineObst"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Políticas de Row Level Security (RLS)

-- Permitir a los usuarios autenticados leer sus propios registros (basado en idbu)
CREATE POLICY "Enable read access for users based on idbu"
ON public."tpPacienteHistGineObst"
FOR SELECT
TO authenticated
USING (idbu = (SELECT get_useridbu(auth.uid())));

-- Permitir a los usuarios autenticados insertar registros para su idbu
CREATE POLICY "Enable insert for users based on idbu"
ON public."tpPacienteHistGineObst"
FOR INSERT
TO authenticated
WITH CHECK (idbu = (SELECT get_useridbu(auth.uid())));

-- Permitir a los usuarios autenticados actualizar sus propios registros (basado en idbu)
CREATE POLICY "Enable update for users based on idbu"
ON public."tpPacienteHistGineObst"
FOR UPDATE
TO authenticated
USING (idbu = (SELECT get_useridbu(auth.uid())))
WITH CHECK (idbu = (SELECT get_useridbu(auth.uid())));

-- Permitir a los usuarios autenticados eliminar sus propios registros (basado en idbu)
CREATE POLICY "Enable delete for users based on idbu"
ON public."tpPacienteHistGineObst"
FOR DELETE
TO authenticated
USING (idbu = (SELECT get_useridbu(auth.uid())));

