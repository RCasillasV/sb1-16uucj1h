// src/components/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface TooltipProps {
  children: React.ReactElement; // El elemento que activará el tooltip (ej. <Info />)
  text: string; // El texto que se mostrará en el tooltip
}

export function Tooltip({ children, text }: TooltipProps) {
  const { currentTheme } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);
  const handleFocus = () => setShowTooltip(true);
  const handleBlur = () => setShowTooltip(false);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const calculatePosition = () => {
        if (!triggerRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Posicionar el tooltip encima del icono, centrado horizontalmente
        // Usar coordenadas fijas del viewport
        let top = triggerRect.top + scrollY - 40; // 40px arriba del trigger
        let left = triggerRect.left + scrollX + (triggerRect.width / 2) - 100; // Centrado, asumiendo ancho de tooltip ~200px
        
        // Ajustar si se sale por la parte superior de la pantalla
        if (top < scrollY + 10) {
          top = triggerRect.bottom + scrollY + 8; // Posicionar debajo si no hay espacio arriba
        }
        
        // Ajustar si se sale por los lados de la pantalla
        if (left < scrollX + 10) {
          left = scrollX + 10;
        } else if (left + 200 > scrollX + window.innerWidth - 10) {
          left = scrollX + window.innerWidth - 210;
        }
        
        setPosition({ top, left });
      };
      
      // Calcular posición inmediatamente
      calculatePosition();
      
      // Recalcular en scroll y resize
      const handleScroll = () => calculatePosition();
      const handleResize = () => calculatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showTooltip, text]);

  // Clonar el children para añadir los manejadores de eventos
  const triggerElement = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    // Eliminar el atributo title nativo para evitar conflictos
    title: undefined,
  });

  return (
    <div ref={triggerRef} className="relative inline-block">
      {triggerElement}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={clsx(
            "fixed z-[9999] px-3 py-2 text-sm rounded-md shadow-lg max-w-xs",
            "transition-opacity duration-200 pointer-events-none"
          )}
          style={{
            top: position.top,
            left: position.left,
            backgroundColor: currentTheme.colors.surface,
            color: currentTheme.colors.text,
            borderColor: currentTheme.colors.border,
            borderWidth: '1px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            opacity: showTooltip ? 1 : 0,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
