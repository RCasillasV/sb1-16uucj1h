import { useState, useEffect } from 'react';

type FontCategory = 'headings' | 'subheadings' | 'body' | 'ui';
type FontOption = 'Plus Jakarta Sans' | 'Montserrat' | 'Inter' | 'DM Sans';

const DEFAULT_FONTS: Record<FontCategory, FontOption> = {
  headings: 'Plus Jakarta Sans',
  subheadings: 'Montserrat', 
  body: 'Inter',
  ui: 'DM Sans'
};

export function useFont() {
  const [fonts, setFonts] = useState(DEFAULT_FONTS);

  const setFont = (category: FontCategory, font: FontOption) => {
    setFonts(prev => ({
      ...prev,
      [category]: font
    }));
    document.documentElement.style.setProperty(`--font-${category}`, `"${font}", sans-serif`);
  };

  useEffect(() => {
    // Initialize fonts on mount
    Object.entries(fonts).forEach(([category, font]) => {
      document.documentElement.style.setProperty(
        `--font-${category}`, 
        `"${font}", sans-serif`
      );
    });
  }, []);

  return {
    fonts,
    setFont,
    availableFonts: {
      'Plus Jakarta Sans': 'Modern Sans',
      'Montserrat': 'Clean Sans',
      'Inter': 'Readable Sans',
      'DM Sans': 'Friendly Sans'
    } as const
  };
}