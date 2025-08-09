import { useTheme } from '../contexts/ThemeContext';
import { useMemo } from 'react';
import clsx from 'clsx';

export function useStyles() {
  const { currentTheme, buttonStyle } = useTheme();

  const buttonClasses = useMemo(() => {
    return {
      base: clsx(
        'btn',
        'btn-md',
        buttonStyle === 'pill' && 'btn-pill',
        buttonStyle === 'rounded' && 'btn-rounded',
        buttonStyle === 'square' && 'btn-square',
        currentTheme.buttons.shadow && 'btn-shadow'
      ),
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg'
    };
  }, [buttonStyle, currentTheme.buttons.shadow]);
  return {
    buttonClasses,
    theme: currentTheme
  };
}