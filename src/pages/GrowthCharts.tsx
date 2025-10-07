import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { somatometryService } from '../services/somatometryService';
import { patients as patientService } from '../services/patientService';
import WHOWeightForAgeChart from '../components/GrowthCharts/WHOWeightForAgeChart';
import WHOWeightForAgeFromDB from '../components/GrowthCharts/WHOWeightForAgeFromDB';
import WHOHeightForAgeFromDB from '../components/GrowthCharts/WHOHeightForAgeFromDB';
import WHOBMIForAgeFromDB from '../components/GrowthCharts/WHOBMIForAgeFromDB';
import WHOHeadCircumferenceFromDB from '../components/GrowthCharts/WHOHeadCircumferenceFromDB';
import { SomatometryRecord } from '../types/somatometry';
import { Patient } from '../types/patient';

const GrowthCharts: React.FC = () => {
  const { currentTheme } = useTheme();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [somatometries, setSomatometries] = useState<SomatometryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar lista de pacientes
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const patientsData = await patientService.getAll();
        setPatients(patientsData);
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    loadPatients();
  }, []);

  // Cargar datos del paciente seleccionado
  useEffect(() => {
    const loadPatientData = async () => {
      if (!selectedPatientId) {
        setSelectedPatient(null);
        setSomatometries([]);
        return;
      }

      setLoading(true);
      try {
        // Cargar datos del paciente
        const patient = await patientService.getById(selectedPatientId);
        setSelectedPatient(patient);

        // Cargar somatometrías del paciente
        const somatometriesData = await somatometryService.getByPatient(selectedPatientId);
        setSomatometries(somatometriesData);
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [selectedPatientId]);

  // Preparar datos para la gráfica
  const patientGrowthData = somatometries.map(record => ({
    age_months: record.age_months || 0,
    weight: record.weight || 0,
    measurement_date: record.measurement_date
  })).sort((a, b) => a.age_months - b.age_months);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: currentTheme.colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamily 
            }}
          >
            📊 Gráficas de Crecimiento OMS
          </h1>
          <p className="text-lg" style={{ color: currentTheme.colors.textSecondary }}>
            Curvas de crecimiento según estándares de la Organización Mundial de la Salud
          </p>
        </div>

        {/* Selector de Paciente */}
        <div className="mb-8">
          <div 
            className="bg-white rounded-lg shadow-md p-6"
            style={{ backgroundColor: currentTheme.colors.surface }}
          >
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: currentTheme.colors.text }}
            >
              Seleccionar Paciente
            </h2>
            
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ 
                borderColor: currentTheme.colors.border,
                backgroundColor: currentTheme.colors.inputBackground,
                color: currentTheme.colors.text
              }}
            >
              <option value="">Seleccione un paciente...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.Nombre} {patient.Paterno} {patient.Materno} - {patient.Sexo === 'M' ? '👦' : '👧'}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold" style={{ color: currentTheme.colors.text }}>
                  Paciente Seleccionado:
                </h3>
                <p style={{ color: currentTheme.colors.textSecondary }}>
                  <strong>Nombre:</strong> {selectedPatient.Nombre} {selectedPatient.Paterno} {selectedPatient.Materno}
                </p>
                <p style={{ color: currentTheme.colors.textSecondary }}>
                  <strong>Sexo:</strong> {selectedPatient.Sexo === 'M' ? 'Masculino 👦' : 'Femenino 👧'}
                </p>
                <p style={{ color: currentTheme.colors.textSecondary }}>
                  <strong>Fecha de Nacimiento:</strong> {new Date(selectedPatient.FechaNacimiento).toLocaleDateString()}
                </p>
                <p style={{ color: currentTheme.colors.textSecondary }}>
                  <strong>Registros de Somatometría:</strong> {somatometries.length}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gráficas */}
        {selectedPatient && (
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2" style={{ color: currentTheme.colors.textSecondary }}>
                  Cargando datos del paciente...
                </p>
              </div>
            ) : (
              <>
                {/* Gráfica Peso/Edad - Datos Hardcodeados */}
                <div 
                  className="bg-white rounded-lg shadow-md p-6"
                  style={{ backgroundColor: currentTheme.colors.surface }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6 text-center"
                    style={{ color: currentTheme.colors.text }}
                  >
                    🔸 Peso para la Edad - {selectedPatient.Sexo === 'M' ? 'Niños' : 'Niñas'} (Datos Hardcodeados)
                  </h2>
                  
                  <WHOWeightForAgeChart
                    gender={selectedPatient.Sexo as 'M' | 'F'}
                    patientData={patientGrowthData}
                    patientName={`${selectedPatient.Nombre} ${selectedPatient.Paterno}`}
                  />
                  
                  <div className="text-center text-xs text-gray-500 mt-2">
                    📊 Datos: 8 puntos hardcodeados (0,6,12,18,24,36,48,60 meses)
                  </div>
                </div>

                {/* Gráfica Peso/Edad - Datos de BD */}
                <div 
                  className="bg-white rounded-lg shadow-md p-6"
                  style={{ backgroundColor: currentTheme.colors.surface }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6 text-center"
                    style={{ color: currentTheme.colors.text }}
                  >
                    🔹 Peso para la Edad - {selectedPatient.Sexo === 'M' ? 'Niños' : 'Niñas'} (Datos OMS BD)
                  </h2>
                  
                  <WHOWeightForAgeFromDB
                    records={somatometries}
                    gender={selectedPatient.Sexo as 'M' | 'F'}
                    patientName={`${selectedPatient.Nombre} ${selectedPatient.Paterno}`}
                  />
                  
                  {somatometries.length === 0 && (
                    <div className="text-center py-8">
                      <p style={{ color: currentTheme.colors.textSecondary }}>
                        No hay registros de somatometría para este paciente.
                      </p>
                      <p className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
                        Agregue mediciones desde el formulario de somatometrías.
                      </p>
                    </div>
                  )}
                </div>

                {/* Gráfica Talla/Edad - Datos de BD */}
                <div 
                  className="bg-white rounded-lg shadow-md p-6"
                  style={{ backgroundColor: currentTheme.colors.surface }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6 text-center"
                    style={{ color: currentTheme.colors.text }}
                  >
                    🔹 Talla para la Edad - {selectedPatient.Sexo === 'M' ? 'Niños' : 'Niñas'} (Datos OMS BD)
                  </h2>
                  
                  <WHOHeightForAgeFromDB
                    records={somatometries}
                    gender={selectedPatient.Sexo as 'M' | 'F'}
                    patientName={`${selectedPatient.Nombre} ${selectedPatient.Paterno}`}
                  />
                </div>

                {/* Gráfica IMC/Edad - Datos de BD */}
                <div 
                  className="bg-white rounded-lg shadow-md p-6"
                  style={{ backgroundColor: currentTheme.colors.surface }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6 text-center"
                    style={{ color: currentTheme.colors.text }}
                  >
                    🔹 IMC para la Edad - {selectedPatient.Sexo === 'M' ? 'Niños' : 'Niñas'} (Datos OMS BD)
                  </h2>
                  
                  <WHOBMIForAgeFromDB
                    records={somatometries}
                    gender={selectedPatient.Sexo as 'M' | 'F'}
                    patientName={`${selectedPatient.Nombre} ${selectedPatient.Paterno}`}
                  />
                </div>

                {/* Gráfica P.Cefálico/Edad - Datos de BD */}
                <div 
                  className="bg-white rounded-lg shadow-md p-6"
                  style={{ backgroundColor: currentTheme.colors.surface }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6 text-center"
                    style={{ color: currentTheme.colors.text }}
                  >
                    🔹 P.Cefálico para la Edad - {selectedPatient.Sexo === 'M' ? 'Niños' : 'Niñas'} (Datos OMS BD)
                  </h2>
                  
                  <WHOHeadCircumferenceFromDB
                    records={somatometries}
                    gender={selectedPatient.Sexo as 'M' | 'F'}
                    patientName={`${selectedPatient.Nombre} ${selectedPatient.Paterno}`}
                  />
                </div>

                {/* Información adicional */}
                {somatometries.length > 0 && (
                  <div 
                    className="bg-white rounded-lg shadow-md p-6"
                    style={{ backgroundColor: currentTheme.colors.surface }}
                  >
                    <h3 
                      className="text-lg font-semibold mb-4"
                      style={{ color: currentTheme.colors.text }}
                    >
                      📈 Resumen de Crecimiento
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {somatometries.length}
                        </p>
                        <p className="text-sm text-blue-800">Mediciones Registradas</p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {somatometries[somatometries.length - 1]?.weight?.toFixed(1) || 'N/A'} kg
                        </p>
                        <p className="text-sm text-green-800">Peso Actual</p>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {somatometries[somatometries.length - 1]?.age_months || 'N/A'} meses
                        </p>
                        <p className="text-sm text-purple-800">Edad Actual</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!selectedPatientId && (
          <div 
            className="text-center py-12 bg-white rounded-lg shadow-md"
            style={{ backgroundColor: currentTheme.colors.surface }}
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: currentTheme.colors.text }}
            >
              Seleccione un Paciente
            </h3>
            <p style={{ color: currentTheme.colors.textSecondary }}>
              Elija un paciente de la lista para ver sus gráficas de crecimiento OMS
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthCharts;
