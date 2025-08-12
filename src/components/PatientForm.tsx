import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Database } from '../types/database.types';
import { User, X } from 'lucide-react';
import { format } from 'date-fns';
import { calculateAge } from '../utils/dateUtils';
import { PostalCodeLookup } from './PostalCodeLookup';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileUpload } from './FileUpload';
import clsx from 'clsx';

type Patient = Database['public']['Tables']['tcPacientes']['Row'];

interface PatientFormProps {
  onSuccess: (patient: Patient) => void;
  onCancel: () => void;
  patient?: Patient;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

type TabType = 'basicos' | 'complementarios' | 'personales';

function ConfirmDialog({ isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  const { currentTheme } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg p-6 max-w-md w-full mx-4"
        style={{ background: currentTheme.colors.surface }}
      >
        <h3 
          className="text-lg font-medium mb-2"
          style={{ color: currentTheme.colors.text }}
        >
          ¿Está seguro de modificar los datos del paciente?
        </h3>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border transition-colors"
            style={{
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
              background: 'transparent',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md transition-colors"
            style={{
              background: currentTheme.colors.primary,
              color: currentTheme.colors.buttonText,
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export function PatientForm({ onSuccess, onCancel, patient }: PatientFormProps) {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ idbu: string | null }>({ idbu: null });
  const [error, setError] = useState<string | null>(null);
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<HTMLFormElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('basicos');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [formValues, setFormValues] = useState({
    // Básicos
    Nombre: patient?.Nombre || '',
    Paterno: patient?.Paterno || '',
    Materno: patient?.Materno || '',
    FechaNacimiento: patient?.FechaNacimiento || '',
    Sexo: patient?.Sexo  || '',
    CodigoPostal: patient?.CodigoPostal || '',
    Telefono: patient?.Telefono  || '',
    TipoSangre: patient?.TipoSangre || '',
    Alergias: patient?.Alergias?.join(', ') || '',
    Observaciones: patient?.Observaciones || '',
    Refiere: patient?.Refiere || '',

    // Complementarios
    CURP: patient?.CURP || '',
    RFC: patient?.RFC || '',
    Email: patient?.Email  || '',
    EstadoCivil: patient?.EstadoCivil || '',
    Calle: patient?.Calle || '',
    Colonia: patient?.Colonia || '',
    Asentamiento: patient?.Asentamiento || '',
    Poblacion: patient?.Poblacion || '',
    Municipio: patient?.Municipio || '',
    EntidadFederativa: patient?.EntidadFederativa || '',
    ContactoEmergencia: patient?.ContactoEmergencia || '',

    // Personales
    Ocupacion: patient?.Ocupacion || '',
    Aseguradora: patient?.Aseguradora || '',
    TipoPaciente: patient?.TipoPaciente || '',
    EstadoNacimiento: patient?.EstadoNacimiento || '',
    Nacionalidad: patient?.Nacionalidad || '',
    Religion: patient?.Religion || '',
    LenguaIndigena: patient?.LenguaIndigena || '',
    GrupoEtnico: patient?.GrupoEtnico || '',
    Discapacidad: patient?.Discapacidad || '',
    Responsable: patient?.Responsable || ''

  });
  
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };
  const handleColonySelect = (asenta: string, colony: string, city: string, municipality: string, state: string ) => {
    setFormValues(prev => ({
      ...prev,
      Asentamiento: asenta,
      Colonia: colony,
      Municipio: city,
      EntidadFederativa: municipality,
      Poblacion: state
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (patient) {
      setFormData(e.currentTarget as HTMLFormElement);
      setShowConfirmDialog(true);
    } else {
      await savePatient(e.currentTarget);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: userData, error } = await supabase.rpc('get_user_idbu', {
          user_id: session.user.id
        });

        if (error) throw error;
        setUserInfo({ idbu: userData?.idbu || null });
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('Error al obtener información del usuario');
      }
    };
    fetchUserInfo();
  }, []);

  const savePatient = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    setLoading(true);
    setError(null);

    if (!userInfo.idbu) {
      setError('No se pudo determinar la unidad de negocio');
      setLoading(false);
      return;
    }

    const patientData = {
      Nombre: formValues.Nombre,
      Paterno: formValues.Paterno,
      Materno: formValues.Materno || undefined,
      FechaNacimiento: formValues.FechaNacimiento,
      Sexo: formValues.Sexo ,
      CURP: formValues.CURP || null,
      RFC: formValues.RFC || null,
      EstadoCivil: formValues.EstadoCivil || null,
      CodigoPostal: formValues.CodigoPostal || null,
      ContactoEmergencia: formValues.ContactoEmergencia || null,
      Email: formValues.Email || null,
      Telefono: formValues.Telefono || null,
      Calle: formValues.Calle || null,
      Asentamiento: formValues.Asentamiento || null,
      Colonia: formValues.Colonia || null,
      Poblacion: formValues.Poblacion || null,
      Municipio: formValues.Municipio || null,
      EntidadFederativa: formValues.EntidadFederativa || null,
      Ocupacion: formValues.Ocupacion || null,
      Aseguradora: formValues.Aseguradora || null,
      EstadoNacimiento: formValues.EstadoNacimiento || null,
      TipoSangre: formValues.TipoSangre || null,
      Alergias: formValues.Alergias ? formValues.Alergias.split(',').map(a => a.trim()) : null,
      Refiere: formValues.Refiere || null,
      Observaciones: formValues.Observaciones || null,
      TipoPaciente: formValues.TipoPaciente ? [formValues.TipoPaciente] : null,
      Nacionalidad:formValues.Nacionalidad || '',
      Religion:formValues.Religion || '',
      LenguaIndigena: formValues.LenguaIndigena || '',
      GrupoEtnico:formValues.GrupoEtnico || '',
      Discapacidad: formValues.Discapacidad || '',
      Responsable: formValues.Responsable || '',
      idbu: userInfo.idbu,
      user_id: user?.id ?? null,
    };

    try {
      let savedPatient: Patient;
      if (patient) {
        savedPatient = await api.patients.update(patient.id, patientData);
      } else {
        savedPatient = await api.patients.create(patientData);
      }
      onSuccess(savedPatient);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEdit = async () => {
    if (formData) {
      await savePatient(formData);
    }
    setShowConfirmDialog(false);
  };

  const handleFilesUploaded = (files: any[]) => {
    setUploadedFiles(files);
  };
  const inputStyle = {
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    borderColor: currentTheme.colors.border,
  };

  const labelStyle = {
    color: currentTheme.colors.textSecondary,
    fontSize: `calc(${currentTheme.typography.baseSize} * 0.875)`,
  };

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={clsx(
        'px-4 py-2 font-medium transition-colors',
        activeTab === tab ? 'border-b-2' : 'hover:bg-black/5'
      )}
      style={{
        color: activeTab === tab ? currentTheme.colors.primary : currentTheme.colors.text,
        borderColor: activeTab === tab ? currentTheme.colors.primary : 'transparent',
      }}
    >
      {label}
    </button>
  );

  return (
    <div 
      className="max-w-full md:w-full p-3 pb-24 sm:pb-6 rounded-lg shadow-lg max-w-4xl mx-auto relative"
      style={{ background: currentTheme.colors.surface }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-full"
            style={{ background: currentTheme.colors.primary }}
          >
            <User className="h-6 w-6" style={{ color: currentTheme.colors.buttonText }} />
          </div>
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fonts.headings,
              }}
            >
              {patient ? 'Editar' : 'Nuevo'} Paciente
            </h2>
            <p 
              className="text-sm"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Ficha de datos
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div 
          className="mb-2 p-4 rounded-md"
          style={{ 
            background: '#FEE2E2',
            borderColor: '#FCA5A5',
            color: '#DC2626'
          }}
        >
          {error}
        </div>
      )}

      <div className="mb-2 border-b" style={{ borderColor: currentTheme.colors.border }}>
        <TabButton tab="basicos" label="Básicos" />
        <TabButton tab="complementarios" label="Complementarios" />
        <TabButton tab="personales" label="Personales" />
      </div>

      <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'basicos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
               {/* Campos básicos */}
              <div className="col-span-1">
                <label htmlFor="Nombre" className="block mb-1 font-medium" style={labelStyle}>
                  Nombre
                </label>
                <input
                  type="text"
                  name="Nombre"
                  id="Nombre"
                  required
                  defaultValue={patient?.Nombre}
                  className="max-w-full md:w-full p2 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  onChange={(e) => setFormValues(prev => ({ ...prev, Nombre: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Paterno" className="block mb-1 font-medium" style={labelStyle}>
                  Apellido Paterno
                </label>
                <input
                  type="text"
                  name="Paterno"
                  id="Paterno"
                  required
                  defaultValue={patient?.Paterno}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Paterno: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Materno" className="block mb-1 font-medium" style={labelStyle}>
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="Materno"
                  id="Materno"
                  defaultValue={patient?.Materno}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Materno: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="FechaNacimiento" className="block mb-1 font-medium" style={labelStyle}>
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="FechaNacimiento"
                  id="FechaNacimiento"
                  required
                  defaultValue={formatDateForInput(patient?.FechaNacimiento)}
                  onChange={(e) => setFormValues(prev => ({ ...prev, FechaNacimiento: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Sexo" className="block mb-1 font-medium" style={labelStyle}>
                  Sexo
                </label>
                <select
                  name="Sexo"
                  id="Sexo"
                  required
                  defaultValue={patient?.Sexo}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  onChange={(e) => setFormValues(prev => ({ ...prev, Sexo: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div>
                <label htmlFor="Email" className="block mb-1 font-medium" style={labelStyle}>
                  Email
                </label>
                <input
                  type="email"
                  name="Email"
                  id="Email"
                  defaultValue={patient?.Email || ''}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  onChange={(e) => setFormValues(prev => ({ ...prev, Email: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Telefono" className="block mb-1 font-medium" style={labelStyle}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="Telefono"
                  id="Telefono"
                  defaultValue={patient?.Telefono || ''}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Telefono: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="TipoSangre" className="block mb-1 font-medium" style={labelStyle}>
                  Tipo de Sangre
                </label>
                <select
                  name="TipoSangre"
                  id="TipoSangre"
                  value={formValues.TipoSangre}
                  onChange={(e) => setFormValues(prev => ({ ...prev, TipoSangre: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                >
                  <option value="">Seleccionar...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label htmlFor="Refiere" className="block mb-1 font-medium" style={labelStyle}>
                  Refiere
                </label>
                <input
                  type="text"
                  name="Refiere"
                  id="Refiere"
                  placeholder="Nombre de medico que refiere"
                  value={formValues.Refiere}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Refiere: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>
       
              
              <div className="md:col-span-2">
                <label htmlFor="Alergias" className="block mb-1 font-medium" style={labelStyle}>
                  Alergias
                </label>
                <input
                  type="text"
                  name="Alergias"
                  id="Alergias"
                  placeholder="Penicilina, Látex, Polvo, etc."
                  value={formValues.Alergias}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Alergias: e.target.value }))}
                  className="w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>
              <div className="md:col-span-3"> 
                <label 
                  htmlFor="Observaciones" 
                  className="block text-sm font-medium mb-1 cursor-help"
                  title="Captura las notas que deseas conozca el medico"
                  style={{ color: currentTheme.colors.text }}
                >
                  Observaciones
                </label>
                <textarea
                  type="text"
                  name="Observaciones"
                  id="Observaciones"
                  rows={3} 
                  placeholder="Notas para el medico sobre el paciente"
                  value={formValues.Observaciones}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Observaciones: e.target.value }))}
                  className="w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{
                    background: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text,
                  }}
                />
              </div>

              
            </div>
          </div>
        )}

        {activeTab === 'complementarios' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="CURP" className="block mb-1 font-medium" style={labelStyle}>
                  CURP a 18 posiciones
                </label>
                <input
                  autoFocus 
                  type="text"
                  name="CURP"
                  id="CURP"
                  maxLength={18}
                  value={formValues.CURP}
                  onChange={(e) => setFormValues(prev => ({ ...prev, CURP: e.target.value }))}
                  className="w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="RFC" className="block mb-1 font-medium" style={labelStyle}>
                  RFC
                </label>
                <input
                  type="text"
                  name="RFC"
                  id="RFC"
                  value={formValues.RFC}
                  onChange={(e) => setFormValues(prev => ({ ...prev, RFC: e.target.value }))}
                  className="w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="EstadoCivil" className="block mb-1 font-medium" style={labelStyle}>
                  Estado Civil
                </label>
                <select
                  name="EstadoCivil"
                  id="EstadoCivil"
                  value={formValues.EstadoCivil}
                  onChange={(e) => setFormValues(prev => ({ ...prev, EstadoCivil: e.target.value }))}
                  className="w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Soltero">Soltero(a)</option>
                  <option value="Casado">Casado(a)</option>
                  <option value="Viudo">Viudo(a)</option>
                  <option value="Divorciado">Divorciado(a)</option>
                  <option value="UnionLibre">Unión Libre</option>
                </select>
              </div>

              <div>
                <label htmlFor="CodigoPostal" className="block mb-1 font-medium" style={labelStyle}>
                  Código Postal 
                </label>
                <PostalCodeLookup
                  value={formValues.CodigoPostal}
                  onChange={(value) => { setFormValues(prev => ({ ...prev, CodigoPostal: value }))}}
                  onColonySelect={handleColonySelect}
                  error={postalCodeError ?? undefined}
                  onError={setPostalCodeError}
                 />   
               </div>
              <div>
                <label htmlFor="Calle" className="block mb-1 font-medium" style={labelStyle}>
                  Calle
                </label>
                <input
                  type="text"
                  name="Calle"
                  id="Calle"
                  value={formValues.Calle}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Calle: e.target.value }))}
                  className="w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>
                         
              <div>
                  <label htmlFor="Colonia"  className="block mb-1 font-medium"  style={labelStyle} >
                    {formValues.Asentamiento || 'Colonia'}
                  </label>
                  <input
                    type="text"
                    name="Colonia"
                    id="Colonia"
                    value={formValues.Colonia || ''}
                    onChange={(e) => {
                      setFormValues(prev => ({ ...prev, Colonia: e.target.value }));}}
                    className="max-w-full md:w-full p-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    style={inputStyle}
                  />
              </div>

              <div>
                <label htmlFor="Poblacion" className="block mb-1 font-medium" style={labelStyle}>
                  Población
                </label>
                <input
                  type="text"
                  name="Poblacion"
                  id="Poblacion"
                  value={formValues.Poblacion}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Poblacion: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Municipio" className="block mb-1 font-medium" style={labelStyle}>
                  Municipio
                </label>
                <input
                  type="text"
                  name="Municipio"
                  id="Municipio"
                  value={formValues.Municipio}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Municipio: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="EntidadFederativa" className="block mb-1 font-medium" style={labelStyle}>
                  Entidad Federativa
                </label>
                <input
                  type="text"
                  name="EntidadFederativa"
                  id="EntidadFederativa"
                  value={formValues.EntidadFederativa}
                  onChange={(e) => setFormValues(prev => ({ ...prev, EntidadFederativa: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="ContactoEmergencia" className="block mb-1 font-medium" style={labelStyle}>
                  Contacto de Emergencia
                </label>
                <input
                  type="text"
                  name="ContactoEmergencia"
                  id="ContactoEmergencia"
                  value={formValues.ContactoEmergencia}
                  onChange={(e) => setFormValues(prev => ({ ...prev, ContactoEmergencia: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 
                className="text-lg font-medium"
                style={{ 
                  color: currentTheme.colors.text,
                  fontFamily: currentTheme.typography.fontFamily,
                }}
              >
                Documentos del Paciente
              </h3>
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                maxFiles={10}
                maxFileSize={10}
                folder={`patients/${patient?.id || 'new'}`}
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'personales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="Ocupacion" className="block mb-1 font-medium" style={labelStyle}>
                  Ocupación
                </label>
                <input
                  type="text"
                  name="Ocupacion"
                  id="Ocupacion"
                  value={formValues.Ocupacion}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Ocupacion: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Aseguradora" className="block mb-1 font-medium" style={labelStyle}>
                  Aseguradora
                </label>
                <input
                  type="text"
                  name="Aseguradora"
                  id="Aseguradora"
                  value={formValues.Aseguradora}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Aseguradora: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="TipoPaciente" className="block mb-1 font-medium" style={labelStyle}>
                  Tipo de Paciente
                </label>
                
                <select
                  name="TipoPaciente"
                  id="TipoPaciente"
                  value={formValues.TipoPaciente}
                  onChange={(e) => setFormValues(prev => ({ ...prev, TipoPaciente: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Particular">Particular</option>
                  <option value="Aseguradora">Aseguradora</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>

              <div>
                <label htmlFor="EstadoNacimiento" className="block mb-1 font-medium" style={labelStyle}>
                  Estado de Nacimiento
                </label>
                <input
                  type="text"
                  name="EstadoNacimiento"
                  id="EstadoNacimiento"
                  value={formValues.EstadoNacimiento}
                  onChange={(e) => setFormValues(prev => ({ ...prev, EstadoNacimiento: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Nacionalidad" className="block mb-1 font-medium" style={labelStyle}>
                  Nacionalidad
                </label>
                <input
                  type="text"
                  name="Nacionalidad"
                  id="Nacionalidad"
                  value={formValues.Nacionalidad}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Nacionalidad: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Religion" className="block mb-1 font-medium" style={labelStyle}>
                  Religión
                </label>
                <input
                  type="text"
                  name="Religion"
                  id="Religion"
                  value={formValues.Religion}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Religion: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="LenguaIndigena" className="block mb-1 font-medium" style={labelStyle}>
                  Lengua Indígena
                </label>
                <input
                  type="text"
                  name="LenguaIndigena"
                  id="LenguaIndigena"
                  value={formValues.LenguaIndigena}
                  onChange={(e) => setFormValues(prev => ({ ...prev, LenguaIndigena: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="GrupoEtnico" className="block mb-1 font-medium" style={labelStyle}>
                  Grupo Étnico
                </label>
                <input
                  type="text"
                  name="GrupoEtnico"
                  id="GrupoEtnico"
                  value={formValues.GrupoEtnico}
                  onChange={(e) => setFormValues(prev => ({ ...prev, GrupoEtnico: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Discapacidad" className="block mb-1 font-medium" style={labelStyle}>
                  Discapacidad
                </label>
                <input
                  type="text"
                  name="Discapacidad"
                  id="Discapacidad"
                  value={formValues.Discapacidad}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Discapacidad: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="Responsable" className="block mb-1 font-medium" style={labelStyle}>
                  Responsable
                </label>
                <input
                  type="text"
                  name="Responsable"
                  id="Responsable"
                  value={formValues.Responsable}
                  onChange={(e) => setFormValues(prev => ({ ...prev, Responsable: e.target.value }))}
                  className="max-w-full md:w-full p2  rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={inputStyle}
                />
              </div>

            </div>
          </div>
        )}

      </form>
      
      {/* Fixed bottom buttons */}
      <div 
        className="fixed bottom-0 left-0 right-0 sm:relative sm:mt-6 p-4 sm:p-0 flex justify-center gap-3 border-t sm:border-t-0"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="min-w-[120px] h-11 px-6 rounded-md border transition-colors"
          style={{
            borderColor: currentTheme.colors.border,
            color: currentTheme.colors.text,
            background: 'transparent',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="patient-form"
          disabled={loading || isLoading || !!postalCodeError}
          className="min-w-[120px] h-11 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: currentTheme.colors.primary,
            color: currentTheme.colors.buttonText,
          }}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmEdit}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
}