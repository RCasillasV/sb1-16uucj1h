import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Search } from 'lucide-react';
import { api } from '../lib/api';
import { DiagnosisSearch } from '../components/DiagnosisSearch';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { CollapsibleRecord } from '../components/CollapsibleRecord';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface Diagnosis {
  Consecutivo: number;
  Catalog_Key: string;
  Nombre: string;
}

interface Prescription {
  id: string;
  created_at: string;
  numeroReceta: string;
  diagnosticoPrincipal: string;
  instruccionesGenerales: string | null;
  medications: Array<{
    nombreComercial: string;
    concentracion: string;
    presentacion: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    cantidadTotal: string;
    viaAdministracion: string;
    instruccionesAdicionales: string | null;
  }>;
}

interface MedicationFormData {
  nombreComercial: string;
  concentracion: string;
  presentacion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  cantidadTotal: string;
  viaAdministracion: string;
  instruccionesAdicionales: string;
}

const initialMedicationData: MedicationFormData = {
  nombreComercial: '',
  concentracion: '',
  presentacion: '',
  dosis: '',
  frecuencia: '',
  duracion: '',
  cantidadTotal: '',
  viaAdministracion: 'Oral',
  instruccionesAdicionales: '',
};

export function Prescriptions() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  // Formulario de receta
  const [numeroReceta, setNumeroReceta] = useState('');
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState<Diagnosis | null>(null);
  const [instruccionesGenerales, setInstruccionesGenerales] = useState('');
  const [medications, setMedications] = useState<MedicationFormData[]>([]);
  const [currentMedication, setCurrentMedication] = useState<MedicationFormData>(initialMedicationData);

  // Autocompletado de medicamentos
  const [medicationSuggestions, setMedicationSuggestions] = useState<Array<{
    id: string;
    nombreComercial: string;
    concentracion: string;
    presentacion: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchPrescriptions();
      generatePrescriptionNumber();
    }
  }, [selectedPatient, user, authLoading]);

  useEffect(() => {
    if (currentMedication.nombreComercial.length > 2) {
      searchMedications(currentMedication.nombreComercial);
    } else {
      setMedicationSuggestions([]);
      setShowSuggestions(false);
    }
  }, [currentMedication.nombreComercial]);

  const generatePrescriptionNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8);
    setNumeroReceta(`RX-${timestamp}`);
  };

  const handleDiagnosisSelect = (diagnosisOrArray: Diagnosis | Diagnosis[]) => {
    if (Array.isArray(diagnosisOrArray)) {
      // Si es un array (caso de reordenamiento), tomar el primero
      setDiagnosticoPrincipal(diagnosisOrArray[0] || null);
    } else {
      // Si es un objeto Diagnosis individual
      setDiagnosticoPrincipal(diagnosisOrArray);
    }
  };

  const handleDiagnosisRemove = (diagnosis: Diagnosis) => {
    setDiagnosticoPrincipal(null);
  };

  const searchMedications = async (searchTerm: string) => {
    try {
      const results = await api.medications.search(searchTerm);
      setMedicationSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching medications:', error);
      setMedicationSuggestions([]);
    }
  };

  const fetchPrescriptions = async () => {
    if (!selectedPatient) return;
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.prescriptions.getByPatientId(selectedPatient.id);
      const formattedPrescriptions = data.map(prescription => ({
        id: prescription.id,
        created_at: prescription.created_at,
        numeroReceta: prescription.prescription_number,
        diagnosticoPrincipal: prescription.diagnosis || '',
        instruccionesGenerales: prescription.special_instructions,
        medications: prescription.prescription_medications?.map(pm => ({
          nombreComercial: pm.medications?.name || '',
          concentracion: pm.medications?.concentration || '',
          presentacion: pm.medications?.presentation || '',
          dosis: pm.dosage,
          frecuencia: pm.frequency,
          duracion: pm.duration,
          cantidadTotal: pm.total_quantity,
          viaAdministracion: pm.administration_route,
          instruccionesAdicionales: pm.special_instructions,
        })) || []
      }));
      
      setPrescriptions(formattedPrescriptions);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las recetas. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (!currentMedication.nombreComercial.trim() || !currentMedication.dosis.trim()) {
      setError('Nombre del medicamento y dosis son obligatorios');
      return;
    }

    setMedications(prev => [...prev, { ...currentMedication }]);
    setCurrentMedication(initialMedicationData);
    setShowSuggestions(false);
    setError(null);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicationSuggestionSelect = (suggestion: any) => {
    setCurrentMedication(prev => ({
      ...prev,
      nombreComercial: suggestion.nombreComercial,
      concentracion: suggestion.concentracion,
      presentacion: suggestion.presentacion,
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient || !diagnosticoPrincipal || medications.length === 0) {
      setError('Diagnóstico principal (CIE-10) y al menos un medicamento son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.prescriptions.create({
        prescription_number: numeroReceta,
        patient_id: selectedPatient.id,
        diagnosis: `${diagnosticoPrincipal.Catalog_Key} - ${diagnosticoPrincipal.Nombre}`,
        special_instructions: instruccionesGenerales || null,
        medications: medications.map(med => ({
          name: med.nombreComercial,
          concentration: med.concentracion,
          presentation: med.presentacion,
          dosage: med.dosis,
          frequency: med.frecuencia,
          duration: med.duracion,
          quantity: med.cantidadTotal,
          administration_route: med.viaAdministracion,
          instructions: med.instruccionesAdicionales,
        }))
      });
      
      await fetchPrescriptions();
      
      // Limpiar formulario
      generatePrescriptionNumber();
      setDiagnosticoPrincipal(null);
      setInstruccionesGenerales('');
      setMedications([]);
      setCurrentMedication(initialMedicationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la receta');
    } finally {
      setSaving(false);
    }
  };

  const formatPrescriptionContent = (prescription: Prescription) => {
    let content = `<div class="prescription-content">`;
    
    // Diagnóstico principal
    content += `<div class="diagnosis-section">
      <h4 style="font-weight: bold; margin-bottom: 8px; color: ${currentTheme.colors.primary};">Diagnóstico:</h4>
      <p style="margin-bottom: 16px;">${prescription.diagnosticoPrincipal}</p>
    </div>`;

    // Medicamentos
    if (prescription.medications.length > 0) {
      content += `<div class="medications-section">
        <h4 style="font-weight: bold; margin-bottom: 8px; color: ${currentTheme.colors.primary};">Medicamentos Recetados:</h4>
        <div style="margin-bottom: 16px;">`;
      
      prescription.medications.forEach((med, index) => {
        content += `<div style="border: 1px solid ${currentTheme.colors.border}; padding: 12px; margin-bottom: 8px; border-radius: 6px; background: ${currentTheme.colors.background};">
          <div style="font-weight: bold; margin-bottom: 4px;">${index + 1}. ${med.nombreComercial}</div>
          <div style="font-size: 14px; color: ${currentTheme.colors.textSecondary}; margin-bottom: 4px;">
            <strong>Concentración:</strong> ${med.concentracion} | 
            <strong>Presentación:</strong> ${med.presentacion}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Dosis:</strong> ${med.dosis} | 
            <strong>Frecuencia:</strong> ${med.frecuencia}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Duración:</strong> ${med.duracion} | 
            <strong>Cantidad Total:</strong> ${med.cantidadTotal}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Vía de Administración:</strong> ${med.viaAdministracion}
          </div>
          ${med.instruccionesAdicionales ? `<div style="font-style: italic; color: ${currentTheme.colors.textSecondary};">
            <strong>Instrucciones adicionales:</strong> ${med.instruccionesAdicionales}
          </div>` : ''}
        </div>`;
      });
      
      content += `</div></div>`;
    }

    // Instrucciones generales
    if (prescription.instruccionesGenerales) {
      content += `<div class="instructions-section">
        <h4 style="font-weight: bold; margin-bottom: 8px; color: ${currentTheme.colors.primary};">Instrucciones Generales:</h4>
        <p style="font-style: italic;">${prescription.instruccionesGenerales}</p>
      </div>`;
    }

    content += `</div>`;
    return content;
  };

  const buttonStyle = {
    base: clsx(
      'px-4 py-2 transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
  };

  if (!selectedPatient) {
    return (
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="Selección de Paciente Requerida"
        actions={
          <button
            className={buttonStyle.base}
            style={buttonStyle.primary}
            onClick={() => {
              setShowWarningModal(false);
              navigate('/patients');
            }}
          >
            Entendido
          </button>
        }
      >
        <p>Por favor, seleccione un paciente primero desde la sección de Pacientes.</p>
      </Modal>
    );
  }

  return (
    <div className="w-full sm:w-[90%] lg:w-[80%] mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
        <h1 
          className="text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Recetas Médicas
        </h1>
      </div>

      <div 
        className="rounded-lg shadow-lg p-2"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {error && (
          <div 
            className="mb-4 p-4 rounded-md border-l-4"
            style={{
              background: '#FEE2E2',
              borderLeftColor: '#DC2626',
              color: '#DC2626',
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Nueva Receta */}
        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
           <h2 
            className="text-lg font-medium mb-4"
            style={{ 
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamily,
            }}
          >
            Nueva Receta Médica
             </h2>
  
          {/* Información básica de la receta */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-finish">
            <div className="md:col-span-4">
              <label 
                htmlFor="diagnosis-search" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Diagnóstico Principal (CIE-10) *
              </label>
              <DiagnosisSearch
                selectedDiagnoses={diagnosticoPrincipal ? [diagnosticoPrincipal] : []}
                onSelect={handleDiagnosisSelect}
                onRemove={handleDiagnosisRemove}
              />
            </div>

            <div className="md:col-span-1">
              <label 
                htmlFor="numeroReceta" 
                className="block text-sm font-medium mb-1"
                style={{ color: currentTheme.colors.text }}
              >
                Número de Receta
              </label>
              <input
                type="text"
                id="numeroReceta"
                value={numeroReceta}
                onChange={(e) => setNumeroReceta(e.target.value)}
                required
                className="w-full p-2 rounded-md border"
                style={{
                  background: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="instruccionesGenerales" 
              className="block text-sm font-medium mb-1"
              style={{ color: currentTheme.colors.text }}
            >
              Instrucciones Generales
            </label>
            <textarea
              id="instruccionesGenerales"
              value={instruccionesGenerales}
              onChange={(e) => setInstruccionesGenerales(e.target.value)}
              rows={3}
              className="w-full p-2 rounded-md border"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
                color: currentTheme.colors.text,
              }}
            />
          </div>

          {/* Sección de Medicamentos */}
          <div>
            <h3 
              className="text-md font-medium mb-4"
              style={{ color: currentTheme.colors.text }}
            >
              Medicamentos Recetados
            </h3>

            {/* Lista de medicamentos agregados */}
            {medications.length > 0 && (
              <div className="mb-4 space-y-2">
                {medications.map((med, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md border"
                    style={{
                      background: currentTheme.colors.background,
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: currentTheme.colors.text }}>
                        {med.nombreComercial} - {med.concentracion}
                      </div>
                      <div className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
                        {med.dosis} | {med.frecuencia} | {med.duracion}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(index)}
                      className="p-1 rounded-full hover:bg-red-100 transition-colors"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para agregar medicamento */}
            <div 
              className="p-4 rounded-md border-2 border-dashed space-y-3"
              style={{ borderColor: currentTheme.colors.border }}
            >
              <h4 className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
                Agregar Medicamento
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
                <div className="relative md:col-span-3">
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Nombre del Medicamento *
                  </label>
                  <input
                    type="text"
                    value={currentMedication.nombreComercial}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, nombreComercial: e.target.value }))}
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                  {showSuggestions && medicationSuggestions.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                      }}
                    >
                      {medicationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleMedicationSuggestionSelect(suggestion)}
                          className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                        >
                          <div className="font-medium">{suggestion.nombreComercial}</div>
                          <div className="text-xs text-gray-500">
                            {suggestion.concentracion} - {suggestion.presentacion}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Concentración
                  </label>
                  <input
                    type="text"
                    value={currentMedication.concentracion}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, concentracion: e.target.value }))}
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Presentación
                  </label>
                  <select
                    value={currentMedication.presentacion}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, presentacion: e.target.value }))}
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Tableta">Tableta</option>
                    <option value="Cápsula">Cápsula</option>
                    <option value="Jarabe">Jarabe</option>
                    <option value="Suspensión">Suspensión</option>
                    <option value="Inyectable">Inyectable</option>
                    <option value="Crema">Crema</option>
                    <option value="Pomada">Pomada</option>
                    <option value="Gotas">Gotas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Dosis *
                  </label>
                  <input
                    type="text"
                    value={currentMedication.dosis}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosis: e.target.value }))}
                    placeholder="ej: 1 tableta, 5ml"
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    value={currentMedication.frecuencia}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, frecuencia: e.target.value }))}
                    placeholder="ej: Cada 8 horas"
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Duración
                  </label>
                  <input
                    type="text"
                    value={currentMedication.duracion}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, duracion: e.target.value }))}
                    placeholder="ej: 7 días"
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Cantidad Total
                  </label>
                  <input
                    type="text"
                    value={currentMedication.cantidadTotal}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, cantidadTotal: e.target.value }))}
                    placeholder="ej: 30 tabletas"
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Vía de Administración
                  </label>
                  <select
                    value={currentMedication.viaAdministracion}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, viaAdministracion: e.target.value }))}
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  >
                    <option value="Oral">Oral</option>
                    <option value="Intravenosa">Intravenosa</option>
                    <option value="Intramuscular">Intramuscular</option>
                    <option value="Subcutánea">Subcutánea</option>
                    <option value="Tópica">Tópica</option>
                    <option value="Oftálmica">Oftálmica</option>
                    <option value="Ótica">Ótica</option>
                    <option value="Nasal">Nasal</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium mb-1" style={{ color: currentTheme.colors.text }}>
                    Instrucciones Adicionales
                  </label>
                  <textarea
                    value={currentMedication.instruccionesAdicionales}
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, instruccionesAdicionales: e.target.value }))}
                    rows={2}
                    placeholder="Instrucciones específicas para este medicamento"
                    className="w-full p-2 text-sm rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddMedication}
                  disabled={!currentMedication.nombreComercial.trim() || !currentMedication.dosis.trim()}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={{
                    background: currentTheme.colors.primary,
                    color: currentTheme.colors.buttonText,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Medicamento
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving || loading || !diagnosticoPrincipal || medications.length === 0}
              className={clsx(buttonStyle.base, 'disabled:opacity-50')}
              style={buttonStyle.primary}
            >
              {saving ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </form>

        {/* Historial de Recetas */}
        {prescriptions.length > 0 && (
          <div>
            <h2 
              className="text-lg font-medium mb-4 flex items-center gap-2"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fontFamily,
              }}
            >
              Historial de Recetas
              <span 
                className="px-2 py-1 text-sm rounded-full"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  color: currentTheme.colors.primary,
                }}
              >
                {prescriptions.length}
              </span>
            </h2>

            <div className="space-y-4">
              {prescriptions.map((prescription, index) => (
                <CollapsibleRecord
                  key={prescription.id}
                  date={`${format(new Date(prescription.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: require('date-fns/locale/es') })} - ${prescription.numeroReceta}`}
                  content={formatPrescriptionContent(prescription)}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}