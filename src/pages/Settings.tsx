import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../types/theme';
import clsx from 'clsx';

export function Settings() {
  const { 
    currentTheme, 
    setTheme, 
    fontSize, 
    setFontSize,
    buttonStyle,
    setButtonStyle,
  } = useTheme();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon 
          className="h-5 w-5" 
          style={{ color: currentTheme.colors.text }} 
        />
        <h1 
          className="text-2xl font-bold"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Configuración
        </h1>
      </div>

      {/* Themes */}
      <div 
        className="rounded-lg shadow-lg p-6 mb-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <h2 
          className="text-lg font-medium mb-4"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
          }}
        >
          Temas de Color
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(themes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={clsx(
                'p-2 rounded-lg border-2 transition-all transform hover:scale-102',
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
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-full h-12 rounded-md"
                  style={{ background: theme.colors.primary }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ fontFamily: theme.typography.fontFamily }}
                >
                  {theme.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div 
        className="rounded-lg shadow-lg p-6 mb-6"
        style={{ 
          background: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }}
      >
        <h2 
          className="text-lg font-medium mb-4"
          style={{ 
            color: currentTheme.colors.text,
            fontFamily: currentTheme.typography.fontFamily,
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
                fontFamily: currentTheme.typography.fontFamily,
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
              fontFamily: currentTheme.typography.fontFamily,
            }}>
              Texto de ejemplo - The quick brown fox jumps over the lazy dog
            </p>
          </div>
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
            fontFamily: currentTheme.typography.fontFamily,
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
                    fontFamily: currentTheme.typography.fontFamily,
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
                    fontFamily: currentTheme.typography.fontFamily,
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
    </div>
  );
}