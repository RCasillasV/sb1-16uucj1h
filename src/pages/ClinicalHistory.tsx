import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface FamilyMember {
  id: string;
  parentesco: string;
  estadoVital: string;
  edad: string;
  patologias: string[];
  observaciones: string;
  type: 'fixed' | 'dynamic';
}

interface PathologicalHistory {
  chronicDiseases: string[];
  otherChronicDiseases: string;
  surgeries: Array<{ id: string; type: string; date: string; notes: string }>;
  hospitalizations: Array<{ id: string; reason: string; date: string; duration: string; notes: string }>;
  allergies: string;
  transfusions: string;
  immunizationStatus: 'complete' | 'incomplete' | 'unknown' | '';
  immunizationDetails: string;
  currentMedications: string;
  toxicHabits: string[];
  otherToxicHabits: string;
  generalNotes: string;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({ title, children, defaultExpanded = false }: CollapsibleSectionProps) {
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={clsx(
        'border rounded-lg overflow-hidden transition-all duration-200',
        isExpanded ? 'shadow-md' : 'hover:shadow-sm'
      )}
      style={{
        background: currentTheme.colors.surface,
        borderColor: currentTheme.colors.border,
      }}
    >
      <button
        onClick={toggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between transition-colors hover:bg-black/5"
        style={{
          background: isExpanded ? `${currentTheme.colors.primary}10` : 'transparent',
          color: currentTheme.colors.text,
        }}
        aria-expanded={isExpanded}
      >
        <h3 className="text-lg font-medium text-left">{title}</h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
        )}
      </button>
      
      <div
        className={clsx(
          'transition-all duration-200 origin-top',
          isExpanded ? 'opacity-100' : 'opacity-0 h-0'
        )}
      >
        {isExpanded && (
          <div className="px-6 py-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function ClinicalHistory() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);
  
  // Family history data
  const initialFamilyHistory: FamilyMember[] = [
    { id: 'madre', parentesco: 'Madre', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
    { id: 'abuela_materna', parentesco: 'Abuela (Materna)', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
    { id: 'abuelo_materno', parentesco: 'Abuelo (Materno)', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
    { id: 'padre', parentesco: 'Padre', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
    { id: 'abuela_paterna', parentesco: 'Abuela (Paterna)', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
    { id: 'abuelo_paterno', parentesco: 'Abuelo (Paterno)', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
    { id: 'hermanos', parentesco: 'Hermanos', estadoVital: '', edad: '', patologias: [], observaciones: '', type: 'fixed' },
  ];

  const [familyHistoryData, setFamilyHistoryData] = useState<FamilyMember[]>(initialFamilyHistory);
  const [showExtraRelatives, setShowExtraRelatives] = useState(false);
  const [nextDynamicId, setNextDynamicId] = useState(1);

  // Pathological history state
  const [pathologicalHistoryData, setPathologicalHistoryData] = useState<PathologicalHistory>({
    chronicDiseases: [],
    otherChronicDiseases: '',
    surgeries: [],
    hospitalizations: [],
    allergies: '',
    transfusions: '',
    immunizationStatus: '',
    immunizationDetails: '',
    currentMedications: '',
    toxicHabits: [],
    otherToxicHabits: '',
    generalNotes: '',
  });
  const [nextSurgeryId, setNextSurgeryId] = useState(1);
  const [nextHospitalizationId, setNextHospitalizationId] = useState(1);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
  }, [selectedPatient, user, authLoading]);

  // Family history handlers
  const handleVitalStatusChange = (id: string, value: string) => {
    setFamilyHistoryData(prev => 
      prev.map(member => 
        member.id === id 
          ? { ...member, estadoVital: value, edad: value.includes('Fallecid') ? '' : member.edad }
          : member
      )
    );
  };

  const handleInputChange = (id: string, field: keyof FamilyMember, value: string | string[]) => {
    setFamilyHistoryData(prev => 
      prev.map(member => 
        member.id === id 
          ? { ...member, [field]: value }
          : member
      )
    );
  };

  const toggleMoreRelatives = () => {
    setShowExtraRelatives(prev => !prev);
  };

  const addExtraRelative = () => {
    const newRelative: FamilyMember = {
      id: `dynamic_${nextDynamicId}`,
      parentesco: '',
      estadoVital: '',
      edad: '',
      patologias: [],
      observaciones: '',
      type: 'dynamic'
    };
    setFamilyHistoryData(prev => [...prev, newRelative]);
    setNextDynamicId(prev => prev + 1);
  };

  const handleSubmitFamilyHistory = () => {
    // TODO: Implement save functionality
    console.log('Family history data:', familyHistoryData);
    alert('Antecedentes familiares guardados (funcionalidad en desarrollo)');
  };

  // Pathological history handlers
  const handlePathologicalInputChange = (field: keyof PathologicalHistory, value: string | string[]) => {
    setPathologicalHistoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePathologicalCheckboxChange = (field: 'chronicDiseases' | 'toxicHabits', value: string, isChecked: boolean) => {
    setPathologicalHistoryData(prev => ({
      ...prev,
      [field]: isChecked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleAddSurgery = () => {
    const newSurgery = {
      id: `surgery_${nextSurgeryId}`,
      type: '',
      date: '',
      notes: ''
    };
    setPathologicalHistoryData(prev => ({
      ...prev,
      surgeries: [...prev.surgeries, newSurgery]
    }));
    setNextSurgeryId(prev => prev + 1);
  };

  const handleUpdateSurgery = (index: number, field: keyof PathologicalHistory['surgeries'][0], value: string) => {
    setPathologicalHistoryData(prev => ({
      ...prev,
      surgeries: prev.surgeries.map((surgery, i) => 
        i === index ? { ...surgery, [field]: value } : surgery
      )
    }));
  };

  const handleRemoveSurgery = (index: number) => {
    setPathologicalHistoryData(prev => ({
      ...prev,
      surgeries: prev.surgeries.filter((_, i) => i !== index)
    }));
  };

  const handleAddHospitalization = () => {
    const newHospitalization = {
      id: `hospitalization_${nextHospitalizationId}`,
      reason: '',
      date: '',
      duration: '',
      notes: ''
    };
    setPathologicalHistoryData(prev => ({
      ...prev,
      hospitalizations: [...prev.hospitalizations, newHospitalization]
    }));
    setNextHospitalizationId(prev => prev + 1);
  };

  const handleUpdateHospitalization = (index: number, field: keyof PathologicalHistory['hospitalizations'][0], value: string) => {
    setPathologicalHistoryData(prev => ({
      ...prev,
      hospitalizations: prev.hospitalizations.map((hosp, i) => 
        i === index ? { ...hosp, [field]: value } : hosp
      )
    }));
  };

  const handleRemoveHospitalization = (index: number) => {
    setPathologicalHistoryData(prev => ({
      ...prev,
      hospitalizations: prev.hospitalizations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitPathologicalHistory = () => {
    // TODO: Implement save functionality
    console.log('Pathological history data:', pathologicalHistoryData);
    alert('Antecedentes patológicos guardados (funcionalidad en desarrollo)');
  };

  const getBackgroundColor = (parentesco: string) => {
    if (parentesco.includes('Madre') || parentesco.includes('Abuela (Materna)') || parentesco.includes('Abuelo (Materno)')) {
      return '#ffe6e6';
    }
    if (parentesco.includes('Padre') || parentesco.includes('Abuela (Paterna)') || parentesco.includes('Abuelo (Paterno)')) {
      return '#e6f3ff';
    }
    if (parentesco.includes('Hermanos')) {
      return '#fff3e6';
    }
    return 'transparent';
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
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 shrink-0" style={{ color: currentTheme.colors.primary }} />
        <h1 
          className="text-xl sm:text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Ficha Clínica
        </h1>
      </div>

      <div 
        className="rounded-lg shadow-lg p-4 sm:p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="space-y-4">
          {/* Antecedentes Heredo-Familiares */}
          <CollapsibleSection title="1. Antecedentes Heredo-Familiares">
            <div>


              <div className="form-group table-container overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: currentTheme.colors.background }}>
                      <th 
                        style={{ 
                          border: `1px solid ${currentTheme.colors.border}`, 
                          padding: '8px', 
                          textAlign: 'center',
                          color: currentTheme.colors.textSecondary,
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Parentesco
                      </th>
                      <th 
                        style={{ 
                          border: `1px solid ${currentTheme.colors.border}`, 
                          padding: '8px', 
                          textAlign: 'center',
                          color: currentTheme.colors.textSecondary,
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Estado Vital
                      </th>
                      <th 
                        style={{ 
                          border: `1px solid ${currentTheme.colors.border}`, 
                          padding: '8px', 
                          textAlign: 'center',
                          color: currentTheme.colors.textSecondary,
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Edad
                      </th>
                      <th 
                        style={{ 
                          border: `1px solid ${currentTheme.colors.border}`, 
                          padding: '8px', 
                          textAlign: 'center',
                          color: currentTheme.colors.textSecondary,
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Patologías
                      </th>
                      <th 
                        style={{ 
                          border: `1px solid ${currentTheme.colors.border}`, 
                          padding: '8px', 
                          textAlign: 'center',
                          color: currentTheme.colors.textSecondary,
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyHistoryData.filter(member => member.type === 'fixed').map((member) => (
                      <tr 
                        key={member.id}
                        style={{ background: getBackgroundColor(member.parentesco) }}
                      >
                        <td 
                          style={{ 
                            border: `1px solid ${currentTheme.colors.border}`, 
                            padding: '8px', 
                            textAlign: 'center',
                            color: currentTheme.colors.text,
                            fontWeight: '500'
                          }}
                        >
                          {member.parentesco}
                        </td>
                        <td 
                          style={{ 
                            border: `1px solid ${currentTheme.colors.border}`, 
                            padding: '8px', 
                            textAlign: 'center'
                          }}
                        >
                          <select
                            value={member.estadoVital}
                            onChange={(e) => handleVitalStatusChange(member.id, e.target.value)}
                            style={{ 
                              padding: '6px', 
                              width: '100%', 
                              border: `1px solid ${currentTheme.colors.border}`,
                              borderRadius: '4px',
                              background: currentTheme.colors.surface, 
                              color: currentTheme.colors.text
                            }}
                          >
                            <option value="">Seleccione</option>
                            {member.parentesco.includes('Madre') || member.parentesco.includes('Abuela') ? (
                              <>
                                <option value="Viva">Viva</option>
                                <option value="Fallecida">Fallecida</option>
                              </>
                            ) : (
                              <>
                                <option value="Vivo">Vivo</option>
                                <option value="Fallecido">Fallecido</option>
                              </>
                            )}
                          </select>
                        </td>
                        <td 
                          style={{ 
                            border: `1px solid ${currentTheme.colors.border}`, 
                            padding: '8px', 
                            textAlign: 'center'
                          }}
                        >
                          <input
                            type="text"
                            value={member.edad}
                            onChange={(e) => handleInputChange(member.id, 'edad', e.target.value)}
                            disabled={member.estadoVital === '' || member.estadoVital.includes('Fallecid')}
                            placeholder="Edad"
                            style={{ 
                              padding: '6px', 
                              width: '100%',
                              border: `1px solid ${currentTheme.colors.border}`,
                              borderRadius: '4px',
                              background: currentTheme.colors.surface, 
                              color: currentTheme.colors.text,
                              opacity: member.estadoVital === '' || member.estadoVital.includes('Fallecid') ? 0.5 : 1
                            }}
                          />
                        </td>
                        <td 
                          style={{ 
                            border: `1px solid ${currentTheme.colors.border}`, 
                            padding: '8px', 
                            textAlign: 'center'
                          }}
                        >
                          <select
                            multiple
                            value={member.patologias}
                            onChange={(e) => handleInputChange(member.id, 'patologias', Array.from(e.target.selectedOptions, option => option.value))}
                            style={{ 
                              padding: '6px', 
                              width: '100%',
                              minHeight: '60px',
                              border: `1px solid ${currentTheme.colors.border}`,
                              borderRadius: '4px',
                              background: currentTheme.colors.surface, 
                              color: currentTheme.colors.text
                            }}
                          >
                            <option value="Diabetes">Diabetes</option>
                            <option value="Diabetes Tipo 1">Diabetes Tipo 1</option>
                            <option value="Diabetes Tipo 2">Diabetes Tipo 2</option>
                            <option value="Hipertensión">Hipertensión</option>
                            <option value="Hipertensión Arterial">Hipertensión Arterial</option>
                            <option value="Cáncer">Cáncer</option>
                            <option value="Cáncer de Mama">Cáncer de Mama</option>
                            <option value="Cáncer de Próstata">Cáncer de Próstata</option>
                            <option value="Cáncer de Colon">Cáncer de Colon</option>
                            <option value="Cáncer de Pulmón">Cáncer de Pulmón</option>
                            <option value="Cáncer Gástrico">Cáncer Gástrico</option>
                            <option value="Cardiopatías">Cardiopatías</option>
                            <option value="Infarto al Miocardio">Infarto al Miocardio</option>
                            <option value="Enfermedad Coronaria">Enfermedad Coronaria</option>
                            <option value="Arritmias">Arritmias</option>
                            <option value="Epilepsia">Epilepsia</option>
                            <option value="Asma">Asma</option>
                            <option value="EPOC">EPOC</option>
                            <option value="Bronquitis Crónica">Bronquitis Crónica</option>
                            <option value="Depresión">Depresión</option>
                            <option value="Ansiedad">Ansiedad</option>
                            <option value="Trastorno Bipolar">Trastorno Bipolar</option>
                            <option value="Esquizofrenia">Esquizofrenia</option>
                            <option value="Alzheimer">Alzheimer</option>
                            <option value="Demencia">Demencia</option>
                            <option value="Parkinson">Parkinson</option>
                            <option value="Artritis">Artritis</option>
                            <option value="Artritis Reumatoide">Artritis Reumatoide</option>
                            <option value="Osteoartritis">Osteoartritis</option>
                            <option value="Osteoporosis">Osteoporosis</option>
                            <option value="Obesidad">Obesidad</option>
                            <option value="Sobrepeso">Sobrepeso</option>
                            <option value="Hipercolesterolemia">Hipercolesterolemia</option>
                            <option value="Triglicéridos Altos">Triglicéridos Altos</option>
                            <option value="Enfermedad Renal">Enfermedad Renal</option>
                            <option value="Insuficiencia Renal">Insuficiencia Renal</option>
                            <option value="Cirrosis">Cirrosis</option>
                            <option value="Hepatitis">Hepatitis</option>
                            <option value="Tiroides">Problemas de Tiroides</option>
                            <option value="Hipotiroidismo">Hipotiroidismo</option>
                            <option value="Hipertiroidismo">Hipertiroidismo</option>
                            <option value="Migraña">Migraña</option>
                            <option value="Cefalea">Cefalea Crónica</option>
                            <option value="Glaucoma">Glaucoma</option>
                            <option value="Cataratas">Cataratas</option>
                            <option value="Sordera">Sordera</option>
                            <option value="Alcoholismo">Alcoholismo</option>
                            <option value="Tabaquismo">Tabaquismo</option>
                            <option value="Drogadicción">Drogadicción</option>
                            <option value="Alergia Medicamentosa">Alergia Medicamentosa</option>
                            <option value="Alergia Alimentaria">Alergia Alimentaria</option>
                            <option value="Fibromialgia">Fibromialgia</option>
                            <option value="Lupus">Lupus</option>
                            <option value="Esclerosis Múltiple">Esclerosis Múltiple</option>
                            <option value="VIH/SIDA">VIH/SIDA</option>
                            <option value="Tuberculosis">Tuberculosis</option>
                            <option value="Ninguna">Ninguna</option>
                            <option value="Otra">Otra</option>
                          </select>
                        </td>
                        <td 
                          style={{ 
                            border: `1px solid ${currentTheme.colors.border}`, 
                            padding: '8px', 
                            textAlign: 'center'
                          }}
                        >
                          <input
                            type="text"
                            value={member.observaciones}
                            onChange={(e) => handleInputChange(member.id, 'observaciones', e.target.value)}
                            placeholder="Observaciones"
                            style={{ 
                              padding: '6px', 
                              width: '100%',
                              border: `1px solid ${currentTheme.colors.border}`,
                              borderRadius: '4px',
                              background: currentTheme.colors.surface, 
                              color: currentTheme.colors.text
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={toggleMoreRelatives}
                    className={buttonStyle.base}
                    style={{ 
                      background: currentTheme.colors.secondary,
                      color: currentTheme.colors.buttonText,
                      fontSize: '0.875rem'
                    }}
                  >
                    {showExtraRelatives ? 'Ocultar' : 'Mostrar'} Más Parientes
                  </button>
                </div>

                {showExtraRelatives && (
                  <div className="mt-4">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {familyHistoryData.filter(member => member.type === 'dynamic').map((member) => (
                          <tr key={member.id}>
                            <td 
                              style={{ 
                                border: `1px solid ${currentTheme.colors.border}`, 
                                padding: '8px', 
                                textAlign: 'center'
                              }}
                            >
                              <input
                                type="text"
                                placeholder="Parentesco (ej. Tío, Prima)"
                                value={member.parentesco}
                                onChange={(e) => handleInputChange(member.id, 'parentesco', e.target.value)}
                                style={{ 
                                  padding: '6px', 
                                  width: '100%',
                                  border: `1px solid ${currentTheme.colors.border}`,
                                  borderRadius: '4px',
                                  background: currentTheme.colors.surface, 
                                  color: currentTheme.colors.text
                                }}
                              />
                            </td>
                            <td 
                              style={{ 
                                border: `1px solid ${currentTheme.colors.border}`, 
                                padding: '8px', 
                                textAlign: 'center'
                              }}
                            >
                              <select
                                value={member.estadoVital}
                                onChange={(e) => handleVitalStatusChange(member.id, e.target.value)}
                                style={{ 
                                  padding: '6px', 
                                  width: '100%',
                                  border: `1px solid ${currentTheme.colors.border}`,
                                  borderRadius: '4px',
                                  background: currentTheme.colors.surface, 
                                  color: currentTheme.colors.text
                                }}
                              >
                                <option value="">Seleccione</option>
                                <option value="Vivo">Vivo</option>
                                <option value="Fallecido">Fallecido</option>
                                <option value="Viva">Viva</option>
                                <option value="Fallecida">Fallecida</option>
                              </select>
                            </td>
                            <td 
                              style={{ 
                                border: `1px solid ${currentTheme.colors.border}`, 
                                padding: '8px', 
                                textAlign: 'center'
                              }}
                            >
                              <input
                                type="text"
                                value={member.edad}
                                onChange={(e) => handleInputChange(member.id, 'edad', e.target.value)}
                                disabled={member.estadoVital === '' || member.estadoVital.includes('Fallecid')}
                                placeholder="Edad"
                                style={{ 
                                  padding: '6px', 
                                  width: '100%',
                                  border: `1px solid ${currentTheme.colors.border}`,
                                  borderRadius: '4px',
                                  background: currentTheme.colors.surface, 
                                  color: currentTheme.colors.text,
                                  opacity: member.estadoVital === '' || member.estadoVital.includes('Fallecid') ? 0.5 : 1
                                }}
                              />
                            </td>
                            <td 
                              style={{ 
                                border: `1px solid ${currentTheme.colors.border}`, 
                                padding: '8px', 
                                textAlign: 'center'
                              }}
                            >
                              <select
                                multiple
                                value={member.patologias}
                                onChange={(e) => handleInputChange(member.id, 'patologias', Array.from(e.target.selectedOptions, option => option.value))}
                                style={{ 
                                  padding: '6px', 
                                  width: '100%',
                                  minHeight: '60px',
                                  border: `1px solid ${currentTheme.colors.border}`,
                                  borderRadius: '4px',
                                  background: currentTheme.colors.surface, 
                                  color: currentTheme.colors.text
                                }}
                              >
                                <option value="Diabetes">Diabetes</option>
                                <option value="Diabetes Tipo 1">Diabetes Tipo 1</option>
                                <option value="Diabetes Tipo 2">Diabetes Tipo 2</option>
                                <option value="Hipertensión">Hipertensión</option>
                                <option value="Hipertensión Arterial">Hipertensión Arterial</option>
                                <option value="Cáncer">Cáncer</option>
                                <option value="Cáncer de Mama">Cáncer de Mama</option>
                                <option value="Cáncer de Próstata">Cáncer de Próstata</option>
                                <option value="Cáncer de Colon">Cáncer de Colon</option>
                                <option value="Cáncer de Pulmón">Cáncer de Pulmón</option>
                                <option value="Cáncer Gástrico">Cáncer Gástrico</option>
                                <option value="Cardiopatías">Cardiopatías</option>
                                <option value="Infarto al Miocardio">Infarto al Miocardio</option>
                                <option value="Enfermedad Coronaria">Enfermedad Coronaria</option>
                                <option value="Arritmias">Arritmias</option>
                                <option value="Epilepsia">Epilepsia</option>
                                <option value="Asma">Asma</option>
                                <option value="EPOC">EPOC</option>
                                <option value="Bronquitis Crónica">Bronquitis Crónica</option>
                                <option value="Depresión">Depresión</option>
                                <option value="Ansiedad">Ansiedad</option>
                                <option value="Trastorno Bipolar">Trastorno Bipolar</option>
                                <option value="Esquizofrenia">Esquizofrenia</option>
                                <option value="Alzheimer">Alzheimer</option>
                                <option value="Demencia">Demencia</option>
                                <option value="Parkinson">Parkinson</option>
                                <option value="Artritis">Artritis</option>
                                <option value="Artritis Reumatoide">Artritis Reumatoide</option>
                                <option value="Osteoartritis">Osteoartritis</option>
                                <option value="Osteoporosis">Osteoporosis</option>
                                <option value="Obesidad">Obesidad</option>
                                <option value="Sobrepeso">Sobrepeso</option>
                                <option value="Hipercolesterolemia">Hipercolesterolemia</option>
                                <option value="Triglicéridos Altos">Triglicéridos Altos</option>
                                <option value="Enfermedad Renal">Enfermedad Renal</option>
                                <option value="Insuficiencia Renal">Insuficiencia Renal</option>
                                <option value="Cirrosis">Cirrosis</option>
                                <option value="Hepatitis">Hepatitis</option>
                                <option value="Tiroides">Problemas de Tiroides</option>
                                <option value="Hipotiroidismo">Hipotiroidismo</option>
                                <option value="Hipertiroidismo">Hipertiroidismo</option>
                                <option value="Migraña">Migraña</option>
                                <option value="Cefalea">Cefalea Crónica</option>
                                <option value="Glaucoma">Glaucoma</option>
                                <option value="Cataratas">Cataratas</option>
                                <option value="Sordera">Sordera</option>
                                <option value="Alcoholismo">Alcoholismo</option>
                                <option value="Tabaquismo">Tabaquismo</option>
                                <option value="Drogadicción">Drogadicción</option>
                                <option value="Alergia Medicamentosa">Alergia Medicamentosa</option>
                                <option value="Alergia Alimentaria">Alergia Alimentaria</option>
                                <option value="Fibromialgia">Fibromialgia</option>
                                <option value="Lupus">Lupus</option>
                                <option value="Esclerosis Múltiple">Esclerosis Múltiple</option>
                                <option value="VIH/SIDA">VIH/SIDA</option>
                                <option value="Tuberculosis">Tuberculosis</option>
                                <option value="Ninguna">Ninguna</option>
                                <option value="Otra">Otra</option>
                              </select>
                            </td>
                            <td 
                              style={{ 
                                border: `1px solid ${currentTheme.colors.border}`, 
                                padding: '8px', 
                                textAlign: 'center'
                              }}
                            >
                              <input
                                type="text"
                                value={member.observaciones}
                                onChange={(e) => handleInputChange(member.id, 'observaciones', e.target.value)}
                                placeholder="Observaciones"
                                style={{ 
                                  padding: '6px', 
                                  width: '100%',
                                  border: `1px solid ${currentTheme.colors.border}`,
                                  borderRadius: '4px',
                                  background: currentTheme.colors.surface, 
                                  color: currentTheme.colors.text
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <button
                      onClick={addExtraRelative}
                      className={clsx(buttonStyle.base, 'flex items-center gap-2 mt-3')}
                      style={{ 
                        background: '#4CAF50',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Otro Pariente
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group mt-6 flex justify-end">
                <button
                  onClick={handleSubmitFamilyHistory}
                  className={buttonStyle.base}
                  style={buttonStyle.primary}
                >
                  Guardar Antecedentes
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Antecedentes Patológicos */}
          <CollapsibleSection title="2. Antecedentes Patológicos">
            <div>
              <div 
                className="p-3 rounded-md mb-4"
                style={{ 
                  background: `${currentTheme.colors.primary}20`,
                  borderLeft: `4px solid ${currentTheme.colors.primary}`,
                }}
              >
                <p 
                  className="text-sm font-medium"
                  style={{ color: currentTheme.colors.text }}
                >
                  ANTECEDENTES PATOLÓGICOS PERSONALES
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  Registre el historial médico personal del paciente
                </p>
              </div>

              <div className="space-y-6">
                {/* Enfermedades Crónicas */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Enfermedades Crónicas
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                    {[
                      'Diabetes Tipo 1', 'Diabetes Tipo 2', 'Hipertensión Arterial', 'Asma',
                      'EPOC', 'Epilepsia', 'Cardiopatías', 'Artritis Reumatoide',
                      'Osteoartritis', 'Osteoporosis', 'Hipotiroidismo', 'Hipertiroidismo',
                      'Enfermedad Renal Crónica', 'Hepatitis B', 'Hepatitis C', 'VIH/SIDA'
                    ].map(disease => (
                      <label key={disease} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={pathologicalHistoryData.chronicDiseases.includes(disease)}
                          onChange={(e) => handlePathologicalCheckboxChange('chronicDiseases', disease, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span style={{ color: currentTheme.colors.text }}>{disease}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Otras enfermedades crónicas
                    </label>
                    <textarea
                      value={pathologicalHistoryData.otherChronicDiseases}
                      onChange={(e) => handlePathologicalInputChange('otherChronicDiseases', e.target.value)}
                      rows={2}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                      placeholder="Especifique otras enfermedades crónicas no listadas..."
                    />
                  </div>
                </div>

                {/* Cirugías Previas */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 
                      className="text-md font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Cirugías Previas
                    </h4>
                    <button
                      onClick={handleAddSurgery}
                      className={clsx(buttonStyle.base, 'flex items-center gap-2 text-sm')}
                      style={{ 
                        background: '#4CAF50',
                        color: 'white'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Cirugía
                    </button>
                  </div>
                  {pathologicalHistoryData.surgeries.length === 0 ? (
                    <div 
                      className="p-3 rounded-md text-center text-sm"
                      style={{ 
                        background: currentTheme.colors.background,
                        color: currentTheme.colors.textSecondary 
                      }}
                    >
                      No hay cirugías registradas
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pathologicalHistoryData.surgeries.map((surgery, index) => (
                        <div 
                          key={surgery.id}
                          className="p-3 rounded-md border"
                          style={{
                            background: currentTheme.colors.background,
                            borderColor: currentTheme.colors.border,
                          }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: currentTheme.colors.text }}
                              >
                                Tipo de Cirugía
                              </label>
                              <input
                                type="text"
                                value={surgery.type}
                                onChange={(e) => handleUpdateSurgery(index, 'type', e.target.value)}
                                className="w-full p-2 text-sm rounded-md border"
                                style={{
                                  background: currentTheme.colors.surface,
                                  borderColor: currentTheme.colors.border,
                                  color: currentTheme.colors.text,
                                }}
                                placeholder="Ej: Apendicectomía, Cesárea..."
                              />
                            </div>
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: currentTheme.colors.text }}
                              >
                                Fecha
                              </label>
                              <input
                                type="date"
                                value={surgery.date}
                                onChange={(e) => handleUpdateSurgery(index, 'date', e.target.value)}
                                className="w-full p-2 text-sm rounded-md border"
                                style={{
                                  background: currentTheme.colors.surface,
                                  borderColor: currentTheme.colors.border,
                                  color: currentTheme.colors.text,
                                }}
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => handleRemoveSurgery(index)}
                                className="p-2 rounded-md text-sm"
                                style={{
                                  background: '#EF4444',
                                  color: 'white'
                                }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <label 
                              className="block text-xs font-medium mb-1"
                              style={{ color: currentTheme.colors.text }}
                            >
                              Notas/Complicaciones
                            </label>
                            <textarea
                              value={surgery.notes}
                              onChange={(e) => handleUpdateSurgery(index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full p-2 text-sm rounded-md border"
                              style={{
                                background: currentTheme.colors.surface,
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.text,
                              }}
                              placeholder="Notas adicionales sobre la cirugía..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hospitalizaciones */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 
                      className="text-md font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Hospitalizaciones
                    </h4>
                    <button
                      onClick={handleAddHospitalization}
                      className={clsx(buttonStyle.base, 'flex items-center gap-2 text-sm')}
                      style={{ 
                        background: '#4CAF50',
                        color: 'white'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Hospitalización
                    </button>
                  </div>
                  {pathologicalHistoryData.hospitalizations.length === 0 ? (
                    <div 
                      className="p-3 rounded-md text-center text-sm"
                      style={{ 
                        background: currentTheme.colors.background,
                        color: currentTheme.colors.textSecondary 
                      }}
                    >
                      No hay hospitalizaciones registradas
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pathologicalHistoryData.hospitalizations.map((hosp, index) => (
                        <div 
                          key={hosp.id}
                          className="p-3 rounded-md border"
                          style={{
                            background: currentTheme.colors.background,
                            borderColor: currentTheme.colors.border,
                          }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: currentTheme.colors.text }}
                              >
                                Motivo
                              </label>
                              <input
                                type="text"
                                value={hosp.reason}
                                onChange={(e) => handleUpdateHospitalization(index, 'reason', e.target.value)}
                                className="w-full p-2 text-sm rounded-md border"
                                style={{
                                  background: currentTheme.colors.surface,
                                  borderColor: currentTheme.colors.border,
                                  color: currentTheme.colors.text,
                                }}
                                placeholder="Motivo de hospitalización..."
                              />
                            </div>
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: currentTheme.colors.text }}
                              >
                                Fecha
                              </label>
                              <input
                                type="date"
                                value={hosp.date}
                                onChange={(e) => handleUpdateHospitalization(index, 'date', e.target.value)}
                                className="w-full p-2 text-sm rounded-md border"
                                style={{
                                  background: currentTheme.colors.surface,
                                  borderColor: currentTheme.colors.border,
                                  color: currentTheme.colors.text,
                                }}
                              />
                            </div>
                            <div>
                              <label 
                                className="block text-xs font-medium mb-1"
                                style={{ color: currentTheme.colors.text }}
                              >
                                Duración
                              </label>
                              <input
                                type="text"
                                value={hosp.duration}
                                onChange={(e) => handleUpdateHospitalization(index, 'duration', e.target.value)}
                                className="w-full p-2 text-sm rounded-md border"
                                style={{
                                  background: currentTheme.colors.surface,
                                  borderColor: currentTheme.colors.border,
                                  color: currentTheme.colors.text,
                                }}
                                placeholder="Ej: 3 días, 1 semana..."
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => handleRemoveHospitalization(index)}
                                className="p-2 rounded-md text-sm"
                                style={{
                                  background: '#EF4444',
                                  color: 'white'
                                }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <label 
                              className="block text-xs font-medium mb-1"
                              style={{ color: currentTheme.colors.text }}
                            >
                              Notas
                            </label>
                            <textarea
                              value={hosp.notes}
                              onChange={(e) => handleUpdateHospitalization(index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full p-2 text-sm rounded-md border"
                              style={{
                                background: currentTheme.colors.surface,
                                borderColor: currentTheme.colors.border,
                                color: currentTheme.colors.text,
                              }}
                              placeholder="Notas adicionales sobre la hospitalización..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alergias */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Alergias
                  </h4>
                  <textarea
                    value={pathologicalHistoryData.allergies}
                    onChange={(e) => handlePathologicalInputChange('allergies', e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                    placeholder="Registre alergias medicamentosas, alimentarias, ambientales, etc..."
                  />
                </div>

                {/* Transfusiones */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Transfusiones Sanguíneas
                  </h4>
                  <textarea
                    value={pathologicalHistoryData.transfusions}
                    onChange={(e) => handlePathologicalInputChange('transfusions', e.target.value)}
                    rows={2}
                    className="w-full p-3 rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                    placeholder="Registre transfusiones previas, fechas y posibles reacciones..."
                  />
                </div>

                {/* Inmunizaciones */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Estado de Inmunizaciones (Vacunación)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-medium mb-1"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Estado del Esquema de Vacunación
                      </label>
                      <select
                        value={pathologicalHistoryData.immunizationStatus}
                        onChange={(e) => handlePathologicalInputChange('immunizationStatus', e.target.value)}
                        className="w-full p-2 rounded-md border"
                        style={{
                          background: currentTheme.colors.surface,
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                        }}
                      >
                        <option value="">Seleccione...</option>
                        <option value="complete">Completo</option>
                        <option value="incomplete">Incompleto</option>
                        <option value="unknown">Desconocido</option>
                      </select>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium mb-1"
                        style={{ color: currentTheme.colors.text }}
                      >
                        Detalles de Vacunación
                      </label>
                      <textarea
                        value={pathologicalHistoryData.immunizationDetails}
                        onChange={(e) => handlePathologicalInputChange('immunizationDetails', e.target.value)}
                        rows={3}
                        className="w-full p-2 rounded-md border"
                        style={{
                          background: currentTheme.colors.surface,
                          borderColor: currentTheme.colors.border,
                          color: currentTheme.colors.text,
                        }}
                        placeholder="Especifique vacunas aplicadas, fechas, refuerzos pendientes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Medicamentos Actuales */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Medicamentos Actuales
                  </h4>
                  <textarea
                    value={pathologicalHistoryData.currentMedications}
                    onChange={(e) => handlePathologicalInputChange('currentMedications', e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                    placeholder="Liste los medicamentos que toma actualmente: nombre, dosis, frecuencia..."
                  />
                </div>

                {/* Hábitos Tóxicos */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Hábitos Tóxicos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    {[
                      'Tabaquismo',
                      'Alcoholismo',
                      'Drogadicción'
                    ].map(habit => (
                      <label key={habit} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pathologicalHistoryData.toxicHabits.includes(habit)}
                          onChange={(e) => handlePathologicalCheckboxChange('toxicHabits', habit, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span style={{ color: currentTheme.colors.text }}>{habit}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: currentTheme.colors.text }}
                    >
                      Otros hábitos tóxicos / Detalles
                    </label>
                    <textarea
                      value={pathologicalHistoryData.otherToxicHabits}
                      onChange={(e) => handlePathologicalInputChange('otherToxicHabits', e.target.value)}
                      rows={3}
                      className="w-full p-2 rounded-md border"
                      style={{
                        background: currentTheme.colors.surface,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                      }}
                      placeholder="Especifique otros hábitos, frecuencia, cantidad, tiempo de consumo..."
                    />
                  </div>
                </div>

                {/* Notas Generales */}
                <div>
                  <h4 
                    className="text-md font-medium mb-3"
                    style={{ color: currentTheme.colors.text }}
                  >
                    Notas Generales
                  </h4>
                  <textarea
                    value={pathologicalHistoryData.generalNotes}
                    onChange={(e) => handlePathologicalInputChange('generalNotes', e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-md border"
                    style={{
                      background: currentTheme.colors.surface,
                      borderColor: currentTheme.colors.border,
                      color: currentTheme.colors.text,
                    }}
                    placeholder="Cualquier otra información médica relevante no mencionada anteriormente..."
                  />
                </div>
              </div>

              <div className="form-group mt-6 flex justify-end">
                <button
                  onClick={handleSubmitPathologicalHistory}
                  className={buttonStyle.base}
                  style={buttonStyle.primary}
                >
                  Guardar Antecedentes Patológicos
                </button>
              </div>
            </div>
          </CollapsibleSection>

          {/* Antecedentes No Patológicos */}
          <CollapsibleSection title="3. Antecedentes No Patológicos">
            <div 
              className="p-4 rounded-md text-center"
              style={{ 
                background: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary 
              }}
            >
              <p>Sección en desarrollo - Antecedentes No Patológicos</p>
              <p className="text-sm mt-2">Aquí se registrarán los antecedentes no patológicos del paciente</p>
            </div>
          </CollapsibleSection>

          {/* Antecedentes No Patológicos */}
          <CollapsibleSection title="3. Antecedentes No Patológicos">
            <div 
              className="p-4 rounded-md text-center"
              style={{ 
                background: currentTheme.colors.background,
                color: currentTheme.colors.textSecondary 
              }}
            >
              <p>Sección en desarrollo - Antecedentes No Patológicos</p>
              <p className="text-sm mt-2">Aquí se registrarán los antecedentes no patológicos del paciente</p>
            </div>
          </CollapsibleSection>

          {/* Antecedentes Gineco-Obstétricos (solo para mujeres) */}
          {selectedPatient.Sexo === 'Femenino' && (
            <CollapsibleSection title="4. Antecedentes Gineco-Obstétricos">
              <div 
                className="p-4 rounded-md text-center"
                style={{ 
                  background: currentTheme.colors.background,
                  color: currentTheme.colors.textSecondary 
                }}
              >
                <p>Sección en desarrollo - Antecedentes Gineco-Obstétricos</p>
                <p className="text-sm mt-2">Aquí se registrarán los antecedentes gineco-obstétricos de la paciente</p>
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}