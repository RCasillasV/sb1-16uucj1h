import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Retrasa la actualización del valor hasta que el usuario deje de escribir
 * 
 * @param value - Valor a debounce
 * @param delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns Valor debounced
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * // debouncedSearch solo se actualiza 300ms después de que el usuario deja de escribir
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancela el timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
