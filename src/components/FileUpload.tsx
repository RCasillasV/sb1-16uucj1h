import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import imageCompression from 'browser-image-compression';
import { ImagePreviewModal } from './ImagePreviewModal';
import clsx from 'clsx';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  initialFiles?: UploadedFile[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  bucketName?: string;
  folder?: string;
  className?: string;
  enableImageCompression?: boolean;
  imageCompressionOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  };
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// Validate required environment variables
const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB);
const BUCKET_NAME = import.meta.env.VITE_BUCKET_NAME;

if (!MAX_FILE_SIZE_MB || isNaN(MAX_FILE_SIZE_MB)) {
  throw new Error('VITE_MAX_FILE_SIZE_MB environment variable is required and must be a valid number');
}

if (!BUCKET_NAME) {
  throw new Error('VITE_BUCKET_NAME environment variable is required');
}

export function FileUpload({
  onFilesUploaded,
  initialFiles = [],
  maxFiles = 5,
  maxFileSize = MAX_FILE_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  bucketName = BUCKET_NAME,
  folder = 'uploads',
  className = '',
  enableImageCompression = true,
  imageCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
}: FileUploadProps) {
  const { currentTheme } = useTheme();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageName, setPreviewImageName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update uploaded files when initialFiles changes
  useEffect(() => {
    setUploadedFiles(initialFiles);
  }, [initialFiles]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressImageIfNeeded = async (file: File): Promise<File> => {
    // Only compress if it's an image and compression is enabled
    if (!enableImageCompression || !file.type.startsWith('image/')) {
      return file;
    }

    // Only compress JPEG and PNG files
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return file;
    }

    try {
      const options = {
        maxSizeMB: imageCompressionOptions.maxSizeMB || 1,
        maxWidthOrHeight: imageCompressionOptions.maxWidthOrHeight || 1920,
        useWebWorker: imageCompressionOptions.useWebWorker !== false,
        fileType: file.type,
        initialQuality: 0.7,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Create a new File object with the original name but compressed content
      const newFile = new window.File([compressedFile], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });

      return newFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      // If compression fails, return the original file
      return file;
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `El archivo ${file.name} excede el tamaño máximo de ${maxFileSize}MB`;
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}`;
    }

    // Check total files limit
    if (uploadedFiles.length >= maxFiles) {
      return `Máximo ${maxFiles} archivos permitidos`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuario no autenticado');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      id: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      path: filePath
    };
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    setCompressing(true);

    const filesToUpload = Array.from(files);
    const validationErrors: string[] = [];

    // Validate all files first
    for (const file of filesToUpload) {
      const validationError = validateFile(file);
      if (validationError) {
        validationErrors.push(validationError);
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setUploading(false);
      setCompressing(false);
      return;
    }

    try {
      // Compress images if needed
      const processedFiles: File[] = [];
      for (const file of filesToUpload) {
        const processedFile = await compressImageIfNeeded(file);
        processedFiles.push(processedFile);
      }
      
      setCompressing(false);

      // Upload files sequentially to avoid overwhelming the server
      const uploadPromises = processedFiles.map(file => uploadFile(file));
      const uploadedFileResults = await Promise.all(uploadPromises);

      const newUploadedFiles = [...uploadedFiles, ...uploadedFileResults];
      setUploadedFiles(newUploadedFiles);
      
      if (onFilesUploaded) {
        onFilesUploaded(newUploadedFiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivos');
    } finally {
      setUploading(false);
      setCompressing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = async (fileToRemove: UploadedFile) => {
    try {
      // Remove from Supabase storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileToRemove.path]);

      if (error) {
        console.error('Error removing file from storage:', error);
      }

      // Remove from local state
      const newFiles = uploadedFiles.filter(file => file.id !== fileToRemove.id);
      setUploadedFiles(newFiles);
      
      if (onFilesUploaded) {
        onFilesUploaded(newFiles);
      }
    } catch (err) {
      console.error('Error removing file:', err);
    }
  };

  const isImageFile = (type: string): boolean => {
    return type === 'image/jpeg' || type === 'image/png';
  };

  const handleViewFile = (file: UploadedFile) => {
    if (isImageFile(file.type)) {
      setPreviewImageUrl(file.url);
      setPreviewImageName(file.name);
      setShowImagePreview(true);
    } else {
      // For non-image files, open in new tab
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }
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

  const isProcessing = uploading || compressing;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          isProcessing && 'pointer-events-none opacity-50'
        )}
        style={{
          borderColor: dragActive ? currentTheme.colors.primary : currentTheme.colors.border,
          backgroundColor: dragActive ? `${currentTheme.colors.primary}10` : currentTheme.colors.surface,
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center">
          {isProcessing ? (
            <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: currentTheme.colors.primary }} />
          ) : (
            <Upload className="h-12 w-12 mb-4" style={{ color: currentTheme.colors.primary }} />
          )}
          
          <h3 className="text-lg font-medium mb-2" style={{ color: currentTheme.colors.text }}>
            {compressing ? 'Comprimiendo imágenes...' : uploading ? 'Subiendo archivos...' : 'Subir archivos'}
          </h3>
          
          <p className="text-sm mb-2" style={{ color: currentTheme.colors.textSecondary }}>
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          
          <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
            Máximo {maxFiles} archivos, {maxFileSize}MB cada uno
          </p>
          
          <p className="text-xs mt-1" style={{ color: currentTheme.colors.textSecondary }}>
            Tipos permitidos: PDF, DOC, DOCX, TXT, JPG, PNG, GIF
          </p>
          
          {enableImageCompression && (
            <p className="text-xs mt-1" style={{ color: currentTheme.colors.primary }}>
              Las imágenes JPG/PNG se comprimen automáticamente
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="flex items-center gap-2 p-3 rounded-md"
          style={{
            background: '#FEE2E2',
            color: '#DC2626',
          }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium" style={{ color: currentTheme.colors.text }}>
            Archivos subidos ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2">
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-md border"
                  style={{
                    background: currentTheme.colors.surface,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <FileIcon className="h-5 w-5 shrink-0" style={{ color: currentTheme.colors.primary }} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: currentTheme.colors.text }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    
                    <button
                      onClick={() => handleViewFile(file)}
                      className="text-xs px-2 py-1 rounded hover:bg-black/5 transition-colors"
                      style={{ color: currentTheme.colors.primary }}
                    >
                      Ver
                    </button>
                    
                    <button
                      onClick={() => removeFile(file)}
                      className="p-1 rounded-full hover:bg-black/5 transition-colors"
                      title="Eliminar archivo"
                    >
                      <X className="h-4 w-4" style={{ color: currentTheme.colors.textSecondary }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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