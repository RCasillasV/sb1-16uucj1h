import React, { useState } from 'react';
import { FileText, Image, File, Eye, Trash2, Calendar, Clock, Download, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ImagePreviewModal } from './ImagePreviewModal';
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
}

interface PatientFileGalleryProps {
  files: PatientFile[];
  onFileRemoved: () => void;
  onError: (error: string) => void;
  onFileAccessed?: () => void; // New prop to trigger refresh when file is accessed
}

export function PatientFileGallery({ files, onFileRemoved, onError, onFileAccessed }: PatientFileGalleryProps) {
  const { currentTheme } = useTheme();
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageName, setPreviewImageName] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

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
      console.log('PATIENT_FILE_GALLERY: File path:', file.path, 'Type:', file.type);
      
      // Check if URL is still valid before trying to access
      if (!file.url || file.url.includes('error')) {
        throw new Error('URL del archivo no disponible o expirada');
      }
      
      console.log('PATIENT_FILE_GALLERY: Tracking file access for file ID:', file.id);
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
      onError(`Error al acceder al archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleRemoveFile = async (file: PatientFile, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering file click
    
    if (!confirm(`¿Está seguro de eliminar "${file.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setRemoving(file.id);
    try {
      await api.files.remove(file.id);
      onFileRemoved();
    } catch (error) {
      console.error('Error removing file:', error);
      onError(error instanceof Error ? error.message : 'Error al eliminar archivo');
    } finally {
      setRemoving(null);
    }
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

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemoveFile(file, e)}
                  disabled={removing === file.id}
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  title="Eliminar archivo"
                >
                  {removing === file.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>

                {/* View overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* File Info Section */}
              <div className="p-3">
                <h4 
                  className="text-sm font-medium truncate mb-1"
                  style={{ color: currentTheme.colors.text }}
                  title={file.name}
                >
                  {file.name}
                </h4>

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
    </div>
  );
}