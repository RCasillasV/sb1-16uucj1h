import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../types/theme';
import clsx from 'clsx';

export function AppearanceSettings() {
  const { 
    currentTheme, 
    setTheme, 
    fontSize, 
    setFontSize,
    buttonStyle,
    setButtonStyle,
  } = useTheme();

  return (
    <div className="space-y-8">
      {/* Themes */}
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
          Temas de Color
        </h2>
        <div className="flex flex-wrap gap-3">
          {Object.values(themes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={clsx(
                'p-2 rounded-lg border-2 transition-all transform hover:scale-102 w-[calc(50%-0.375rem)] md:w-[calc(25%-0.75rem)]',
                currentTheme.id === theme.id
                  ? 'shadow-md'
                  : 'hover:border-opacity-50'
              )}
              style={{
                background: theme.colors.surface,
                color: theme.colors.text,
                borderColor: currentTheme.id === theme.id 
                  ? theme.colors.primary
                  : theme.colors.border,
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
          ))}
        </div>
      </div>

      {/* Button Styles */}
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
          {['rounded', 'square', 'pill'].map((style) => (
            <button
              key={style}
              onClick={() => setButtonStyle(style as 'rounded' | 'square' | 'pill')}
              className={clsx(
                'p-3 border-2 transition-all',
                buttonStyle === style
                  ? 'shadow-md'
                  : 'hover:border-opacity-50'
              )}
              style={{
                background: currentTheme.colors.surface,
                borderColor: buttonStyle === style 
                  ? currentTheme.colors.primary 
                  : currentTheme.colors.border,
                color: currentTheme.colors.text,
                borderRadius: style === 'pill' ? '9999px' : style === 'rounded' ? '0.5rem' : '0',
              }}
            >
              <div className="space-y-2">
                <div 
                  className={clsx(
                    'px-3 py-2 text-center text-sm',
                    style === 'pill' && 'rounded-full',
                    style === 'rounded' && 'rounded-lg'
                  )}
                  style={{
                    background: currentTheme.colors.buttonPrimary,
                    color: currentTheme.colors.buttonText,
                    fontFamily: currentTheme.typography.fonts.headings,
                  }}
                >
                  {style === 'rounded' && 'Botón Redondeado'}
                  {style === 'square' && 'Botón Cuadrado'}
                  {style === 'pill' && 'Botón Píldora'}
                </div>
                <p 
                  className="text-xs"
                  style={{ 
                    color: currentTheme.colors.textSecondary,
                    fontFamily: currentTheme.typography.fonts.headings,
                  }}
                >
                  {style === 'rounded' && 'Esquinas suavemente redondeadas'}
                  {style === 'square' && 'Esquinas rectas y minimalistas'}
                  {style === 'pill' && 'Esquinas completamente redondeadas'}
                </p>
              </div>
            </button>
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
              min="80"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: currentTheme.colors.border,
                backgroundImage: `linear-gradient(${currentTheme.colors.primary}, ${currentTheme.colors.primary})`,
                backgroundSize: `${(fontSize - 80) * 100 / 40}% 100%`,
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