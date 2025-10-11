/*
  # Seed Initial Vital Signs Catalog Data

  ## Summary
  Populates the tcSignosVitales catalog with common vital signs and their normal/critical
  ranges based on standard medical guidelines.

  ## Important Notes
    - For Oxygen Saturation, valor_critico_alto is NULL since 100% is maximum possible
    - Age ranges are in months
    - Multiple entries for same vital sign with different age groups
*/

DO $$
DECLARE
  v_idbu uuid;
  v_user_id uuid;
BEGIN
  SELECT "idBu" INTO v_idbu FROM "tcBu" LIMIT 1;
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_idbu IS NOT NULL THEN
    
    INSERT INTO "tcSignosVitales" (idbu, "Descripcion", "Unidad", sexo, edad_minima, edad_maxima, 
                                   valor_minimo_normal, valor_maximo_normal, valor_critico_bajo, 
                                   valor_critico_alto, frecuencia_registro, metodo_medicion, id_usuario)
    VALUES
    (v_idbu, 'Presión Arterial Sistólica (Neonato)', 'mmHg', 'AMBOS', 0, 1, 60.00, 80.00, 50.00, 90.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Sistólica (Lactante)', 'mmHg', 'AMBOS', 1, 12, 70.00, 90.00, 60.00, 105.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Sistólica (Niño 1-5 años)', 'mmHg', 'AMBOS', 12, 60, 80.00, 100.00, 70.00, 115.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Sistólica (Niño 6-12 años)', 'mmHg', 'AMBOS', 60, 144, 90.00, 110.00, 80.00, 125.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Sistólica (Adolescente)', 'mmHg', 'AMBOS', 144, 216, 100.00, 120.00, 90.00, 135.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Sistólica (Adulto)', 'mmHg', 'AMBOS', 216, 1200, 90.00, 120.00, 80.00, 180.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    
    (v_idbu, 'Presión Arterial Diastólica (Neonato)', 'mmHg', 'AMBOS', 0, 1, 35.00, 55.00, 30.00, 65.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Diastólica (Lactante)', 'mmHg', 'AMBOS', 1, 12, 40.00, 60.00, 35.00, 70.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Diastólica (Niño 1-5 años)', 'mmHg', 'AMBOS', 12, 60, 50.00, 65.00, 40.00, 75.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Diastólica (Niño 6-12 años)', 'mmHg', 'AMBOS', 60, 144, 55.00, 70.00, 45.00, 80.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Diastólica (Adolescente)', 'mmHg', 'AMBOS', 144, 216, 60.00, 75.00, 50.00, 85.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    (v_idbu, 'Presión Arterial Diastólica (Adulto)', 'mmHg', 'AMBOS', 216, 1200, 60.00, 80.00, 50.00, 120.00, 'Cada consulta', 'Esfigmomanómetro', v_user_id),
    
    (v_idbu, 'Frecuencia Cardíaca (Neonato)', 'lpm', 'AMBOS', 0, 1, 120.00, 160.00, 100.00, 180.00, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    (v_idbu, 'Frecuencia Cardíaca (Lactante)', 'lpm', 'AMBOS', 1, 12, 100.00, 150.00, 80.00, 170.00, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    (v_idbu, 'Frecuencia Cardíaca (Niño 1-5 años)', 'lpm', 'AMBOS', 12, 60, 80.00, 120.00, 70.00, 140.00, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    (v_idbu, 'Frecuencia Cardíaca (Niño 6-12 años)', 'lpm', 'AMBOS', 60, 144, 70.00, 110.00, 60.00, 130.00, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    (v_idbu, 'Frecuencia Cardíaca (Adolescente)', 'lpm', 'AMBOS', 144, 216, 60.00, 100.00, 50.00, 120.00, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    (v_idbu, 'Frecuencia Cardíaca (Adulto)', 'lpm', 'AMBOS', 216, 1200, 60.00, 100.00, 40.00, 140.00, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    
    (v_idbu, 'Frecuencia Respiratoria (Neonato)', 'rpm', 'AMBOS', 0, 1, 30.00, 60.00, 25.00, 70.00, 'Cada consulta', 'Observación', v_user_id),
    (v_idbu, 'Frecuencia Respiratoria (Lactante)', 'rpm', 'AMBOS', 1, 12, 25.00, 50.00, 20.00, 60.00, 'Cada consulta', 'Observación', v_user_id),
    (v_idbu, 'Frecuencia Respiratoria (Niño 1-5 años)', 'rpm', 'AMBOS', 12, 60, 20.00, 30.00, 15.00, 40.00, 'Cada consulta', 'Observación', v_user_id),
    (v_idbu, 'Frecuencia Respiratoria (Niño 6-12 años)', 'rpm', 'AMBOS', 60, 144, 18.00, 25.00, 12.00, 35.00, 'Cada consulta', 'Observación', v_user_id),
    (v_idbu, 'Frecuencia Respiratoria (Adolescente)', 'rpm', 'AMBOS', 144, 216, 16.00, 22.00, 12.00, 30.00, 'Cada consulta', 'Observación', v_user_id),
    (v_idbu, 'Frecuencia Respiratoria (Adulto)', 'rpm', 'AMBOS', 216, 1200, 12.00, 20.00, 8.00, 30.00, 'Cada consulta', 'Observación', v_user_id),
    
    (v_idbu, 'Temperatura Corporal', '°C', 'AMBOS', 0, 1200, 36.00, 37.50, 35.00, 39.50, 'Cada consulta', 'Termómetro digital', v_user_id),
    
    (v_idbu, 'Saturación de Oxígeno', '%', 'AMBOS', 0, 1200, 95.00, 100.00, 90.00, NULL, 'Cada consulta', 'Pulsioxímetro', v_user_id),
    
    (v_idbu, 'Peso (Neonato)', 'kg', 'AMBOS', 0, 1, 2.50, 5.00, 2.00, 6.00, 'Cada consulta', 'Báscula pediátrica', v_user_id),
    (v_idbu, 'Peso (Lactante)', 'kg', 'AMBOS', 1, 12, 4.00, 12.00, 3.50, 15.00, 'Cada consulta', 'Báscula pediátrica', v_user_id),
    (v_idbu, 'Peso (Niño)', 'kg', 'AMBOS', 12, 216, 10.00, 80.00, 8.00, 100.00, 'Cada consulta', 'Báscula', v_user_id),
    (v_idbu, 'Peso (Adulto)', 'kg', 'AMBOS', 216, 1200, 40.00, 120.00, 35.00, 200.00, 'Cada consulta', 'Báscula', v_user_id),
    
    (v_idbu, 'Talla (Neonato)', 'cm', 'AMBOS', 0, 1, 45.00, 55.00, 40.00, 60.00, 'Cada consulta', 'Infantómetro', v_user_id),
    (v_idbu, 'Talla (Lactante)', 'cm', 'AMBOS', 1, 12, 50.00, 80.00, 45.00, 90.00, 'Cada consulta', 'Infantómetro', v_user_id),
    (v_idbu, 'Talla (Niño)', 'cm', 'AMBOS', 12, 216, 75.00, 180.00, 70.00, 200.00, 'Cada consulta', 'Estadímetro', v_user_id),
    (v_idbu, 'Talla (Adulto)', 'cm', 'AMBOS', 216, 1200, 140.00, 200.00, 130.00, 220.00, 'Cada consulta', 'Estadímetro', v_user_id),
    
    (v_idbu, 'Perímetro Abdominal (Hombre)', 'cm', 'M', 216, 1200, 70.00, 94.00, 60.00, 120.00, 'Evaluación metabólica', 'Cinta métrica', v_user_id),
    (v_idbu, 'Perímetro Abdominal (Mujer)', 'cm', 'F', 216, 1200, 65.00, 80.00, 55.00, 110.00, 'Evaluación metabólica', 'Cinta métrica', v_user_id),
    
    (v_idbu, 'Glucosa en Ayunas', 'mg/dL', 'AMBOS', 0, 1200, 70.00, 100.00, 60.00, 250.00, 'Evaluación metabólica', 'Glucómetro', v_user_id),
    (v_idbu, 'Glucosa Posprandial', 'mg/dL', 'AMBOS', 0, 1200, 70.00, 140.00, 60.00, 300.00, 'Evaluación metabólica', 'Glucómetro', v_user_id)
    
    ON CONFLICT DO NOTHING;

  END IF;
END $$;