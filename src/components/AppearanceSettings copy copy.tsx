import React, { memo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../types/theme';
import clsx from 'clsx';

// Componente memoizado para el botón de tema
const ThemeButton = memo(({ theme, isActive, onClick }: {
  theme: typeof themes[keyof typeof themes];
  isActive: boolean;
  onClick: (id: string) => void;
}) => (
  <button
    onClick={() => onClick(theme.id)}
    className={clsx(
      'p-2 rounded-lg border-2 transition-all transform hover:scale-102 w-[calc(50%-0.375rem)] md:w-[calc(25%-0.75rem)]',
      isActive ? 'shadow-md' : 'hover:border-opacity-50'
    )}
    style={{
      background: theme.colors.surface,
      color: theme.colors.text,
      borderColor: isActive ? theme.colors.primary : theme.colors.border,
      order: theme.id === 'forest-green' ? '0' : theme.id === 'sunset-orange' ? '999' : 'initial'
    }}
  >
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-full h-12 rounded-md"
        style={{ background: theme.colors.primary }}
      />
      <span 
        className="text-sm font-medium"
        style={{ fontFamily: theme.typography.fonts.headings }}
      >
        {theme.name}
      </span>
    </div>
  </button>
));

// Componente memoizado para el botón de estilo
const StyleButton = memo(({ 
  style, 
  isActive, 
  onClick,
  currentTheme 
}: {
  style: 'rounded' | 'square' | 'pill';
  isActive: boolean;
  onClick: (style: 'rounded' | 'square' | 'pill') => void;
  currentTheme: any;
}) => {
  const getStyleName = (style: string) => {
    switch (style) {
      case 'rounded': return 'Redondeado';
      case 'square': return 'Cuadrado';
      case 'pill': return 'Píldora';
      default: return style;
    }
  };

  return (
    <button
      onClick={() => onClick(style)}
      className={clsx(
        'p-3 border-2 transition-all',
        isActive ? 'shadow-md' : 'hover:border-opacity-50',
        {
          'rounded-lg': style === 'rounded',
          'rounded-none': style === 'square',
          'rounded-full': style === 'pill',
        }
      )}
      style={{
        background: currentTheme.colors.surface,
        color: currentTheme.colors.text,
        borderColor: isActive 
          ? currentTheme.colors.primary 
          : currentTheme.colors.border,
      }}
    >
      {getStyleName(style)}
    </button>
  );
});

// Componente principal
export function AppearanceSettings() {
  const { 
    currentTheme, 
    setTheme, 
    fontSize, 
    setFontSize,
    buttonStyle,
    setButtonStyle,
  } = useTheme();

  // Memoizar manejadores de eventos
  const handleThemeChange = useCallback((themeId: string) => {
    setTheme(themeId);
  }, [setTheme]);

  const handleStyleChange = useCallback((style: 'rounded' | 'square' | 'pill') => {
    setButtonStyle(style);
  }, [setButtonStyle]);

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(e.target.value);
  }, [setFontSize]);

  // Componente principal
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Theme */}   
      <div 
        className="rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <h2 
          className="text-lg font-medium mb-4"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fonts.headings,
          }}
        >
          Tema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(themes).map((theme) => (
            <ThemeButton
              key={theme.id}
              theme={theme}
              isActive={currentTheme.id === theme.id}
              onClick={() => handleThemeChange(theme.id)}
            />
          ))}
        </div>
      </div>

      {/* Button Style */}   
      <div 
        className="rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <h2 
          className="text-lg font-medium mb-4"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fonts.headings,
          }}
        >
          Estilo de Botones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['rounded', 'square', 'pill'] as const).map((style) => (
            <StyleButton
              key={style}
              style={style}
              isActive={buttonStyle === style}
              onClick={() => handleStyleChange(style)}
              currentTheme={currentTheme}
            />
          ))}
        </div>
      </div>

      {/* Font Size */}   
      <div 
        className="rounded-lg shadow-lg p-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <h2 
          className="text-lg font-medium mb-4"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fonts.headings,
          }}
        >
          Tamaño de Letra
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: currentTheme.colors.border,
                backgroundImage: `linear-gradient(${currentTheme.colors.primary}, ${currentTheme.colors.primary})`,
                backgroundSize: `${(fontSize - 12) * 100 / 12}% 100%`,
                backgroundRepeat: 'no-repeat'
              }}
            />
            <span 
              className="text-sm font-medium w-12"
              style={{ 
                color: currentTheme.colors.text,
                fontFamily: currentTheme.typography.fonts.headings,
              }}
            >
              {fontSize}%
            </span>
          </div>
          <div 
            className="p-4 rounded-lg"
            style={{ background: currentTheme.colors.background }}
          >
            <p style={{ 
              fontSize: `${fontSize}%`,
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fonts.headings,
            }}>
              Texto de ejemplo - Más vale una onza de salud que una libra de oro. 
            </p>
          </div>
        </div>
      </div>     
    </div>
  );
}