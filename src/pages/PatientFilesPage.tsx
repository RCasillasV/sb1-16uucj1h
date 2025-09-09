import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FileUpload } from '../components/FileUpload';
import { PatientFileGallery } from '../components/PatientFileGallery';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import clsx from 'clsx';

interface PatientFile {
  id: string;
  name: string;
  type: string;
  url: string;
  path: string;
  thumbnail_url: string | null;
  created_at: string;
  fecha_ultima_consulta: string | null;
  numero_consultas: number;
  patient_id: string;
  user_id: string;
}

export function PatientFilesPage() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patientFiles, setPatientFiles] = useState<PatientFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    if (!authLoading && user) {
      fetchPatientFiles();
    }
  }, [selectedPatient, user, authLoading]);

  const fetchPatientFiles = async () => {
    if (!selectedPatient) return;
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const files = await api.files.getByPatientId(selectedPatient.id);
      setPatientFiles(files);
    } catch (err) {
      console.error('Error fetching patient files:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los archivos del paciente. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = () => {
    // Refresh the gallery after files are uploaded
    fetchPatientFiles();
  };

  const handleFileRemoved = () => {
    // Refresh the gallery after a file is removed
    fetchPatientFiles();
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="h-6 w-6" style={{ color: currentTheme.colors.primary }} />
        <h1 
          className="text-2xl font-bold"
          style={{ color: currentTheme.colors.text }}
        >
          Archivos del Paciente
        </h1>
        <span 
          className="ml-2 px-2.5 py-0.5 rounded-full text-sm font-medium"
          style={{ 
            background: `${currentTheme.colors.primary}20`,
            color: currentTheme.colors.primary,
          }}
        >
          {patientFiles.length} archivos
        </span>
      </div>

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
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* File Upload Section */}
      <div className="mb-8">       
        <FileUpload
          onFilesUploaded={handleFilesUploaded}
          maxFiles={10}
          maxFileSize={5}
          folder={`patients/${selectedPatient.id}`}
          className="w-full"
          enableImageCompression={true}
          imageCompressionOptions={{
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          }}
        />
      </div>

      {/* File Gallery Section */}
      <PatientFileGallery
        files={patientFiles}
        onFileRemoved={handleFileRemoved}
        onError={handleFileError}
        onFileAccessed={fetchPatientFiles} // Pass the fetch function to update access counts in real-time
      />
    </div>
  );
}