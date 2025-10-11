import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Filter, Activity } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { vitalSignsService } from '../services/vitalSignsService';
import { VitalSignRecordForm } from '../components/VitalSignRecordForm';
import { VitalSignsHistory } from '../components/VitalSignsHistory';
import { VitalSignsTrendsChart } from '../components/VitalSignsTrendsChart';
import { Modal } from '../components/Modal';
import type { VitalSignCatalog, VitalSignRecord, VitalSignFormData } from '../types/vitalSigns.types';

export const VitalSigns: React.FC = () => {
  const { selectedPatient } = useSelectedPatient();
  const [catalog, setCatalog] = useState<VitalSignCatalog[]>([]);
  const [records, setRecords] = useState<VitalSignRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<VitalSignRecord[]>([]);
  const [selectedVitalSignType, setSelectedVitalSignType] = useState<string>('all');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [trendRecords, setTrendRecords] = useState<VitalSignRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const idbu = localStorage.getItem('idbu') || '';
  const userId = localStorage.getItem('userId') || '';

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (selectedPatient?.id) {
      loadRecords();
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedVitalSignType === 'all') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter((r) => r.id_signo_vital === selectedVitalSignType);
      setFilteredRecords(filtered);
    }
  }, [selectedVitalSignType, records]);

  const loadCatalog = async () => {
    try {
      const data = await vitalSignsService.getCatalog(idbu);
      setCatalog(data);
    } catch (error) {
      console.error('Error loading catalog:', error);
    }
  };

  const loadRecords = async () => {
    if (!selectedPatient?.id) return;

    setIsLoading(true);
    try {
      const data = await vitalSignsService.getPatientRecords(selectedPatient.id, 100);
      setRecords(data);
      setFilteredRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRecord = async (formData: VitalSignFormData) => {
    if (!selectedPatient?.id) return;

    try {
      await vitalSignsService.createRecord(selectedPatient.id, idbu, userId, formData);
      await loadRecords();
      setShowRecordForm(false);
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Error al guardar el registro de signo vital');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await vitalSignsService.softDeleteRecord(id);
      await loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Error al eliminar el registro');
    }
  };

  const handleViewTrends = async (vitalSignId: string) => {
    if (!selectedPatient?.id) return;

    try {
      const data = await vitalSignsService.getPatientRecordsByType(selectedPatient.id, vitalSignId, 30);
      setTrendRecords(data);
      setShowTrendsModal(true);
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const getPatientAge = () => {
    if (!selectedPatient?.FechaNacimiento) return undefined;
    const birthDate = new Date(selectedPatient.FechaNacimiento);
    const today = new Date();
    const ageInYears = today.getFullYear() - birthDate.getFullYear();
    return ageInYears;
  };

  const uniqueVitalSignTypes = Array.from(
    new Map(
      records.map((r) => [r.id_signo_vital, { id: r.id_signo_vital, descripcion: r.tcSignosVitales?.Descripcion }])
    ).values()
  );

  if (!selectedPatient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Signos Vitales</h2>
          <p className="text-gray-600">Seleccione un paciente para ver y registrar signos vitales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Signos Vitales
              </h1>
              <p className="text-gray-600 mt-2">
                Paciente: {selectedPatient.Nombre} {selectedPatient.ApellidoPaterno}{' '}
                {selectedPatient.ApellidoMaterno}
              </p>
            </div>
            <button
              onClick={() => setShowRecordForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Registrar Signos Vitales
            </button>
          </div>

          {records.length > 0 && (
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedVitalSignType}
                onChange={(e) => setSelectedVitalSignType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los signos vitales</option>
                {uniqueVitalSignTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.descripcion}
                  </option>
                ))}
              </select>
              {selectedVitalSignType !== 'all' && (
                <button
                  onClick={() => handleViewTrends(selectedVitalSignType)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Ver Tendencias
                </button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando registros...</p>
          </div>
        ) : (
          <VitalSignsHistory records={filteredRecords} onDelete={handleDeleteRecord} />
        )}
      </div>

      {showRecordForm && (
        <Modal
          isOpen={showRecordForm}
          onClose={() => setShowRecordForm(false)}
          title="Registrar Signos Vitales"
          size="large"
        >
          <VitalSignRecordForm
            catalog={catalog}
            patientId={selectedPatient.id}
            patientAge={getPatientAge()}
            patientSex={selectedPatient.Sexo as 'M' | 'F'}
            onSubmit={handleSubmitRecord}
            onCancel={() => setShowRecordForm(false)}
          />
        </Modal>
      )}

      {showTrendsModal && trendRecords.length > 0 && (
        <Modal
          isOpen={showTrendsModal}
          onClose={() => setShowTrendsModal(false)}
          title={`Tendencias - ${trendRecords[0]?.tcSignosVitales?.Descripcion || 'Signo Vital'}`}
          size="large"
        >
          <VitalSignsTrendsChart
            records={trendRecords}
            title={`Evolución en el tiempo (últimos 30 registros)`}
          />
        </Modal>
      )}
    </div>
  );
};
