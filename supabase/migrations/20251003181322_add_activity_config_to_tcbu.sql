/*
  # Agregar Configuración de Actividades a Business Units

  1. Descripción
    - Agrega columnas de configuración para el sistema de actividades recientes
    - Permite que cada Business Unit controle su retención y funcionalidades

  2. Nuevas Columnas en tcBu
    - `dias_retencion_actividad` (integer): días que se mantiene el historial (30-365, default 90)
    - `notificaciones_realtime` (boolean): habilitar notificaciones en tiempo real (default false)
    - `exportar_actividades` (boolean): permitir exportación de reportes (default true)

  3. Notas
    - Valores por defecto conservadores para no afectar rendimiento
    - Columnas opcionales, no afectan funcionalidad existente
    - Facilita auditoría y control por organización
*/

-- Agregar columna para días de retención de actividad
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcBu' AND column_name = 'dias_retencion_actividad'
  ) THEN
    ALTER TABLE "tcBu" ADD COLUMN dias_retencion_actividad integer DEFAULT 90 NOT NULL;
  END IF;
END $$;

-- Agregar columna para habilitar notificaciones en tiempo real
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcBu' AND column_name = 'notificaciones_realtime'
  ) THEN
    ALTER TABLE "tcBu" ADD COLUMN notificaciones_realtime boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Agregar columna para permitir exportación de actividades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tcBu' AND column_name = 'exportar_actividades'
  ) THEN
    ALTER TABLE "tcBu" ADD COLUMN exportar_actividades boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Agregar constraint para validar rango de días de retención (30-365 días)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tcbu_dias_retencion_check'
  ) THEN
    ALTER TABLE "tcBu" 
    ADD CONSTRAINT tcbu_dias_retencion_check 
    CHECK (dias_retencion_actividad >= 30 AND dias_retencion_actividad <= 365);
  END IF;
END $$;

-- Comentarios para documentación
COMMENT ON COLUMN "tcBu".dias_retencion_actividad IS 'Número de días que se mantiene el historial de actividades (rango: 30-365)';
COMMENT ON COLUMN "tcBu".notificaciones_realtime IS 'Habilitar notificaciones en tiempo real para nuevas actividades';
COMMENT ON COLUMN "tcBu".exportar_actividades IS 'Permitir exportación de reportes de actividades a CSV/PDF';