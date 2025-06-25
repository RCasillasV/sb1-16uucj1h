import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { FileUpload } from '../components/FileUpload';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

export function PatientFilesPage() {
  const { currentTheme } = useTheme();
  const { selectedPatient } = useSelectedPatient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialFiles, setInitialFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(!selectedPatient);

  useEffect(() => {
    if (!selectedPatient) {
      setShowWarningModal(true);
      return;
    }
    fetchPatientFiles();
  }, [selectedPatient]);

  const fetchPatientFiles = async () => {
    if (!selectedPatient) return;
    
    setLoading(true);
    try {
      const files = await api.files.getByPatientId(selectedPatient.id);
      setInitialFiles(files);
    } catch (err) {
      console.error('Error fetching patient files:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los archivos del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setInitialFiles(files);
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
          {initialFiles.length} archivos
        </span>
      </div>

      {error && (
        <div 
          className="mb-4 p-4 rounded-md"
          style={{
            background: '#FEE2E2',
            color: '#DC2626',
          }}
        >
          {error}
        </div>
      )}

      <div 
        className="bg-white rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.colors.primary }} />
            <span className="ml-3" style={{ color: currentTheme.colors.text }}>
              Cargando archivos del paciente...
            </span>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 
                className="text-lg font-medium mb-2 flex items-center gap-2"
                style={{ color: currentTheme.colors.text }}
              >
                <Upload className="h-5 w-5" style={{ color: currentTheme.colors.primary }} />
                Gestión de Archivos
              </h2>
              <p 
                className="text-sm mb-4"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Sube y gestiona los archivos médicos del paciente {selectedPatient.Nombre} {selectedPatient.Paterno}
              </p>
            </div>

            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              maxFiles={20}
              maxFileSize={15}
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
        )}
      </div>
    </div>
  );
}