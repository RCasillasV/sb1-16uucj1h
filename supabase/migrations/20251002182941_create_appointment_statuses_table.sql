/*
  # Create Appointment Status Table (tcCitasEstados)
  
  This migration creates the catalog table for appointment statuses used throughout the system.
  
  ## Table: tcCitasEstados
  
  This table stores all possible states that an appointment can have during its lifecycle.
  
  ### Structure
  - `id` (smallint, primary key) - Unique identifier for each status
  - `estado` (text, required) - Short name of the status (e.g., "Programada", "Confirmada")
  - `descripcion` (text, required) - Detailed description of what this status means
  - `usocita` (text, required) - Explanation of when/why this status is used
  - `color` (varchar, optional) - Hex color code for UI display
  
  ### Special Status: Estado 0 (Solicitada)
  
  **Important**: Status ID=0 is a logical concept used for:
  - Appointments requested online or by phone
  - Appointments in a waiting list
  - Initial state before being assigned to the schedule
  
  When a new appointment is created in the system, it can transition from Estado 0 to:
  - Estado 1 (Programada) - Normal scheduled appointment
  - Estado 11 (Urgencia) - Emergency appointment
  
  ### Status Catalog
  
  The system includes 17 different statuses covering the entire appointment lifecycle:
  - Initial states (0, 1, 11): Solicitation and scheduling
  - Confirmation states (2): Patient confirmation
  - Arrival states (3): Patient waiting
  - Active states (4): Consultation in progress
  - Completion states (5): Consultation finished
  - No-show/cancellation states (6, 7, 8): Various cancellation scenarios
  - Rescheduling states (9, 10): Patient or doctor rescheduling
  - Billing states (12, 13, 14): Payment and invoicing
  - Final state (15): Closed and archived
  - Special states (16): Patient left without being attended
  
  ## Security
  
  - Enable RLS on tcCitasEstados
  - Allow authenticated users to read all statuses (needed for UI dropdowns)
  - No insert/update/delete permissions for regular users (catalog data)
*/

-- Create the appointment statuses table
CREATE TABLE IF NOT EXISTS "tcCitasEstados" (
  id smallint PRIMARY KEY,
  estado text NOT NULL,
  descripcion text NOT NULL,
  usocita text NOT NULL,
  color varchar(7)
);

-- Insert all status records
INSERT INTO "tcCitasEstados" (id, estado, descripcion, usocita, color) VALUES
  (0, 'Solicitada', 'Cita solicitada, en espera de programar', 'Cuando el paciente agenda en línea o por teléfono. Queda en lista de espera de la confirmación.', '#9CA3AF'),
  (1, 'Programada', 'Cita agendada, en espera de confirmación', 'La etapa inicial de registrar una cita en calendario.', '#3B82F6'),
  (2, 'Confirmada', 'Cita confirmada por el paciente', 'Cuando el paciente ha confirmado cita Programada o se ha aceptado la cita solicitada.', '#22C55E'),
  (3, 'En Espera', 'El paciente ha llegado y está esperando', 'Cuando el paciente llega a recepción antes de su cita.', '#9CA3AF'),
  (4, 'En Progreso', 'Cita en curso en el consultorio', 'Cuando el médico hace pasar al paciente al consultorio e inicia consulta.', '#F59E0B'),
  (5, 'Atendida', 'Cita finalizada', 'Al concluir el medico la consulta, para marcar el final del evento.', '#10B981'),
  (6, 'No se Presentó', 'El paciente no asistió a la cita', 'Cuando la cita ha pasado y el paciente nunca llegó ni canceló.', '#EF4444'),
  (7, 'Cancelada x Paciente', 'Cita cancelada por el paciente', 'Cuando el paciente se comunica para anular su cita.', '#EF4444'),
  (8, 'Cancelada x Médico', 'Cita cancelada por el médico', 'Cuando el medico anula la cita.', '#EF4444'),
  (9, 'Reprogramada x Paciente', 'Cita reprogramada por el paciente', 'Cuando un paciente necesita mover su cita a una nueva fecha/hora.', '#6366F1'),
  (10, 'Reprogramada x Médico', 'Cita reprogramada por el médico', 'Cuando hay un cambio en la agenda del médico o del consultorio.', '#6366F1'),
  (11, 'Urgencia', 'Cita de urgencia', 'Cuando un paciente necesita ser visto inmediatamente sin una cita previa.', '#DC2626'),
  (12, 'Facturada', 'Cita ha sido atendida, facturada', 'Cuando ha sido emitida una factura por la cita atendida.', '#8B5CF6'),
  (13, 'Cortesía', 'Cita de cortesia o seguimiento', 'Cuando no ha sido requerido pago por la cita', '#14B8A6'),
  (14, 'Pagada', 'Cita pagada', 'Cuando el costo de la cita ha sido cubierto.', '#10B981'),
  (15, 'Cerrada', 'La cita y su proceso ha finalizado', 'Es el estado final de toda cita y ya no puede editarse, si no la tiene entonces aun esta en proceso y puede editarse.', '#6B7280'),
  (16, 'Se Retiró el Paciente', 'El paciente llegó a su cita pero se fue sin ser atendido.', 'Es cuando el paciente se presenta, espera y por su propia decisión decide abandonar la cita.', '#F97316')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE "tcCitasEstados" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all statuses
CREATE POLICY "Authenticated users can read appointment statuses"
  ON "tcCitasEstados"
  FOR SELECT
  TO authenticated
  USING (true);

-- Add helpful comments to the table
COMMENT ON TABLE "tcCitasEstados" IS 'Catalog table for appointment statuses. Estado 0 is a logical concept for waiting list/online requests.';
COMMENT ON COLUMN "tcCitasEstados".id IS 'Unique status identifier. Estado 0 = Solicitada (waiting list concept).';
COMMENT ON COLUMN "tcCitasEstados".estado IS 'Short status name displayed in the UI.';
COMMENT ON COLUMN "tcCitasEstados".descripcion IS 'Detailed description of the status meaning.';
COMMENT ON COLUMN "tcCitasEstados".usocita IS 'When and why this status should be used.';
COMMENT ON COLUMN "tcCitasEstados".color IS 'Hex color code for visual representation in UI.';