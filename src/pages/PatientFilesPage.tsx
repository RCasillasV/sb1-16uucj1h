import React, { useState, useEffect } from 'react';
import { FolderOpen, Upload } from 'lucide-react';
import { useSelectedPatient } from '../contexts/SelectedPatientContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FileUpload } from '../components/FileUpload';
import { PatientFileGallery } from '../components/PatientFileGallery';
import { DocumentMetadataReview } from '../components/DocumentMetadataReview';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { extractMedicalData, analyzeMedicalImage } from '../services/openaiService';
import { DatosExtraidos } from '../types/documentos-medicos';
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
  const [extractedData, setExtractedData] = useState<DatosExtraidos | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);

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

  const handleFilesUploaded = async (uploadedFiles: any[]) => {
    console.log('PatientFilesPage: Archivos subidos recibidos:', uploadedFiles);
    
    // Refresh the gallery after files are uploaded
    await fetchPatientFiles();
    
    // Ya no procesamos automáticamente - el usuario decidirá desde la galería
  };

  const processFileWithAI = async (fileId: string, fileUrl: string, fileName: string, mimeType: string, hasMetadata: boolean = false) => {
    if (!selectedPatient) return;
    
    // Si ya tiene metadata, cargar los datos existentes para editar
    if (hasMetadata) {
      try {
        console.log('=== CARGANDO METADATA EXISTENTE PARA EDITAR ===');
        const existingMetadata = await api.documentMetadata.getByFileId(fileId);
        
        if (existingMetadata && existingMetadata.datos_extraidos) {
          console.log('Metadata encontrada, abriendo modal de edición');
          setExtractedData(existingMetadata.datos_extraidos);
          setCurrentFileId(fileId);
          setShowReviewModal(true);
          return;
        }
      } catch (error) {
        console.error('Error cargando metadata existente:', error);
        setError('Error al cargar los datos existentes');
        return;
      }
    }
    
    setProcessingAI(true);
    setError(null); // Limpiar errores previos
    
    try {
      console.log('=== INICIANDO PROCESAMIENTO CON IA ===');
      console.log('Archivo:', fileName);
      console.log('URL:', fileUrl);
      console.log('Tipo:', mimeType);
      
      let result;
      
      // Determinar si es imagen médica o PDF
      if (mimeType.startsWith('image/')) {
        console.log('Detectado como imagen médica, usando GPT-4o Vision...');
        result = await analyzeMedicalImage({
          fileUrl,
          fileName,
          mimeType,
        });
      } else if (mimeType === 'application/pdf') {
        console.log('Detectado como PDF, extrayendo texto...');
        result = await extractMedicalData({
          fileUrl,
          fileName,
          mimeType,
        });
      } else {
        throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
      }

      console.log('=== RESULTADO DE IA ===', result);

      if (result.success && result.datos) {
        console.log('Extracción exitosa, guardando en BD...');
        
        try {
          // Verificar si ya existe metadata para este archivo
          const existingMetadata = await api.documentMetadata.getByFileId(fileId);
          
          if (existingMetadata) {
            console.log('Ya existe metadata, actualizando...');
            // Actualizar metadata existente
            await api.documentMetadata.update(
              existingMetadata.id,
              result.datos,
              'Reprocesado con IA'
            );
          } else {
            console.log('Creando nueva metadata...');
            // Crear nueva metadata
            await api.documentMetadata.create({
              file_id: fileId,
              patient_id: selectedPatient.id,
              datos_extraidos: result.datos,
              tokens_usados: result.tokens_usados,
              costo_estimado: result.costo_estimado,
            });
          }

          console.log('Metadata guardada, marcando archivo como procesado con IA');
          
          // Marcar archivo como procesado con IA
          await api.files.markAsAIProcessed(fileId);
          
          // Refrescar lista de archivos para actualizar el estado del botón
          await fetchPatientFiles();

          // Mostrar modal de revisión
          setExtractedData(result.datos);
          setCurrentFileId(fileId);
          setShowReviewModal(true);
        } catch (dbError) {
          console.error('Error guardando metadata:', dbError);
          // Aún así mostrar el modal para que el usuario pueda revisar los datos
          setExtractedData(result.datos);
          setCurrentFileId(fileId);
          setShowReviewModal(true);
        }
      } else {
        console.error('=== ERROR EN EXTRACCIÓN ===');
        console.error('Mensaje de error:', result.error);
        setError(`Error al extraer datos del PDF: ${result.error}`);
      }
    } catch (err) {
      console.error('=== ERROR CRÍTICO ===');
      console.error('Error completo:', err);
      console.error('Stack:', err instanceof Error ? err.stack : 'No stack available');
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo con IA';
      setError(`Error al procesar el archivo: ${errorMessage}`);
    } finally {
      setProcessingAI(false);
    }
  };

  const handleSaveExtractedData = async (datosEditados: DatosExtraidos) => {
    if (!currentFileId) return;

    try {
      // Obtener metadata existente
      const metadata = await api.documentMetadata.getByFileId(currentFileId);
      
      if (metadata) {
        // Actualizar con datos revisados
        await api.documentMetadata.update(metadata.id, datosEditados, 'Revisado por médico');
      }

      setShowReviewModal(false);
      setExtractedData(null);
      setCurrentFileId(null);
    } catch (err) {
      console.error('Error guardando datos extraídos:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los datos');
    }
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
    setExtractedData(null);
    setCurrentFileId(null);
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
      currentTheme.buttons?.style === 'pill' && 'rounded-full',
      currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons?.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors?.buttonPrimary || currentTheme.colors.primary,
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
    <div className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* File Gallery Section with Upload Card */}
      <PatientFileGallery
        files={patientFiles}
        onFileRemoved={handleFileRemoved}
        onError={handleFileError}
        onFileAccessed={fetchPatientFiles}
        onProcessWithAI={(file) => processFileWithAI(file.id, file.url, file.name, file.type, file.has_metadata)}
        uploadComponent={
          <FileUpload
            onFilesUploaded={handleFilesUploaded}
            maxFiles={10}
            maxFileSize={5}
            folder={`patients/${selectedPatient.id}`}
            className="w-full h-full"
            enableImageCompression={true}
            imageCompressionOptions={{
              maxSizeMB: 2,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            }}
          />
        }
      />

      {/* Processing AI Indicator */}
      {processingAI && (
        <div 
          className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3"
          style={{ background: currentTheme.colors.primary, color: 'white' }}
        >
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          <span>Extrayendo datos con IA...</span>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && extractedData && (
        <Modal
          isOpen={showReviewModal}
          onClose={handleCancelReview}
          title=""
        >
          <DocumentMetadataReview
            datos={extractedData}
            onSave={handleSaveExtractedData}
            onCancel={handleCancelReview}
          />
        </Modal>
      )}
    </div>
  );
}