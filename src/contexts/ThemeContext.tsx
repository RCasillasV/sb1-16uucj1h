import React, { createContext, useContext, useState, useEffect } from 'react';
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.light);
  const [fontSize, setFontSize] = useState(100);
  const [buttonStyle, setButtonStyle] = useState<Theme['buttons']['style']>('rounded');

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    const savedButtonStyle = localStorage.getItem(BUTTON_STYLE_KEY);

    if (savedTheme && themes[savedTheme as ThemeType]) {
      setCurrentTheme(themes[savedTheme as ThemeType]);
    }
    if (savedFontSize) {
      setFontSize(Number(savedFontSize));
    }
    if (savedButtonStyle) {
      setButtonStyle(savedButtonStyle as Theme['buttons']['style']);
    }
  }, []);

  // Apply theme colors and font size as CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Apply colors
    for (const key in currentTheme.colors) {
      if (Object.prototype.hasOwnProperty.call(currentTheme.colors, key)) {
        root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, (currentTheme.colors as any)[key]);
      }
    }

    // Apply fonts
    root.style.setProperty('--font-headings', `"${currentTheme.typography.fonts.headings}", sans-serif`);
    root.style.setProperty('--font-subheadings', `"${currentTheme.typography.fonts.subheadings}", sans-serif`);
    root.style.setProperty('--font-body', `"${currentTheme.typography.fonts.body}", sans-serif`);
    root.style.setProperty('--font-ui', `"${currentTheme.typography.fonts.ui}", sans-serif`);

    // Apply font size
    root.style.setProperty('--user-font-size-percentage', String(fontSize));
  }, [currentTheme, fontSize]);

  const setTheme = (themeId: ThemeType) => {
    setCurrentTheme(themes[themeId]);
    localStorage.setItem(THEME_KEY, themeId);
  };

  const handleSetFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, String(size));
    // The actual CSS variable update is now handled by the useEffect above
  };

  const handleSetButtonStyle = (style: Theme['buttons']['style']) => {
    setButtonStyle(style);
    localStorage.setItem(BUTTON_STYLE_KEY, style);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        currentTheme, 
        setTheme, 
        fontSize, 
        setFontSize: handleSetFontSize,
        buttonStyle,
        setButtonStyle: handleSetButtonStyle,
      }}
    >
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
