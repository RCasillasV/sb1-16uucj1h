import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, imageName }: ImagePreviewModalProps) {
  const { currentTheme } = useTheme();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setIsFullscreen(false);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageName || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  if (!isOpen) return null;

  const buttonStyle = {
    base: clsx(
      'p-2 transition-colors',
      currentTheme.buttons.style === 'pill' && 'rounded-full',
      currentTheme.buttons.style === 'rounded' && 'rounded-lg',
      currentTheme.buttons.shadow && 'shadow-sm hover:shadow-md',
      currentTheme.buttons.animation && 'hover:scale-105'
    ),
    primary: {
      background: currentTheme.colors.buttonPrimary,
      color: currentTheme.colors.buttonText,
    },
    secondary: {
      background: 'rgba(0, 0, 0, 0.5)',
      color: '#FFFFFF',
    },
  };

  return (
    <div 
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center',
        isFullscreen ? 'bg-black' : 'bg-black/80'
      )}
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        ref={containerRef}
        className={clsx(
          'relative w-full h-full max-w-7xl max-h-full',
          isFullscreen ? 'w-screen h-screen' : 'w-[90vw] h-[90vh] rounded-lg overflow-hidden'
        )}
        style={{
          background: isFullscreen ? 'black' : currentTheme.colors.surface,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div 
          className={clsx(
            'absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4',
            'bg-gradient-to-b from-black/50 to-transparent'
          )}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate max-w-xs">
              {imageName || 'Vista previa de imagen'}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Alejar (tecla -)"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            
            <span className="text-white text-sm font-mono min-w-[4rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Acercar (tecla +)"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            
            <button
              onClick={resetZoom}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Restablecer zoom (tecla 0)"
            >
              <span className="text-xs font-bold">1:1</span>
            </button>
            
            <button
              onClick={handleRotate}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Rotar (tecla R)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Pantalla completa (tecla F)"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Descargar imagen"
            >
              <Download className="h-5 w-5" />
            </button>
            
            <button
              onClick={onClose}
              className={buttonStyle.base}
              style={buttonStyle.secondary}
              title="Cerrar (Escape)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ 
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          {!imageLoaded && !imageError && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              <span className="ml-3 text-white">Cargando imagen...</span>
            </div>
          )}

          {imageError && (
            <div className="flex flex-col items-center justify-center text-white">
              <X className="h-12 w-12 mb-2 opacity-50" />
              <p>Error al cargar la imagen</p>
            </div>
          )}

          <img
            ref={imageRef}
            src={imageUrl}
            alt={imageName || 'Vista previa'}
            className={clsx(
              'max-w-none transition-transform duration-200 select-none',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              transformOrigin: 'center center',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error('Image loading error:', {
                imageUrl,
                imageName,
                error: e,
                target: e.target,
                naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                naturalHeight: (e.target as HTMLImageElement).naturalHeight,
                complete: (e.target as HTMLImageElement).complete,
                currentSrc: (e.target as HTMLImageElement).currentSrc
              });
              console.error('DETAILED IMAGE ERROR: Failed to load image from URL:', imageUrl);
              console.error('IMAGE URL ANALYSIS: URL structure:', {
                hasToken: imageUrl.includes('token='),
                isSignedUrl: imageUrl.includes('/sign/'),
                bucketName: imageUrl.includes('00000000-default-bucket') ? '00000000-default-bucket' : 'Unknown bucket'
              });
              setImageError(true);
            }}
            draggable={false}
          />
        </div>

        {/* Bottom Instructions */}
        {imageLoaded && (
          <div 
            className={clsx(
              'absolute bottom-0 left-0 right-0 p-4',
              'bg-gradient-to-t from-black/50 to-transparent'
            )}
          >
            <div className="flex justify-center">
              <div className="text-white text-xs opacity-75 text-center">
                <p>Usa la rueda del ratón para hacer zoom • Arrastra para mover • Teclas: +/- (zoom), 0 (reset), R (rotar), F (pantalla completa), Esc (cerrar)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}