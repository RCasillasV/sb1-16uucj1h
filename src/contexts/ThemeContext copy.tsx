import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Theme, ThemeType } from '../types/theme';
import { themes } from '../types/theme';

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: ThemeType) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  buttonStyle: Theme['buttons']['style'];
  setButtonStyle: (style: Theme['buttons']['style']) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const FONT_SIZE_KEY = 'app-font-size';
const THEME_KEY = 'app-theme';
const BUTTON_STYLE_KEY = 'app-button-style';

// Load preferences synchronously on module load for instant theme
const loadStoredPreferences = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    const savedButtonStyle = localStorage.getItem(BUTTON_STYLE_KEY);

    return {
      theme: savedTheme && themes[savedTheme as ThemeType] ? themes[savedTheme as ThemeType] : themes.light,
      fontSize: savedFontSize ? Number(savedFontSize) : 100,
      buttonStyle: (savedButtonStyle as Theme['buttons']['style']) || 'rounded'
    };
  } catch (error) {
    console.error('Error loading theme preferences:', error);
    return {
      theme: themes.light,
      fontSize: 100,
      buttonStyle: 'rounded' as Theme['buttons']['style']
    };
  }
};

const initialPreferences = loadStoredPreferences();

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(initialPreferences.theme);
  const [fontSize, setFontSize] = useState(initialPreferences.fontSize);
  const [buttonStyle, setButtonStyle] = useState<Theme['buttons']['style']>(initialPreferences.buttonStyle);

  // Memoize CSS variable updates to avoid recalculations
  const cssVariables = useMemo(() => {
    const vars: Record<string, string> = {};

    // Colors
    for (const key in currentTheme.colors) {
      if (Object.prototype.hasOwnProperty.call(currentTheme.colors, key)) {
        vars[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = (currentTheme.colors as any)[key];
      }
    }

    // Fonts
    vars['--font-headings'] = `"${currentTheme.typography?.fonts?.headings || 'Inter'}", sans-serif`;
    vars['--font-subheadings'] = `"${currentTheme.typography?.fonts?.subheadings || 'Inter'}", sans-serif`;
    vars['--font-body'] = `"${currentTheme.typography?.fonts?.body || 'Inter'}", sans-serif`;
    vars['--font-ui'] = `"${currentTheme.typography?.fonts?.ui || 'Inter'}", sans-serif`;
    vars['--user-font-size-percentage'] = String(fontSize);

    return vars;
  }, [currentTheme, fontSize]);

  // Apply CSS variables efficiently
  useEffect(() => {
    const root = document.documentElement;
    requestAnimationFrame(() => {
      for (const [property, value] of Object.entries(cssVariables)) {
        root.style.setProperty(property, value);
      }
    });
  }, [cssVariables]);

  const setTheme = (themeId: ThemeType) => {
    setCurrentTheme(themes[themeId]);
    localStorage.setItem(THEME_KEY, themeId);
  };

  const handleSetFontSize = (size: number) => {
    setFontSize(size);
    try {
      localStorage.setItem(FONT_SIZE_KEY, String(size));
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  };

  const handleSetButtonStyle = (style: Theme['buttons']['style']) => {
    setButtonStyle(style);
    try {
      localStorage.setItem(BUTTON_STYLE_KEY, style);
    } catch (error) {
      console.error('Error saving button style:', error);
    }
  };

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentTheme, 
    setTheme, 
    fontSize, 
    setFontSize: handleSetFontSize,
    buttonStyle,
    setButtonStyle: handleSetButtonStyle,
  }), [currentTheme, fontSize, buttonStyle]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
