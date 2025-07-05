/*
  # Add duration fields to tcCitas table
  
  1. Changes
     - Add `duracion_minutos` column with default value of 30
     - Add `hora_fin` column to store the end time of appointments
*/

ALTER TABLE "tcCitas"
ADD COLUMN duracion_minutos INTEGER DEFAULT 30;

ALTER TABLE "tcCitas"
ADD COLUMN hora_fin time without time zone null;