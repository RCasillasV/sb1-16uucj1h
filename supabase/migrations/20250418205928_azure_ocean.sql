/*
  # Rename Patients Table and Columns

  1. Changes
    - Rename 'patients' table to 'tcPacientes'
    - Rename columns to Spanish naming convention:
      - first_name -> Nombre
      - last_name -> Materno
      - paternal_surname -> Paterno

  2. Schema Updates
    - Update foreign key constraints
    - Update references in existing tables
*/

-- Rename the table
ALTER TABLE IF EXISTS patients 
  RENAME TO "tcPacientes";

-- Rename the columns
ALTER TABLE "tcPacientes" 
  RENAME COLUMN first_name TO "Nombre";

ALTER TABLE "tcPacientes" 
  RENAME COLUMN last_name TO "Materno";

ALTER TABLE "tcPacientes" 
  RENAME COLUMN paternal_surname TO "Paterno";

-- Update foreign key constraints in related tables
ALTER TABLE appointments 
  RENAME CONSTRAINT appointments_patient_id_fkey 
  TO appointments_tcpacientes_id_fkey;

ALTER TABLE clinical_histories 
  RENAME CONSTRAINT clinical_histories_patient_id_fkey 
  TO clinical_histories_tcpacientes_id_fkey;

ALTER TABLE clinical_evolution 
  RENAME CONSTRAINT clinical_evolution_patient_id_fkey 
  TO clinical_evolution_tcpacientes_id_fkey;

ALTER TABLE prescriptions 
  RENAME CONSTRAINT prescriptions_patient_id_fkey 
  TO prescriptions_tcpacientes_id_fkey;