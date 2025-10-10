import React, { useState } from 'react';
import { FileText, Image, File, Eye, Trash2, Calendar, Clock, Download, X, AlertTriangle, Edit2, Save, Sparkles, ClipboardPen } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ImagePreviewModal } from './ImagePreviewModal';
import { Modal } from './Modal';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../lib/api';
import clsx from 'clsx';

interface PatientFile {
  id: string;
  name: string;
  path: string;
  type: string;
  url: string;
  thumbnail_url: string | null;
  created_at: string;
  fecha_ultima_consulta: string | null;
  numero_consultas: number;
  patient_id: string;
  user_id: string;
  ai_processed?: boolean; // Flag to track if file was processed with AI
  has_metadata?: boolean; // Flag to track if file has metadata saved
}

interface PatientFileGalleryProps {
  files: PatientFile[];
  onFileRemoved: () => void;
  onError: (error: string) => void;
  onFileAccessed?: () => void; // New prop to trigger refresh when file is accessed
  onProcessWithAI?: (file: PatientFile) => void; // New prop to trigger AI processing
  uploadComponent?: React.ReactNode; // Upload card component to show as first item
}

export function PatientFileGallery({ files, onFileRemoved, onError, onFileAccessed, onProcessWithAI, uploadComponent }: PatientFileGalleryProps) {
  const { currentTheme } = useTheme();
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageName, setPreviewImageName] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<PatientFile | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    if (type.includes('word') || type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yy HH:mm", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const handleFileClick = async (file: PatientFile) => {
    try {
      console.log('PATIENT_FILE_GALLERY: Clicking on file:', file.name, 'URL:', file.url);
      // Track file access
      await api.files.trackAccess(file.id);
      
      // Notify parent component to refresh the file list
      if (onFileAccessed) {
        console.log('PATIENT_FILE_GALLERY: Notifying parent to refresh file list');
        onFileAccessed();
      }

      // Open file based on type
      if (file.type.startsWith('image/')) {
        console.log('PATIENT_FILE_GALLERY: Opening image preview for:', file.url);
        setPreviewImageUrl(file.url);
        setPreviewImageName(file.name);
        setShowImagePreview(true);
      } else {
        console.log('PATIENT_FILE_GALLERY: Opening non-image file in new tab:', file.url);
        // For PDFs and documents, open in new tab
        window.open(file.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error tracking file access:', error);
      onError('Error al registrar acceso al archivo');
    }
  };
  const handleRemoveFile = (file: PatientFile) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const confirmRemove = async () => {
    if (!fileToDelete) return;
    
    setRemoving(fileToDelete.id);
    setShowDeleteConfirm(false);
    
    try {
      console.log('PatientFileGallery: Eliminando archivo (soft delete):', fileToDelete.id);
      await api.files.remove(fileToDelete.id);
      console.log('PatientFileGallery: Archivo eliminado exitosamente, refrescando lista...');
      onFileRemoved();
    } catch (error) {
      console.error('Error removing file:', error);
      onError(error instanceof Error ? error.message : 'Error al eliminar archivo');
    } finally {
      setRemoving(null);
      setFileToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  };

  const handleEditFile = (file: PatientFile) => {
    setEditingFile(file.id);
    setEditedName(file.name);
  };

  const handleSaveEdit = async (fileId: string) => {
    if (!editedName.trim()) {
      onError('El nombre no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      await api.files.updateName(fileId, editedName.trim());
      setEditingFile(null);
      setEditedName('');
      onFileRemoved(); // Refresh the file list
    } catch (error) {
      console.error('Error updating file name:', error);
      onError(error instanceof Error ? error.message : 'Error al actualizar el nombre del archivo');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditedName('');
  };

  const getThumbnailDisplay = (file: PatientFile) => {
    if (file.thumbnail_url) {
      return (
        <img
          src={file.thumbnail_url}
          alt={file.name}
          className="w-full h-32 object-cover rounded-t-lg"
          onError={(e) => {
            // If thumbnail fails to load, show icon instead
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const icon = target.nextElementSibling as HTMLElement;
            if (icon) icon.style.display = 'flex';
          }}
        />
      );
    }

    const FileIcon = getFileIcon(file.type);
    return (
      <div 
        className="w-full h-32 flex items-center justify-center rounded-t-lg"
        style={{ background: `${currentTheme.colors.primary}10` }}
      >
        <FileIcon 
          className="h-12 w-12" 
          style={{ color: currentTheme.colors.primary }} 
        />
      </div>
    );
  };

  if (files.length === 0) {
    return (
      <div 
        className="text-center py-12 rounded-lg border-2 border-dashed"
        style={{ 
          borderColor: currentTheme.colors.border,
          background: currentTheme.colors.background 
        }}
      >
        <File 
          className="h-12 w-12 mx-auto mb-4 opacity-50" 
          style={{ color: currentTheme.colors.textSecondary }} 
        />
        <p 
          className="text-lg font-medium mb-2"
          style={{ color: currentTheme.colors.text }}
        >
          No hay archivos subidos
        </p>
        <p 
          className="text-sm"
          style={{ color: currentTheme.colors.textSecondary }}
        >
          Los archivos subidos aparecerán aquí en una galería interactiva
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 
          className="text-lg font-medium"
          style={{ color: currentTheme.colors.text }}
        >
          Galería de Archivos ({files.length})
        </h3>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Upload Card - Always first */}
        {uploadComponent && (
          <div className="col-span-1">
            {uploadComponent}
          </div>
        )}
        
        {/* Existing Files */}
        {files.map((file) => {
          const FileIcon = getFileIcon(file.type);
          
          return (
            <div
              key={file.id}
              className="group relative cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              style={{
                background: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              }}
              onClick={() => handleFileClick(file)}
            >
              {/* Thumbnail/Icon Section */}
              <div className="relative">
                {getThumbnailDisplay(file)}
                
                {/* File type badge */}
                <div 
                  className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white'
                  }}
                >
                  {file.type.split('/').pop()?.toUpperCase() || 'FILE'}
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {/* AI Analysis/Edit button - Para PDFs e imágenes médicas */}
                  {(file.type === 'application/pdf' || file.type.startsWith('image/')) && onProcessWithAI && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onProcessWithAI(file);
                      }}
                      className={clsx(
                        "p-2 rounded-full text-white transition-all duration-200",
                        file.has_metadata
                          ? "bg-blue-500 hover:bg-blue-600" 
                          : "bg-purple-500 hover:bg-purple-600"
                      )}
                      title={
                        file.has_metadata
                          ? 'Editar datos extraídos' 
                          : (file.type.startsWith('image/') ? 'Analizar imagen con IA' : 'Analizar documento con IA')
                      }
                      data-tooltip-delay="100"
                      style={{ pointerEvents: 'auto' }}
                    >
                      {file.has_metadata ? (
                        <ClipboardPen className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  
                  {/* Edit button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditFile(file);
                    }}
                    disabled={removing === file.id || editingFile === file.id}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    title="Editar nombre"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFile(file);
                    }}
                    disabled={removing === file.id || editingFile === file.id}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    title="Eliminar archivo"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {removing === file.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* View overlay */}
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-t-lg flex items-center justify-center pointer-events-none"
                >
                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* File Info Section */}
              <div className="p-3">
                {editingFile === file.id ? (
                  <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full text-sm font-medium px-2 py-1 rounded border"
                      style={{
                        background: currentTheme.colors.surface,
                        color: currentTheme.colors.text,
                        borderColor: currentTheme.colors.border
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(file.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleSaveEdit(file.id)}
                        disabled={saving}
                        className="flex-1 px-2 py-1 text-xs rounded"
                        style={{
                          background: currentTheme.colors.primary,
                          color: 'white'
                        }}
                      >
                        {saving ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            <span>Guardando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <Save className="h-3 w-3" />
                            <span>Guardar</span>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-2 py-1 text-xs rounded"
                        style={{
                          background: currentTheme.colors.surface,
                          color: currentTheme.colors.text,
                          border: `1px solid ${currentTheme.colors.border}`
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <h4 
                    className="text-sm font-medium truncate mb-1"
                    style={{ color: currentTheme.colors.text }}
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                )}

                {/* File metadata */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                    <Calendar className="h-3 w-3" />
                    <span>Subido: {formatDate(file.created_at)}</span>
                  </div>
                  
                  {file.fecha_ultima_consulta && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                      <Clock className="h-3 w-3" />
                      <span>Visto: {formatDate(file.fecha_ultima_consulta)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                    <span>{file.numero_consultas} consulta{file.numero_consultas !== 1 ? 's' : ''}</span>
                    {file.type.startsWith('image/') && (
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ 
                          background: `${currentTheme.colors.primary}20`,
                          color: currentTheme.colors.primary 
                        }}
                      >
                        IMG
                      </span>
                    )}
                    {file.type === 'application/pdf' && (
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ 
                          background: '#FEE2E2',
                          color: '#DC2626' 
                        }}
                      >
                        PDF
                      </span>
                    )}
                    {file.type.includes('word') && (
                      <span 
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{ 
                          background: '#DBEAFE',
                          color: '#2563EB' 
                        }}
                      >
                        DOC
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={previewImageUrl}
        imageName={previewImageName}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        title="Confirmar eliminación"
        actions={
          <div className="flex gap-3">
            <button
              onClick={cancelDelete}
              className={clsx(
                'px-4 py-2 transition-colors',
                currentTheme.buttons?.style === 'pill' && 'rounded-full',
                currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
                currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md'
              )}
              style={{
                background: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                border: `1px solid ${currentTheme.colors.border}`
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmRemove}
              className={clsx(
                'px-4 py-2 transition-colors',
                currentTheme.buttons?.style === 'pill' && 'rounded-full',
                currentTheme.buttons?.style === 'rounded' && 'rounded-lg',
                currentTheme.buttons?.shadow && 'shadow-sm hover:shadow-md'
              )}
              style={{
                background: '#DC2626',
                color: 'white'
              }}
            >
              Eliminar
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-4">
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#FEE2E2' }}
          >
            <AlertTriangle className="h-6 w-6" style={{ color: '#DC2626' }} />
          </div>
          <div className="flex-1">
            <p className="mb-2" style={{ color: currentTheme.colors.text }}>
              ¿Está seguro de que desea eliminar este archivo?
            </p>
            {fileToDelete && (
              <p 
                className="text-sm font-medium mb-2 px-3 py-2 rounded"
                style={{ 
                  background: currentTheme.colors.background,
                  color: currentTheme.colors.text 
                }}
              >
                {fileToDelete.name}
              </p>
            )}
            <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
              Esta acción no se puede deshacer. El archivo será eliminado permanentemente del sistema.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}