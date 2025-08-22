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
    if (showTooltip && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Posicionar el tooltip encima del icono, centrado horizontalmente
      let top = triggerRect.top - tooltipRect.height - 8; // 8px de margen
      let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      // Ajustar si se sale por la parte superior de la pantalla
      if (top < 0) {
        top = triggerRect.bottom + 8; // Posicionar debajo si no hay espacio arriba
      }

      // Ajustar si se sale por los lados de la pantalla
      if (left < 0) {
        left = 0;
      } else if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width;
      }

      setPosition({ top, left });
    }
  }, [showTooltip, text]); // Depende de showTooltip y text para recalcular

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
            "absolute z-50 px-3 py-2 text-sm rounded-md shadow-lg whitespace-nowrap",
            "transition-opacity duration-200 pointer-events-none"
          )}
          style={{
            top: position.top,
            left: position.left,
            backgroundColor: currentTheme.colors.surface,
            color: currentTheme.colors.text,
            borderColor: currentTheme.colors.border,
            borderWidth: '1px',
            opacity: showTooltip ? 1 : 0,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
