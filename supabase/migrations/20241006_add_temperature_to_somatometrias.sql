-- Migration: Agregar campo de temperatura a tpSomatometrias
-- Fecha: 2024-10-06
-- Descripción: Agrega un campo de temperatura a la tabla de somatometrías con validación de rango

-- ============================================================================
-- 1. AGREGAR CAMPO DE TEMPERATURA A tpSomatometrias
-- ============================================================================

-- Agregar la columna de temperatura con validación de rango
ALTER TABLE public."tpSomatometrias" 
ADD COLUMN IF NOT EXISTS temperature numeric(3, 1) NULL
CONSTRAINT chk_temperature_range CHECK (temperature >= 30.0 AND temperature <= 45.0);

-- Agregar comentario a la columna
COMMENT ON COLUMN public."tpSomatometrias".temperature IS 'Temperatura corporal en grados Celsius. Rango válido: 30.0 a 45.0';

-- ============================================================================
-- 2. ACTUALIZAR VISTAS O FUNCIONES SI ES NECESARIO
-- ============================================================================

-- Aquí podrías agregar actualizaciones a vistas o funciones que necesiten incluir el nuevo campo

-- ============================================================================
-- 3. ACTUALIZAR POLÍTICAS RLS SI ES NECESARIO
-- ============================================================================

-- Las políticas RLS existentes ya cubren el acceso a la tabla,
-- por lo que no es necesario modificarlas a menos que se necesite
-- restringir el acceso al campo de temperatura específicamente.

-- ============================================================================
-- 4. ACTUALIZAR DOCUMENTACIÓN
-- ============================================================================

-- Agregar documentación sobre el nuevo campo
COMMENT ON TABLE public."tpSomatometrias" IS 'Almacena las mediciones de somatometría de los pacientes, incluyendo peso, talla, IMC y temperatura corporal.';
