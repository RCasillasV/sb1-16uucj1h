/*
  # Create Appointment Status Transitions Table (tcCitasEdoTrans)
  
  This migration creates the table that defines allowed state transitions for appointments.
  
  ## Table: tcCitasEdoTrans
  
  This table acts as a state machine configuration, defining which status changes are valid.
  The frontend uses this table to filter available status options in dropdown menus.
  
  ### Structure
  - `id` (smallint, primary key) - Unique identifier for the transition
  - `estado_origen_id` (smallint, required, FK) - The current/source status
  - `estado_destino_id` (smallint, required, FK) - The allowed destination status
  - `descripcion` (text, optional) - Explanation of when this transition occurs
  
  ### Important Transitions from Estado 0 (Solicitada)
  
  When creating a NEW appointment, the system starts from Estado 0 (logical concept) and can transition to:
  - **Estado 1 (Programada)**: Normal scheduled appointment
  - **Estado 11 (Urgencia)**: Emergency appointment
  
  These are the only two options available when creating a new appointment in the UI.
  
  ### State Machine Logic
  
  The transitions define a complete workflow:
  1. **Initial Scheduling**: 0 → 1, 0 → 11, 1 → 1
  2. **Confirmation**: 1 → 2
  3. **Arrival**: 1,2 → 3
  4. **Consultation**: 3 → 4, 4 → 5, 11 → 5
  5. **Cancellations**: 1,2,9,10 → 6,7,8
  6. **Rescheduling**: 1,2 → 9,10, and 9,10 → 9,10 (multiple reschedules)
  7. **Billing**: 5 → 13,14, 14 → 12
  8. **Closure**: 14 → 15, 15 → 15
  9. **Early Exit**: 3 → 16
  
  ### Validation Strategy
  
  **IMPORTANT**: Status transitions are validated ONLY on the frontend.
  - No database triggers enforce transitions
  - No RPC functions validate state changes
  - The frontend calls `getFilteredStatusOptions()` to get allowed next states
  - Backend trusts the frontend to send valid transitions
  
  This design allows flexibility for admin overrides and special cases while maintaining
  a clear workflow for regular users.
  
  ## Security
  
  - Enable RLS on tcCitasEdoTrans
  - Allow authenticated users to read all transitions (needed for UI logic)
  - No insert/update/delete permissions for regular users (configuration data)
*/

-- Create the appointment status transitions table
CREATE TABLE IF NOT EXISTS "tcCitasEdoTrans" (
  id smallint PRIMARY KEY,
  estado_origen_id smallint NOT NULL,
  estado_destino_id smallint NOT NULL,
  descripcion text,
  CONSTRAINT fk_estado_origen FOREIGN KEY (estado_origen_id) 
    REFERENCES "tcCitasEstados"(id) ON DELETE RESTRICT,
  CONSTRAINT fk_estado_destino FOREIGN KEY (estado_destino_id) 
    REFERENCES "tcCitasEstados"(id) ON DELETE RESTRICT
);

-- Insert all transition records
INSERT INTO "tcCitasEdoTrans" (id, estado_origen_id, estado_destino_id, descripcion) VALUES
  -- Initial transitions from Estado 0 (Solicitada)
  (4, 0, 1, 'La solicitud ha sido aprobada y programada.'),
  (38, 0, 11, 'El paciente llega sin agendar como urgencia y se le asigna el espacio.'),
  
  -- Self-transition for direct scheduling
  (2, 1, 1, 'La cita ha sido programada directamente por el personal.'),
  
  -- Transitions from Estado 1 (Programada)
  (15, 1, 2, 'La cita ha sido confirmada por el paciente.'),
  (14, 1, 3, 'El paciente ha llegado y espera a ser atendido.'),
  (13, 1, 6, 'El paciente no se presentó a su cita.'),
  (9, 1, 7, 'El paciente canceló su cita.'),
  (10, 1, 8, 'El médico o personal canceló la cita.'),
  (11, 1, 9, 'El paciente solicitó una reprogramación.'),
  (12, 1, 10, 'El médico o personal reprogramó la cita.'),
  (3, 1, 11, 'La cita ha sido agendada como una urgencia.'),
  
  -- Transitions from Estado 2 (Confirmada)
  (16, 2, 3, 'El paciente ha llegado y espera a ser atendido.'),
  (17, 2, 6, 'El paciente no se presentó a su cita.'),
  (20, 2, 7, 'El paciente canceló su cita.'),
  (21, 2, 8, 'El médico o personal canceló la cita.'),
  (18, 2, 9, 'El paciente solicitó una reprogramación.'),
  (19, 2, 10, 'El médico o personal reprogramó la cita.'),
  
  -- Transitions from Estado 3 (En Espera)
  (5, 3, 4, 'El paciente ha sido llamado a su consulta.'),
  (7, 3, 11, 'La consulta pasó a ser atendida como una urgencia.'),
  (6, 3, 16, 'El paciente se fue de la clínica sin ser atendido.'),
  
  -- Transitions from Estado 4 (En Progreso)
  (22, 4, 5, 'La consulta ha finalizado.'),
  
  -- Transitions from Estado 5 (Atendida)
  (24, 5, 13, 'La consulta ha sido marcada como cortesía.'),
  (25, 5, 14, 'La consulta ha sido pagada.'),
  
  -- Transitions from Estado 9 (Reprogramada x Paciente)
  (28, 9, 2, 'La cita reprogramada ha sido confirmada.'),
  (31, 9, 7, 'La cita reprogramada fue cancelada por el paciente.'),
  (32, 9, 8, 'La cita reprogramada fue cancelada por el médico.'),
  (30, 9, 9, 'La cita fue reprogramada nuevamente por el paciente.'),
  (29, 9, 10, 'La cita fue reprogramada nuevamente por el médico.'),
  
  -- Transitions from Estado 10 (Reprogramada x Médico)
  (33, 10, 2, 'La cita reprogramada ha sido confirmada.'),
  (36, 10, 7, 'La cita reprogramada fue cancelada por el paciente.'),
  (37, 10, 8, 'La cita reprogramada fue cancelada por el médico.'),
  (35, 10, 9, 'La cita fue reprogramada nuevamente por el paciente.'),
  (34, 10, 10, 'La cita fue reprogramada nuevamente por el médico.'),
  
  -- Transitions from Estado 11 (Urgencia)
  (23, 11, 5, 'La urgencia ha sido atendida.'),
  
  -- Transitions from Estado 14 (Pagada)
  (27, 14, 12, 'Se ha generado la factura de la cita.'),
  (26, 14, 15, 'La cita ha completado su proceso y se cierra.'),
  
  -- Transitions from Estado 15 (Cerrada) - Final state
  (1, 15, 15, 'La cita ha sido solicitada por el paciente.')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE "tcCitasEdoTrans" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all transitions
CREATE POLICY "Authenticated users can read appointment transitions"
  ON "tcCitasEdoTrans"
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for efficient lookups by source status
CREATE INDEX IF NOT EXISTS idx_tcCitasEdoTrans_origen 
  ON "tcCitasEdoTrans"(estado_origen_id);

-- Create index for efficient lookups by destination status
CREATE INDEX IF NOT EXISTS idx_tcCitasEdoTrans_destino 
  ON "tcCitasEdoTrans"(estado_destino_id);

-- Add helpful comments to the table
COMMENT ON TABLE "tcCitasEdoTrans" IS 'State machine configuration for appointment status transitions. Used by frontend to filter available status options.';
COMMENT ON COLUMN "tcCitasEdoTrans".estado_origen_id IS 'Current status of the appointment. Estado 0 represents new appointments.';
COMMENT ON COLUMN "tcCitasEdoTrans".estado_destino_id IS 'Allowed next status. Frontend filters dropdown options based on these transitions.';
COMMENT ON COLUMN "tcCitasEdoTrans".descripcion IS 'Explanation of when/why this transition should occur.';