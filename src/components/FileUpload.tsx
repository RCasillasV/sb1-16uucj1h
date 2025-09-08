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
  onFilesUploaded?: (newlyUploadedFile: UploadedFile) => void; // Callback for each newly uploaded file
  onUploadError?: (errorMessage: string) => void; // Callback for upload errors
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
  onFilesUploaded, // Callback for each newly uploaded file
  onUploadError, // Callback for upload errors
  maxFileSize = MAX_FILE_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  bucketName = BUCKET_NAME,
  folder = 'uploads',
  className = '',
  enableImageCompression = true,
  imageCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
  }
}: FileUploadProps) {
  const { currentTheme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageName, setPreviewImageName] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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


    return null;
  };

  const uploadFile = async (file: File, description: string): Promise<UploadedFile> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Usuario no autenticado');
    }

    // Extract patient ID from folder prop
    const patientId = folder.split('/').pop() || '';
    if (!patientId || patientId === 'new') {
      throw new Error('ID de paciente requerido para subir archivos');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Debug logging for file upload
    console.log('FILEUPLOAD: Starting upload process');
    console.log('FILEUPLOAD: Bucket name from env:', bucketName);
    console.log('FILEUPLOAD: Full file path:', filePath);
    console.log('FILEUPLOAD: Patient ID:', patientId);
    console.log('FILEUPLOAD: File name:', fileName);
    console.log('FILEUPLOAD: File type:', file.type);
    console.log('FILEUPLOAD: File size:', file.size);
    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    console.log('FILEUPLOAD: Upload response data:', data);
    console.log('FILEUPLOAD: Upload response error:', error);
    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (file.type.startsWith('image/')) {
      try {
        // Create a smaller thumbnail for gallery display
        const thumbnailFile = await imageCompression(file, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 300,
          useWebWorker: true,
          fileType: file.type,
          initialQuality: 0.6
        });

        // Upload thumbnail to separate subfolder
        const thumbnailFileName = `thumb_${fileName}`;
        const thumbnailPath = `thumbnails/${folder}/${thumbnailFileName}`;

        console.log('FILEUPLOAD: Thumbnail path:', thumbnailPath);
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from(bucketName)
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (!thumbnailError) {
          thumbnailUrl = thumbnailPath; // Store path instead of URL
          console.log('FILEUPLOAD: Thumbnail uploaded successfully to:', thumbnailPath);
        }
      } catch (thumbnailError) {
        console.error('Error creating thumbnail:', thumbnailError);
        // Continue without thumbnail if generation fails
      }
    }

    // Save file metadata to database using the new API
    try {
      const { api } = await import('../lib/api');
      console.log('FILEUPLOAD: Saving to database with path:', filePath);
      await api.files.create({
        patient_id: patientId,
        description: description, // Use the provided description instead of file name
        file_path: filePath, // Store only the path, not the URL
        mime_type: file.type,
        thumbnail_url: thumbnailUrl // Store only the path, not the URL
      });
      console.log('FILEUPLOAD: Database record created successfully');
    } catch (dbError) {
      // If database insert fails, remove the uploaded files
      console.error('FILEUPLOAD: Database insert failed, cleaning up storage files:', dbError);
      await supabase.storage.from(bucketName).remove([filePath]);
      if (thumbnailUrl) {
        await supabase.storage.from(bucketName).remove([thumbnailUrl]);
      }
      throw new Error(`Error guardando metadata del archivo: ${dbError instanceof Error ? dbError.message : 'Error desconocido'}`);
    }

    // Generate signed URL for immediate return (for UI purposes) only if upload was successful
    let signedUrl = filePath; // Default fallback
    try {
      console.log('FILEUPLOAD: Generating signed URL for:', filePath);
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (signedError) {
        console.warn('Warning: Could not generate signed URL for uploaded file:', signedError);
        // Use the path as fallback
      } else if (signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
        console.log('FILEUPLOAD: Generated signed URL:', signedUrl);
      }
    } catch (urlError) {
      console.warn('Exception generating signed URL for uploaded file:', urlError);
      // Use path as fallback
    }

    console.log('FILEUPLOAD: Upload completed successfully');
    return {
      id: data.path,
      name: description, // Use description as the display name
      size: file.size,
      type: file.type,
      url: signedUrl, // Return signed URL or path fallback
      path: filePath,
    };
  };

  const handleFiles = async (files: FileList) => {
    setError(null);

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
      if (onUploadError) {
        onUploadError(validationErrors.join(', '));
      }
      return;
    }

    // Set pending files and show description modal
    setPendingFiles(filesToUpload);
    const initialDescriptions: { [key: string]: string } = {};
    filesToUpload.forEach(file => {
      initialDescriptions[file.name] = ''; // Start with empty descriptions
    });
    setPendingDescriptions(initialDescriptions);
    setShowDescriptionModal(true);
  };

  const handleUploadWithDescriptions = async () => {
    setError(null);
    setUploading(true);
    setCompressing(true);

    try {
      // Compress images if needed
      const processedFiles: File[] = [];
      for (const file of pendingFiles) {
        const processedFile = await compressImageIfNeeded(file);
        processedFiles.push(processedFile);
      }
      
      setCompressing(false);

      // Upload files sequentially and notify parent for each upload
      for (const file of processedFiles) {
        const description = pendingDescriptions[file.name] || file.name;
        const uploadedFile = await uploadFile(file, description);
        
        // Call onFilesUploaded for each newly uploaded file
        if (onFilesUploaded) {
          onFilesUploaded(uploadedFile);
        }
      }

      // Clear pending state
      setPendingFiles([]);
      setPendingDescriptions({});
      setShowDescriptionModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivos');
      if (onUploadError) {
        onUploadError(err instanceof Error ? err.message : 'Error al subir archivos');
      }
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

  const isImageFile = (type: string): boolean => {
    return type === 'image/jpeg' || type === 'image/png';
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

      {/* File Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full max-w-2xl rounded-lg shadow-xl"
            style={{ 
              background: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            }}
          >
            <div className="p-6">
              <h3 
                className="text-lg font-medium mb-4"
                style={{ color: currentTheme.colors.text }}
              >
                Describe los archivos a subir
              </h3>
              <p 
                className="text-sm mb-6"
                style={{ color: currentTheme.colors.textSecondary }}
              >
                Proporciona una descripción clara para cada archivo que ayude a identificar su contenido médico.
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingFiles.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`}
                    className="p-4 border rounded-lg"
                    style={{
                      background: currentTheme.colors.background,
                      borderColor: currentTheme.colors.border,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {(() => {
                          const Icon = getFileIcon(file.type);
                          return <Icon className="h-8 w-8" style={{ color: currentTheme.colors.primary }} />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <p 
                          className="font-medium mb-1"
                          style={{ color: currentTheme.colors.text }}
                        >
                          {file.name}
                        </p>
                        <p 
                          className="text-sm mb-2"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          {formatFileSize(file.size)} • {file.type.split('/').pop()?.toUpperCase()}
                        </p>
                        <div>
                          <label 
                            className="block text-sm font-medium mb-1"
                            style={{ color: currentTheme.colors.text }}
                          >
                            Descripción del documento:
                          </label>
                          <input
                            type="text"
                            value={pendingDescriptions[file.name] || ''}
                            onChange={(e) => {
                              setPendingDescriptions(prev => ({
                                ...prev,
                                [file.name]: e.target.value
                              }));
                            }}
                            placeholder="Ej: Rayos X de rodilla, Análisis de sangre, Tomografía..."
                            className="w-full p-2 text-sm rounded-md border"
                            style={{
                              background: currentTheme.colors.surface,
                              borderColor: currentTheme.colors.border,
                              color: currentTheme.colors.text,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
                <button
                  onClick={() => {
                    setShowDescriptionModal(false);
                    setPendingFiles([]);
                    setPendingDescriptions({});
                  }}
                  className={clsx(buttonStyle.base, 'border')}
                  style={{
                    background: 'transparent',
                    borderColor: currentTheme.colors.border,
                    color: currentTheme.colors.text,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUploadWithDescriptions}
                  disabled={isProcessing}
                  className={clsx(buttonStyle.base, 'disabled:opacity-50')}
                  style={buttonStyle.primary}
                >
                  {isProcessing ? (compressing ? 'Comprimiendo...' : 'Subiendo...') : 'Subir Archivos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}